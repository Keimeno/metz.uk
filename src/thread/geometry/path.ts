// Polylines as flat xyzw arrays. `w` is intensity: 1 for ink, low for the pen moving between
// strokes, so a whole drawing stays one continuous thread that is faint where it only travels.

import type { Vec3 } from "../math";

export const INK = 1;
export const PEN_UP = 0;

/** Builds a polyline from lines and elliptical arcs. Coordinates are 2D (z = 0) unless given. */
export class PathBuilder {
  private pts: number[] = [];

  get empty() {
    return this.pts.length === 0;
  }

  get last(): Vec3 {
    const n = this.pts.length;
    return [this.pts[n - 4], this.pts[n - 3], this.pts[n - 2]];
  }

  point(x: number, y: number, w = INK, z = 0) {
    this.pts.push(x, y, z, w);
    return this;
  }

  /** A straight line from the current point to (x, y), sampled every `step` units. */
  line(x: number, y: number, w = INK, step = 0.02) {
    if (this.empty) return this.point(x, y, w);
    const [x0, y0] = this.last;
    const n = Math.max(1, Math.ceil(Math.hypot(x - x0, y - y0) / step));
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      this.point(x0 + (x - x0) * t, y0 + (y - y0) * t, w);
    }
    return this;
  }

  /** An elliptical arc from angle `a0` to `a1` (radians, counter-clockwise from +x). */
  arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, w = INK) {
    const n = Math.max(4, Math.ceil((Math.abs(a1 - a0) * Math.max(rx, ry)) / 0.012));
    const start: [number, number] = [cx + rx * Math.cos(a0), cy + ry * Math.sin(a0)];
    if (this.empty) this.point(start[0], start[1], w);
    else {
      const [x0, y0] = this.last;
      // Continuing a stroke (an arc that starts where the last line ended) needs no pen lift.
      if (Math.hypot(start[0] - x0, start[1] - y0) > 5e-3) this.moveTo(start[0], start[1]);
    }
    for (let i = 1; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      this.point(cx + rx * Math.cos(a), cy + ry * Math.sin(a), w);
    }
    return this;
  }

  /** Lifts the pen and moves to (x, y): a faint travel line, so the thread stays continuous. */
  moveTo(x: number, y: number) {
    if (this.empty) return this.point(x, y, PEN_UP);
    return this.line(x, y, PEN_UP, 0.05);
  }

  build() {
    return new Float32Array(this.pts);
  }
}

/**
 * Resamples a polyline to `count` points spaced evenly along its length, so two figures with
 * the same budget can morph point i into point i. Faint travel lines count for less length
 * (`penWeight`), so they don't use up points that the visible strokes need.
 */
export function resample(src: Float32Array, count: number, penWeight = 0.35): Float32Array {
  const n = src.length / 4;
  const out = new Float32Array(count * 4);
  if (n === 0) return out;
  if (n === 1) {
    for (let k = 0; k < count; k++) out.set(src.subarray(0, 4), k * 4);
    return out;
  }
  const cum = new Float64Array(n);
  for (let i = 1; i < n; i++) {
    const a = (i - 1) * 4;
    const b = i * 4;
    const len = Math.hypot(src[b] - src[a], src[b + 1] - src[a + 1], src[b + 2] - src[a + 2]);
    const faint = Math.min(src[a + 3], src[b + 3]) < 0.5;
    cum[i] = cum[i - 1] + len * (faint ? penWeight : 1);
  }
  const total = cum[n - 1];
  let j = 0;
  for (let k = 0; k < count; k++) {
    const target = count === 1 ? 0 : (total * k) / (count - 1);
    while (j < n - 2 && cum[j + 1] < target) j++;
    const seg = cum[j + 1] - cum[j];
    const f = seg > 0 ? Math.min(Math.max((target - cum[j]) / seg, 0), 1) : 0;
    for (let c = 0; c < 4; c++) {
      out[k * 4 + c] = src[j * 4 + c] + (src[(j + 1) * 4 + c] - src[j * 4 + c]) * f;
    }
  }
  return out;
}

/** Axis-aligned bounds of the visible (ink) points. */
export function bounds(src: Float32Array) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < src.length; i += 4) {
    if (src[i + 3] < 0.5) continue;
    minX = Math.min(minX, src[i]);
    maxX = Math.max(maxX, src[i]);
    minY = Math.min(minY, src[i + 1]);
    maxY = Math.max(maxY, src[i + 1]);
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

/** Moves and scales a 2D polyline in place. */
export function transform2D(src: Float32Array, dx: number, dy: number, s: number) {
  for (let i = 0; i < src.length; i += 4) {
    src[i] = (src[i] + dx) * s;
    src[i + 1] = (src[i + 1] + dy) * s;
  }
  return src;
}

/**
 * Rounds sharp corners of the visible strokes (the joints of M and z) with a short curve, so the
 * glow bends round them instead of spiking. Straight runs and pen travel are left alone.
 */
export function roundCorners(src: Float32Array, radius = 0.035, minTurn = 0.5): Float32Array {
  const n = src.length / 4;
  const out: number[] = [];
  const at = (i: number) => [src[i * 4], src[i * 4 + 1], src[i * 4 + 2], src[i * 4 + 3]];
  for (let i = 0; i < n; i++) {
    const p = at(i);
    if (i === 0 || i === n - 1 || p[3] < 0.5) {
      out.push(...p);
      continue;
    }
    const a = at(i - 1);
    const b = at(i + 1);
    const d1 = [p[0] - a[0], p[1] - a[1]];
    const d2 = [b[0] - p[0], b[1] - p[1]];
    const l1 = Math.hypot(d1[0], d1[1]);
    const l2 = Math.hypot(d2[0], d2[1]);
    const turn = l1 > 0 && l2 > 0 ? (d1[0] * d2[0] + d1[1] * d2[1]) / (l1 * l2) : 1;
    if (turn > minTurn || a[3] < 0.5 || b[3] < 0.5) {
      out.push(...p);
      continue;
    }
    // A quadratic curve from just before the corner to just after it.
    const r1 = Math.min(radius, l1 * 0.9);
    const r2 = Math.min(radius, l2 * 0.9);
    const s0 = [p[0] - (d1[0] / l1) * r1, p[1] - (d1[1] / l1) * r1];
    const s1 = [p[0] + (d2[0] / l2) * r2, p[1] + (d2[1] / l2) * r2];
    for (let k = 0; k <= 6; k++) {
      const t = k / 6;
      const x = (1 - t) ** 2 * s0[0] + 2 * (1 - t) * t * p[0] + t * t * s1[0];
      const y = (1 - t) ** 2 * s0[1] + 2 * (1 - t) * t * p[1] + t * t * s1[1];
      out.push(x, y, p[2], p[3]);
    }
  }
  return new Float32Array(out);
}
