// hooks/useBehaviorTracking.ts
// Manages the BehaviorTracker lifecycle and auto-sends signals every 5 seconds.
// Tracking starts immediately on mount — no user interaction required.

import { useEffect, useRef, useState, useCallback } from 'react';
import { BehaviorTracker } from '../components/BehaviorTracker';
import { verifyHumanBehavior, type VerificationResult, type ApiStatus } from '../services/api';
import { buildPayload, computeAnalytics, type AnalyticsMetrics } from '../utils/featureBuilder';

const SEND_INTERVAL_MS = 5000;

export interface BehaviorTrackingState {
  status: ApiStatus;
  result: VerificationResult | null;
  analytics: AnalyticsMetrics;
  error: string | null;
  lastSent: number | null;
}

const defaultAnalytics: AnalyticsMetrics = {
  mouseCount: 0,
  clickFrequency: 0,
  typingSpeed: 0,
  scrollActivity: 0,
  sessionSeconds: 0,
  mouseVelocityAvg: 0,
  mousePathEntropy: 0,
};

// _enabled param kept for API compatibility but always treated as true
export function useBehaviorTracking(_enabled: boolean) {
  const trackerRef = useRef<BehaviorTracker | null>(null);
  const sessionStartRef = useRef<number>(Date.now());
  const sendIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyticsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [state, setState] = useState<BehaviorTrackingState>({
    status: 'collecting',
    result: null,
    analytics: defaultAnalytics,
    error: null,
    lastSent: null,
  });

  const sendSignals = useCallback(async () => {
    const tracker = trackerRef.current;
    if (!tracker) return;

    const signals = tracker.getSignals();
    const hasData =
      signals.mouseMoves.length > 0 ||
      signals.clicks.length > 0 ||
      signals.keystrokes.length > 0;

    if (!hasData) return;

    setState(s => ({ ...s, status: 'analyzing' }));

    try {
      const payload = buildPayload(signals);
      const result = await verifyHumanBehavior(payload);
      setState(s => ({
        ...s,
        status: result.decision === 'human' ? 'success' : 'warning',
        result,
        error: null,
        lastSent: Date.now(),
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      const isOffline =
        msg.includes('fetch') ||
        msg.includes('NetworkError') ||
        msg.includes('Failed to fetch') ||
        msg.includes('ERR_CONNECTION');
      setState(s => ({
        ...s,
        status: isOffline ? 'offline' : 'error',
        error: isOffline
          ? 'Backend offline — running in demo mode'
          : `API error: ${msg}`,
        result: isOffline ? simulateResult(signals) : s.result,
        lastSent: Date.now(),
      }));
    }
  }, []);

  const refreshAnalytics = useCallback(() => {
    const tracker = trackerRef.current;
    if (!tracker) return;
    const signals = tracker.getSignals();
    const analytics = computeAnalytics(signals);
    setState(s => ({ ...s, analytics }));
  }, []);

  // Boot tracker immediately on mount — no user interaction needed
  useEffect(() => {
    sessionStartRef.current = Date.now();
    const tracker = new BehaviorTracker(sessionStartRef.current);
    trackerRef.current = tracker;
    tracker.attach();

    setState(s => ({ ...s, status: 'collecting' }));

    sendIntervalRef.current = setInterval(sendSignals, SEND_INTERVAL_MS);
    analyticsIntervalRef.current = setInterval(refreshAnalytics, 1000);

    return () => {
      tracker.detach();
      if (sendIntervalRef.current) clearInterval(sendIntervalRef.current);
      if (analyticsIntervalRef.current) clearInterval(analyticsIntervalRef.current);
      trackerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerManualSend = useCallback(() => {
    sendSignals();
  }, [sendSignals]);

  return { ...state, triggerManualSend };
}

// ─── Demo simulation when backend is offline ─────────────────────────────────
function simulateResult(signals: ReturnType<BehaviorTracker['getSignals']>): VerificationResult {
  const moveCount = signals.mouseMoves.length;
  const clickCount = signals.clicks.length;
  const keystrokeCount = signals.keystrokes.length;
  const score = Math.min(
    0.45 + moveCount * 0.0015 + clickCount * 0.025 + keystrokeCount * 0.015,
    0.99
  );
  const decision: VerificationResult['decision'] =
    score > 0.75 ? 'human' : score > 0.5 ? 'uncertain' : 'bot';
  return { human_score: Math.round(score * 100) / 100, decision };
}
