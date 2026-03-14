// components/LoginPage.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useBehaviorTracking } from '../hooks/useBehaviorTracking';
import { ResultCard } from './ResultCard';
import type { AnalyticsMetrics } from '../utils/featureBuilder';

// ─── Analytics Panel ─────────────────────────────────────────────────────────
const AnalyticsPanel: React.FC<{ metrics: AnalyticsMetrics }> = ({ metrics }) => {
  // Tick every second so clock + bars update even without new signals
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Stable bar heights — shift left each tick and add a new random bar
  const barsRef = useRef<number[]>(Array.from({ length: 20 }, () => 4));
  useEffect(() => {
    barsRef.current = [
      ...barsRef.current.slice(1),
      Math.max(4, Math.round(6 + Math.random() * 24 + (metrics.mouseCount % 6) * 1.5)),
    ];
  }, [tick, metrics.mouseCount]);

  const rows: { label: string; value: string | number; unit?: string; color?: string }[] = [
    { label: 'Mouse Movements',  value: metrics.mouseCount,                                   color: '#00d4ff' },
    { label: 'Click Frequency',  value: metrics.clickFrequency,  unit: '/min',                color: '#00d4ff' },
    { label: 'Typing Speed',     value: metrics.typingSpeed,     unit: ' kpm',                color: '#00ff88' },
    { label: 'Scroll Activity',  value: metrics.scrollActivity,  unit: '/min',                color: '#00d4ff' },
    { label: 'Session Time',     value: formatTime(metrics.sessionSeconds),                   color: '#ffcc00' },
    { label: 'Avg Velocity',     value: metrics.mouseVelocityAvg, unit: ' px/s',              color: '#00d4ff' },
    { label: 'Path Entropy',     value: metrics.mousePathEntropy.toFixed(2),
      color: metrics.mousePathEntropy > 0.4 ? '#00ff88' : '#ffcc00' },
  ];

  return (
    <div className="bg-phantom-surface border border-phantom-border rounded-xl p-4 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-phantom-accent animate-pulse" />
          <span className="text-xs font-mono text-phantom-accent tracking-widest uppercase">
            Live Analytics
          </span>
        </div>
        <span className="text-xs font-mono text-phantom-muted">
          {new Date().toLocaleTimeString()}
        </span>
      </div>

      {/* Metrics grid */}
      <div className="space-y-2.5">
        {rows.map(row => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="text-xs text-phantom-muted font-mono">{row.label}</span>
            <span className="text-xs font-mono font-medium" style={{ color: row.color }}>
              {row.value}{row.unit ?? ''}
            </span>
          </div>
        ))}
      </div>

      {/* Signal bars — animated every tick */}
      <div className="mt-4 pt-3 border-t border-phantom-border">
        <div className="flex items-end gap-1 h-8">
          {barsRef.current.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-phantom-accent/40 transition-all duration-500"
              style={{ height: `${h}px` }}
            />
          ))}
        </div>
        <p className="text-xs text-phantom-muted font-mono mt-1 text-center">
          signal activity
        </p>
      </div>
    </div>
  );
};

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

