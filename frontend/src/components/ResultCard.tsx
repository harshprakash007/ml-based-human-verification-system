// components/ResultCard.tsx
import React from 'react';
import type { VerificationResult } from '../services/api';
import type { ApiStatus } from '../services/api';

interface ResultCardProps {
  status: ApiStatus;
  result: VerificationResult | null;
  error: string | null;
  onFallbackComplete: () => void;
  fallbackDone: boolean;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  status,
  result,
  error,
  onFallbackComplete,
  fallbackDone,
}) => {
  const [sliderValue, setSliderValue] = React.useState(0);
  const [sliderDone, setSliderDone] = React.useState(fallbackDone);

  React.useEffect(() => {
    if (sliderValue >= 95 && !sliderDone) {
      setSliderDone(true);
      onFallbackComplete();
    }
  }, [sliderValue, sliderDone, onFallbackComplete]);

  // ── Collecting ──────────────────────────────────────────────────────────
  if (status === 'idle' || status === 'collecting') {
    return (
      <div className="flex items-center gap-3 py-3">
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-phantom-accent"
              style={{ animation: `dotFlash 1.4s infinite`, animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
        <span className="text-xs font-mono text-phantom-muted tracking-wider uppercase">
          Collecting behavior signals
        </span>
      </div>
    );
  }

  // ── Analyzing ───────────────────────────────────────────────────────────
  if (status === 'analyzing') {
    return (
      <div className="flex items-center gap-3 py-3">
        <div className="w-4 h-4 border-2 border-phantom-accent border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-phantom-accent tracking-wider uppercase animate-pulse">
          Analyzing interaction patterns…
        </span>
      </div>
    );
  }

  // ── Offline / Error ─────────────────────────────────────────────────────
  if (status === 'offline' || status === 'error') {
    const isOffline = status === 'offline';
    return (
      <div className="rounded-lg border border-phantom-yellow/30 bg-phantom-yellow/5 p-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-phantom-yellow text-sm">{isOffline ? '📡' : '⚠'}</span>
          <span className="text-xs font-mono text-phantom-yellow tracking-wider uppercase">
            {isOffline ? 'Demo Mode — Backend Offline' : 'API Error'}
          </span>
        </div>
        {error && <p className="text-xs text-phantom-muted font-mono">{error}</p>}
        {result && <ScoreDisplay result={result} />}
      </div>
    );
  }

  // ── Human ────────────────────────────────────────────────────────────────
  if (status === 'success' && result?.decision === 'human') {
    return (
      <div className="rounded-lg border border-phantom-green/30 bg-phantom-green/5 p-4 animate-slideUp">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-phantom-green animate-pulse" />
            <span className="text-xs font-mono text-phantom-green tracking-widest uppercase">
              Human Verified ✓
            </span>
          </div>
          <span className="text-xs text-phantom-muted font-mono">
            Session cleared
          </span>
        </div>
        <ScoreDisplay result={result} />
      </div>
    );
  }

  // ── Uncertain / Fallback ─────────────────────────────────────────────────
  if (result?.decision === 'uncertain') {
    if (sliderDone || fallbackDone) {
      return (
        <div className="rounded-lg border border-phantom-accent/30 bg-phantom-accent/5 p-4 animate-slideUp">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-phantom-accent animate-pulse" />
            <span className="text-xs font-mono text-phantom-accent tracking-widest uppercase">
              Verification Passed ✓
            </span>
          </div>
          <ScoreDisplay result={result} />
        </div>
      );
    }

    return (
      <div className="rounded-lg border border-phantom-yellow/30 bg-phantom-yellow/5 p-4 animate-slideUp">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-phantom-yellow text-sm">⚠</span>
          <span className="text-xs font-mono text-phantom-yellow tracking-widest uppercase">
            Confidence Low — Fallback Required
          </span>
        </div>
        <ScoreDisplay result={result} />
        <div className="mt-4">
          <p className="text-xs text-phantom-muted mb-3 font-mono">
            Slide to confirm you are human
          </p>
          <div className="relative h-10 rounded-full bg-phantom-border overflow-hidden">
            {/* Track fill */}
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-phantom-yellow/20 transition-all"
              style={{ width: `${sliderValue}%` }}
            />
            {/* Label */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-xs font-mono text-phantom-muted select-none">
                {sliderValue < 95 ? '→  Drag to verify  →' : 'Release'}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={sliderValue}
              onChange={e => setSliderValue(Number(e.target.value))}
              onMouseUp={() => { if (sliderValue < 95) setSliderValue(0); }}
              onTouchEnd={() => { if (sliderValue < 95) setSliderValue(0); }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {/* Thumb indicator */}
            <div
              className="absolute top-1 bottom-1 w-8 rounded-full bg-phantom-yellow shadow-lg transition-all flex items-center justify-center pointer-events-none"
              style={{ left: `calc(${sliderValue}% - ${sliderValue * 0.32}px)` }}
            >
              <span className="text-phantom-bg text-xs">›</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Bot ──────────────────────────────────────────────────────────────────
  if (result?.decision === 'bot') {
    return (
      <div className="rounded-lg border border-phantom-red/30 bg-phantom-red/5 p-4 animate-slideUp">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-phantom-red text-sm animate-pulse">⛔</span>
          <span className="text-xs font-mono text-phantom-red tracking-widest uppercase">
            Bot Activity Detected
          </span>
        </div>
        <p className="text-xs text-phantom-red/60 font-mono mb-2">Access Restricted</p>
        <ScoreDisplay result={result} />
      </div>
    );
  }

  return null;
};

// ─── Score bar sub-component ─────────────────────────────────────────────────
const ScoreDisplay: React.FC<{ result: VerificationResult }> = ({ result }) => {
  const pct = Math.round(result.human_score * 100);
  const color =
    result.decision === 'human' ? '#00ff88'
    : result.decision === 'bot' ? '#ff3355'
    : '#ffcc00';

  return (
    <div className="mt-2">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-mono text-phantom-muted">Human Score</span>
        <span className="text-sm font-mono font-medium" style={{ color }}>
          {result.human_score.toFixed(2)}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-phantom-border overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};
