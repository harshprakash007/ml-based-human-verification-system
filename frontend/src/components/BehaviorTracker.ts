// components/BehaviorTracker.ts
// Pure TypeScript class responsible for attaching/detaching DOM event listeners
// and accumulating raw behavioral signal data

import type { RawSignals } from '../utils/featureBuilder';

export class BehaviorTracker {
  private signals: RawSignals;
  private listeners: Array<[EventTarget, string, EventListener]> = [];

  constructor(sessionStart: number) {
    this.signals = {
      mouseMoves: [],
      clicks: [],
      keystrokes: [],
      scrolls: [],
      sessionStart,
    };
  }

  /** Attach all DOM event listeners */
  attach(): void {
    this.on(window, 'mousemove', this.onMouseMove);
    this.on(window, 'click', this.onClick);
    this.on(window, 'keydown', this.onKeyDown);
    this.on(window, 'scroll', this.onScroll, { passive: true } as AddEventListenerOptions);
  }

  /** Detach all DOM event listeners */
  detach(): void {
    for (const [target, type, listener] of this.listeners) {
      target.removeEventListener(type, listener);
    }
    this.listeners = [];
  }

  /** Snapshot of current signals (shallow copy for immutability) */
  getSignals(): RawSignals {
    return {
      mouseMoves: [...this.signals.mouseMoves],
      clicks: [...this.signals.clicks],
      keystrokes: [...this.signals.keystrokes],
      scrolls: [...this.signals.scrolls],
      sessionStart: this.signals.sessionStart,
    };
  }

  /** Clear accumulated signals after a batch send */
  flush(): void {
    this.signals.mouseMoves = [];
    this.signals.clicks = [];
    this.signals.keystrokes = [];
    this.signals.scrolls = [];
  }

  // ─── Private handlers ────────────────────────────────────────────────────

  private onMouseMove = (e: Event): void => {
    const me = e as MouseEvent;
    // Throttle: only record if moved ≥ 4px from last point
    const last = this.signals.mouseMoves.at(-1);
    if (last) {
      const dx = me.clientX - last.x;
      const dy = me.clientY - last.y;
      if (Math.sqrt(dx * dx + dy * dy) < 4) return;
    }
    this.signals.mouseMoves.push({ x: me.clientX, y: me.clientY, time: Date.now() });
    if (this.signals.mouseMoves.length > 500) this.signals.mouseMoves.shift();
  };

  private onClick = (): void => {
    this.signals.clicks.push(Date.now());
  };

  private onKeyDown = (): void => {
    this.signals.keystrokes.push(Date.now());
  };

  private onScroll = (): void => {
    this.signals.scrolls.push({ position: window.scrollY, time: Date.now() });
  };

  private on(
    target: EventTarget,
    type: string,
    handler: EventListener,
    options?: AddEventListenerOptions
  ): void {
    target.addEventListener(type, handler, options);
    this.listeners.push([target, type, handler]);
  }
}