// ─── Main Login Page ──────────────────────────────────────────────────────────
export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fallbackDone, setFallbackDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Always enabled from mount — tracking is passive from page load
  const { status, result, error, analytics, triggerManualSend } = useBehaviorTracking(true);

  const handleFocus = useCallback(() => {
    // no-op — tracking already running, kept for future extensibility
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    triggerManualSend();
    setTimeout(() => setIsSubmitting(false), 2000);
  }, [triggerManualSend]);

  const statusLabel = status === 'idle' ? 'Passive Verification Status'
    : status === 'collecting' ? 'Passive Verification Status'
    : status === 'analyzing' ? 'Analyzing Interaction'
    : status === 'success' && result?.decision === 'human' ? 'Human Verified ✓'
    : status === 'offline' ? 'Demo Mode Active'
    : 'Verification Status';

  const statusColor = status === 'success' && result?.decision === 'human' ? 'text-phantom-green'
    : status === 'error' || result?.decision === 'bot' ? 'text-phantom-red'
    : result?.decision === 'uncertain' ? 'text-phantom-yellow'
    : 'text-phantom-accent';

  return (
    <div className="min-h-screen bg-phantom-bg flex items-stretch relative overflow-hidden font-body">

      {/* ── Background grid ── */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 212, 255, 0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 255, 0.07) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* ── Radial glow ── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-phantom-accent/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[400px] rounded-full bg-phantom-green/3 blur-3xl pointer-events-none" />

      {/* ── Left panel: branding ── */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg border border-phantom-accent/40 flex items-center justify-center">
            <span className="text-phantom-accent text-lg">⬡</span>
          </div>
          <span className="font-display text-phantom-text text-lg tracking-wide">capALT</span>
        </div>

        {/* Center content */}
        <div>
          <div className="mb-6">
            <span className="inline-block text-xs font-mono text-phantom-accent tracking-widest uppercase border border-phantom-accent/30 rounded px-2 py-1 mb-4">
              ML-Powered • Passive • Zero-Friction
            </span>
            <h1 className="font-display text-4xl text-white leading-tight mb-3">
              Frictionless
              <br />
              Human
              <br />
              <span className="text-phantom-accent">Verification</span>
            </h1>
            <p className="text-phantom-muted text-sm leading-relaxed max-w-sm">
              No puzzles. No image grids. Our ML engine passively analyzes behavioral
              signals to distinguish humans from bots in real time.
            </p>
          </div>

          {/* Feature list */}
          {[
            { icon: '⬡', text: 'Mouse dynamics analysis' },
            { icon: '⬡', text: 'Keystroke rhythm modeling' },
            { icon: '⬡', text: 'Scroll pattern entropy' },
            { icon: '⬡', text: 'Session behavioral fingerprint' },
          ].map(f => (
            <div key={f.text} className="flex items-center gap-3 mb-2">
              <span className="text-phantom-accent/50 text-xs">{f.icon}</span>
              <span className="text-xs font-mono text-phantom-muted">{f.text}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-xs font-mono text-phantom-muted/40">
          © 2025 capALT · Enterprise Security Division
        </div>
      </div>

      {/* ── Right panel: login + analytics ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 gap-6">

        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2 mb-2">
          <span className="text-phantom-accent">⬡</span>
          <span className="font-display text-phantom-text tracking-wide">capALT</span>
        </div>

        {/* Login card */}
        <div
          className="w-full max-w-md rounded-2xl border border-phantom-border p-8 relative overflow-hidden"
          style={{
            background: 'rgba(7, 13, 26, 0.85)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 0 60px rgba(0, 212, 255, 0.05), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          {/* Scan line effect */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            <div
              className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-phantom-accent/20 to-transparent"
              style={{ animation: 'scan 4s linear infinite' }}
            />
          </div>

          {/* Card header */}
          <div className="mb-7">
            <p className="text-xs font-mono text-phantom-muted tracking-widest uppercase mb-1">
              Secure Access Portal
            </p>
            <h2 className="font-display text-xl text-white">Sign in to your account</h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-mono text-phantom-muted mb-1.5 tracking-wider uppercase">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={handleFocus}
                placeholder="agent@capalt.security"
                className="w-full bg-phantom-card border border-phantom-border rounded-lg px-4 py-2.5 text-sm text-phantom-text font-mono placeholder-phantom-muted/40 outline-none focus:border-phantom-accent/60 transition-colors"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-mono text-phantom-muted mb-1.5 tracking-wider uppercase">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={handleFocus}
                  placeholder="••••••••••••"
                  className="w-full bg-phantom-card border border-phantom-border rounded-lg px-4 py-2.5 pr-10 text-sm text-phantom-text font-mono placeholder-phantom-muted/40 outline-none focus:border-phantom-accent/60 transition-colors"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-phantom-muted hover:text-phantom-text transition-colors text-xs"
                  tabIndex={-1}
                >
                  {showPassword ? '◉' : '○'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full relative rounded-lg py-2.5 text-sm font-display font-semibold text-phantom-bg tracking-wide transition-all duration-200 overflow-hidden group"
              style={{
                background: isSubmitting
                  ? 'rgba(0, 212, 255, 0.5)'
                  : 'linear-gradient(135deg, #00d4ff, #0099bb)',
                boxShadow: isSubmitting ? 'none' : '0 0 20px rgba(0, 212, 255, 0.3)',
              }}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3 h-3 border-2 border-phantom-bg/30 border-t-phantom-bg rounded-full animate-spin" />
                  Verifying…
                </span>
              ) : (
                'Authenticate'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-phantom-border" />
            <span className="text-xs font-mono text-phantom-muted/50">Passive Verification Status</span>
            <div className="flex-1 h-px bg-phantom-border" />
          </div>

          {/* Status label */}
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                status === 'collecting' ? 'bg-phantom-accent animate-pulse' :
                status === 'analyzing' ? 'bg-phantom-yellow animate-pulse' :
                status === 'success' && result?.decision === 'human' ? 'bg-phantom-green animate-pulse' :
                result?.decision === 'bot' ? 'bg-phantom-red' :
                'bg-phantom-muted'
              }`}
            />
            <span className={`text-xs font-mono tracking-wider uppercase ${statusColor}`}>
              {statusLabel}
            </span>
          </div>

          {/* Result card */}
          <ResultCard
            status={status}
            result={result}
            error={error}
            onFallbackComplete={() => setFallbackDone(true)}
            fallbackDone={fallbackDone}
          />
        </div>

        {/* Analytics panel */}
        <div className="w-full max-w-md">
          <AnalyticsPanel metrics={analytics} />
        </div>

        {/* Footer note */}
        <p className="text-xs font-mono text-phantom-muted/30 text-center max-w-sm">
          This system passively monitors interaction signals. No data leaves your session.
        </p>
      </div>
    </div>
  );
};
