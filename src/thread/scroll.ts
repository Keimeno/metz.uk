// Native scroll → timeline time. Each station section is `beats` viewports tall; the time is
// how far the page has scrolled through them.
//
// The time (not the scroll position) follows the scroll on a critically damped spring, so
// notchy mouse wheels glide with no sudden changes of speed, while touch scrolling (already
// smooth) stays close to the finger. Big jumps (an anchor link, a dragged scrollbar)
// cross-fade instead of flying past every station.

import { clamp } from "./math";

interface Section {
  el: HTMLElement;
  start: number;
  beats: number;
  top: number;
  height: number;
}

const JUMP = 1.5;
const FADE_OUT = 0.16;
const FADE_IN = 0.4;
/** Spring settle times, seconds. */
const SMOOTH = { wheel: 0.28, touch: 0.1, key: 0.22 } as const;

export class ScrollTimeline {
  private sections: Section[] = [];
  readonly total: number;
  /** Where the scroll position says we are. */
  target = 0;
  /** Where we draw: follows `target` smoothly. */
  value = 0;
  /** How fast `value` is moving, beats per second. */
  velocity = 0;
  /** Picture fade during a jump. */
  fade = 1;
  /** A fixed time from the debug panel, ignoring scroll. */
  override: number | null = null;

  private smooth: number = SMOOTH.wheel;
  private jump: { phase: "out" | "in"; t: number } | null = null;
  private listeners: [string, () => void][] = [];

  constructor(elements: HTMLElement[]) {
    let start = 0;
    for (const el of elements) {
      const beats = Number(getComputedStyle(el).getPropertyValue("--beats")) || 1;
      this.sections.push({ el, start, beats, top: 0, height: 1 });
      start += beats;
    }
    this.total = start;
    this.measure();
    this.target = this.value = this.read();

    const on = (type: string, kind: keyof typeof SMOOTH) => {
      const fn = () => (this.smooth = SMOOTH[kind]);
      window.addEventListener(type, fn, { passive: true });
      this.listeners.push([type, fn]);
    };
    on("wheel", "wheel");
    on("touchstart", "touch");
    on("keydown", "key");
  }

  dispose() {
    for (const [type, fn] of this.listeners) window.removeEventListener(type, fn);
  }

  /** Re-reads section positions. Call on resize and after fonts load, never per frame. */
  measure() {
    const y = window.scrollY;
    for (const s of this.sections) {
      const r = s.el.getBoundingClientRect();
      s.top = r.top + y;
      s.height = Math.max(1, r.height);
    }
  }

  /** Timeline time for the current scroll position. */
  read() {
    const y = window.scrollY;
    const first = this.sections[0];
    if (!first || y <= first.top) return 0;
    for (let i = this.sections.length - 1; i >= 0; i--) {
      const s = this.sections[i];
      if (y >= s.top) return s.start + clamp((y - s.top) / s.height) * s.beats;
    }
    return 0;
  }

  /** Scroll position for timeline time `t` (for the chapter links and the debug scrubber). */
  scrollFor(t: number) {
    for (const s of this.sections) {
      if (t <= s.start + s.beats) return s.top + ((t - s.start) / s.beats) * s.height;
    }
    const last = this.sections[this.sections.length - 1];
    return last.top + last.height;
  }

  /** Jumps straight to the scroll position, with no glide (for `?t=` and the scrubber). */
  snap() {
    this.target = this.value = this.read();
    this.velocity = 0;
  }

  update(dt: number) {
    if (this.override !== null) {
      this.value = this.target = this.override;
      this.velocity = 0;
      this.fade = 1;
      return this.value;
    }
    this.target = this.read();

    if (this.jump) {
      const j = this.jump;
      j.t += dt;
      if (j.phase === "out") {
        this.fade = 1 - clamp(j.t / FADE_OUT);
        if (j.t >= FADE_OUT) {
          this.snap();
          this.jump = { phase: "in", t: 0 };
        }
      } else {
        this.snap();
        this.fade = clamp(j.t / FADE_IN);
        if (j.t >= FADE_IN) {
          this.jump = null;
          this.fade = 1;
        }
      }
      return this.value;
    }

    if (Math.abs(this.target - this.value) > JUMP) {
      this.jump = { phase: "out", t: 0 };
      return this.value;
    }

    // Critically damped spring (the classic "SmoothDamp").
    const omega = 2 / this.smooth;
    const x = omega * dt;
    const decay = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
    const change = this.value - this.target;
    const temp = (this.velocity + omega * change) * dt;
    this.velocity = (this.velocity - omega * temp) * decay;
    let next = this.target + (change + temp) * decay;
    // Never overshoot the scroll position.
    if (this.target - this.value > 0 === next > this.target) {
      next = this.target;
      this.velocity = 0;
    }
    this.value = next;
    return this.value;
  }
}
