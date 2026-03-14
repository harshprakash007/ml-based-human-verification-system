// utils/featureBuilder.ts
// Constructs ML-ready feature vectors from raw behavioral signals

export interface RawSignals {
  mouseMoves: { x: number; y: number; time: number }[];
  clicks: number[];
  keystrokes: number[];
  scrolls: { position: number; time: number }[];
  sessionStart: number;
}

export interface AnalyticsMetrics {
  mouseCount: number;
  clickFrequency: number;   // clicks per minute
  typingSpeed: number;      // keystrokes per minute
  scrollActivity: number;   // scroll events per minute
  sessionSeconds: number;
  mouseVelocityAvg: number;
  mousePathEntropy: number; // 0–1 naturalness score
}

/** Build the payload sent to the backend */
export function buildPayload(signals: RawSignals) {
  const sessionTime = (Date.now() - signals.sessionStart) / 1000;
  return {
    mouse_moves: signals.mouseMoves.slice(-200), // cap to last 200
    clicks: signals.clicks.slice(-50),
    keystrokes: signals.keystrokes.slice(-100),
    scrolls: signals.scrolls.slice(-50),
    session_time: Math.round(sessionTime),
  };
}

/** Compute live analytics for the dashboard panel */
export function computeAnalytics(signals: RawSignals): AnalyticsMetrics {
  const sessionSeconds = (Date.now() - signals.sessionStart) / 1000;
  const sessionMinutes = Math.max(sessionSeconds / 60, 0.0167); // min 1 second

  const clickFrequency = signals.clicks.length / sessionMinutes;
  const typingSpeed = signals.keystrokes.length / sessionMinutes;
  const scrollActivity = signals.scrolls.length / sessionMinutes;

  // Average mouse velocity
  let totalVelocity = 0;
  let velocityCount = 0;
  for (let i = 1; i < signals.mouseMoves.length; i++) {
    const prev = signals.mouseMoves[i - 1];
    const curr = signals.mouseMoves[i];
    const dt = (curr.time - prev.time) / 1000;
    if (dt > 0 && dt < 0.5) {
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      totalVelocity += dist / dt;
      velocityCount++;
    }
  }
  const mouseVelocityAvg = velocityCount > 0 ? totalVelocity / velocityCount : 0;

  // Simple path entropy — direction changes normalised 0–1
  let directionChanges = 0;
  for (let i = 2; i < signals.mouseMoves.length; i++) {
    const p = signals.mouseMoves[i - 2];
    const c = signals.mouseMoves[i - 1];
    const n = signals.mouseMoves[i];
    const angle1 = Math.atan2(c.y - p.y, c.x - p.x);
    const angle2 = Math.atan2(n.y - c.y, n.x - c.x);
    if (Math.abs(angle2 - angle1) > 0.3) directionChanges++;
  }
  const mousePathEntropy = signals.mouseMoves.length > 2
    ? Math.min(directionChanges / (signals.mouseMoves.length - 2), 1)
    : 0;

  return {
    mouseCount: signals.mouseMoves.length,
    clickFrequency: Math.round(clickFrequency * 10) / 10,
    typingSpeed: Math.round(typingSpeed),
    scrollActivity: Math.round(scrollActivity * 10) / 10,
    sessionSeconds: Math.round(sessionSeconds),
    mouseVelocityAvg: Math.round(mouseVelocityAvg),
    mousePathEntropy: Math.round(mousePathEntropy * 100) / 100,
  };
}
