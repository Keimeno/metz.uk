// The whole thread in world space: every station's figure, strung along the spiral and joined by
// connectors, plus the secondary lines, labels and planes the stations bring.
//
// Each figure has a fixed point budget, so it can morph point for point between its keyframes.
// `update(t, write)` rebuilds every position from the timeline each frame — a few thousand points,
// well under a millisecond — so each frame is a pure function of `t`.

import type { ZenariosData } from "./data/zenarios";
import { resample } from "./geometry/path";
import { E, add, normalize, prng, scale, sub, type Vec3 } from "./math";
import { cue } from "./beats";
import {
  LINE_POINTS,
  bezier,
  pointAt,
  spiralFrame,
  type BuildContext,
  type Plane,
  type StationBuild,
  type ViewInfo,
} from "./stations/kit";
import { STATION_MODULES } from "./timeline";

export interface Span {
  start: number;
  count: number;
}

export interface SceneOptions {
  /** Halves the point budgets on weak devices. */
  detail: number;
  /** Width ÷ cap height of the real headline, so the drawn name lands on top of it. */
  nameAspect?: number;
  /** Tall screens get taller figures. */
  portrait: boolean;
  /** Motes of dust floating along the path. */
  dust: number;
}

const CONNECTOR = 640;

export class Scene {
  readonly count: number;
  /** Texture rows of 1024 points. */
  readonly rows: number;
  readonly positions: Float32Array;
  readonly colors: Float32Array;
  /** One span per figure, and the connector leading into each figure after the first. */
  readonly figures: Span[];
  readonly connectors: Span[];
  builds: StationBuild[] = [];
  portrait = false;

  anchors: Record<string, Vec3> = {};
  planes: Record<string, Plane> = {};
  extent: { center: Vec3; radius: number } = { center: [0, 0, 0], radius: 1 };

  /** Secondary lines: per line, `LINE_POINTS` points then its colour and width (texture rows). */
  readonly lineCount: number;
  lineData: Float32Array = new Float32Array(0);
  /** Per line: drawn, brightness, point count, unused (the texture's last column). */
  readonly lineState: Float32Array;
  private lineOffsets: number[] = [];
  private lineCounts: number[] = [];
  /** Set when the lines' geometry changed and must be uploaded again. */
  linesDirty = true;

  readonly dust: { pos: Float32Array; col: Float32Array; count: number };

  /** The pen: index of the last drawn point (fractional). */
  head = 0;
  /** A bright packet travelling along a figure (Origins' token), as a point index, or null. */
  pulse: number | null = null;

  private connectorPts: Float32Array[] = [];
  private stateScratch = new Float32Array(2 * 256);

  constructor(
    readonly data: ZenariosData,
    private opts: SceneOptions
  ) {
    const budget = (n: number) => Math.max(64, Math.round(n * opts.detail));
    let start = 0;
    const span = (count: number): Span => {
      const s = { start, count };
      start += count;
      return s;
    };
    const figures: Span[] = [];
    const connectors: Span[] = [];
    STATION_MODULES.forEach((m, k) => {
      if (k > 0) connectors.push(span(budget(CONNECTOR)));
      figures.push(span(budget(m.budget)));
    });
    this.figures = figures;
    this.connectors = connectors;
    this.count = start;
    this.rows = Math.ceil(this.count / 1024);
    this.positions = new Float32Array(this.rows * 1024 * 4);
    this.colors = new Float32Array(this.rows * 1024 * 4);

    this.layout(opts.portrait);
    this.lineCount = this.lineCounts.reduce((a, b) => a + b, 0);
    this.lineState = new Float32Array(this.lineCount * 4);

    this.paint();
    this.dust = this.scatterDust(opts.dust);
  }

  /** Builds every station for the screen's shape. Cheap; call again when it flips. */
  layout(portrait: boolean) {
    this.portrait = portrait;
    const ctx: BuildContext = { data: this.data, portrait, nameAspect: this.opts.nameAspect };
    this.builds = STATION_MODULES.map((m, k) => m.build(ctx, spiralFrame(k), this.figures[k].count));

    // Connectors leave each figure along its x axis and enter the next one along its own.
    const L = 16;
    this.connectorPts = this.connectors.map((c, i) => {
      const prev = this.builds[i];
      const next = this.builds[i + 1];
      const exitKf = prev.keyframes[prev.keyframes.length - 1];
      const from = pointAt(exitKf, prev.keyframes[0].length / 4 - 1);
      const to = pointAt(next.keyframes[0], 0);
      return resample(
        bezier(from, add(from, scale(prev.frame.x, L)), sub(to, scale(next.frame.x, L)), to),
        c.count
      );
    });

    this.anchors = Object.assign({}, ...this.builds.map((b) => b.anchors));
    this.planes = Object.assign({}, ...this.builds.map((b) => b.planes ?? {}));

    // Secondary lines, packed for the GPU.
    this.lineCounts = this.builds.map((b) => b.lines?.length ?? 0);
    const total = this.lineCounts.reduce((a, b) => a + b, 0);
    const stride = (LINE_POINTS + 2) * 4;
    const data = new Float32Array(Math.max(1, total) * stride);
    let row = 0;
    this.lineOffsets = [];
    for (const b of this.builds) {
      this.lineOffsets.push(row);
      for (const l of b.lines ?? []) {
        const n = Math.min(l.points.length / 4, LINE_POINTS);
        const o = row * stride;
        for (let i = 0; i < LINE_POINTS; i++) {
          const j = Math.min(i, n - 1);
          data.set(l.points.subarray(j * 4, j * 4 + 4), o + i * 4);
        }
        data.set([...l.color, l.width], o + LINE_POINTS * 4);
        data[o + (LINE_POINTS + 1) * 4 + 2] = n;
        row++;
      }
    }
    this.lineData = data;
    this.linesDirty = true;

    // The extent of everything, for the closing view.
    let min: Vec3 = [Infinity, Infinity, Infinity];
    let max: Vec3 = [-Infinity, -Infinity, -Infinity];
    const grow = (a: Float32Array) => {
      for (let i = 0; i < a.length; i += 4) {
        min = [Math.min(min[0], a[i]), Math.min(min[1], a[i + 1]), Math.min(min[2], a[i + 2])];
        max = [Math.max(max[0], a[i]), Math.max(max[1], a[i + 1]), Math.max(max[2], a[i + 2])];
      }
    };
    this.builds.forEach((b) => b.keyframes.forEach(grow));
    this.connectorPts.forEach(grow);
    this.extent = { center: scale(add(min, max), 0.5), radius: Math.hypot(...sub(max, min)) / 2 };
  }

  /** Colours and widths: each figure in its station's tint, connectors blending between them. */
  private paint() {
    const set = (s: Span, from: Vec3, to: Vec3, width: number, ease = (x: number) => x) => {
      for (let i = 0; i < s.count; i++) {
        const t = ease(s.count > 1 ? i / (s.count - 1) : 0);
        this.colors.set(
          [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t, from[2] + (to[2] - from[2]) * t, width],
          (s.start + i) * 4
        );
      }
    };
    this.builds.forEach((b, k) => {
      set(this.figures[k], b.color, b.color, b.width);
      if (k > 0) set(this.connectors[k - 1], this.builds[k - 1].color, b.color, 0.85, E.inOutCubic);
    });
  }

  /** The point on the connector into station `k` at `q` (0…1), and its direction. */
  along(k: number, q: number): { p: Vec3; dir: Vec3 } {
    const a = this.connectorPts[k - 1];
    const n = a.length / 4;
    const i = Math.min(Math.max(q, 0), 1) * (n - 1);
    const i0 = Math.min(Math.floor(i), n - 2);
    const f = i - i0;
    const p0 = pointAt(a, i0);
    const p1 = pointAt(a, i0 + 1);
    const p: Vec3 = [p0[0] + (p1[0] - p0[0]) * f, p0[1] + (p1[1] - p0[1]) * f, p0[2] + (p1[2] - p0[2]) * f];
    const j0 = Math.max(0, i0 - 6);
    const j1 = Math.min(n - 1, i0 + 7);
    return { p, dir: normalize(sub(pointAt(a, j1), pointAt(a, j0))) };
  }

  /** How far the pen has flown along the connector into station `k`. */
  flight(k: number, t: number) {
    return E.inOutSine(cue(t, this.builds[k].arrive));
  }

  /** Where the pen is in the world right now. */
  penPosition(): Vec3 {
    const i = Math.min(Math.floor(this.head), this.count - 1) * 4;
    return [this.positions[i], this.positions[i + 1], this.positions[i + 2]];
  }

  /** The tint of the station the pen is in (or flying towards) at point `i`. */
  tintAt(i: number): Vec3 {
    for (let k = this.builds.length - 1; k >= 0; k--) {
      const start = k > 0 ? this.connectors[k - 1].start + this.connectors[k - 1].count * 0.6 : 0;
      if (i >= start) return this.builds[k].color;
    }
    return this.builds[0].color;
  }

  /** Camera holds of every station. */
  holds(view: ViewInfo) {
    return this.builds.flatMap((b) => b.holds(view));
  }

  get zen() {
    return this.builds.find((b) => b.fan);
  }

  /**
   * Rebuilds every point for time `t`. `write` (0…1) is the opening write-on of the name, which
   * runs on the clock rather than on scroll.
   */
  update(t: number, write: number) {
    const P = this.positions;
    let head = 0;
    let drawing = true;

    this.builds.forEach((b, k) => {
      if (k > 0) {
        const c = this.connectors[k - 1];
        P.set(this.connectorPts[k - 1], c.start * 4);
        const q = drawing ? this.flight(k, t) : 0;
        head += q * c.count;
        if (q < 1) drawing = false;
      }
      const f = this.figures[k];
      const pose = b.pose(t);
      this.morph(f, b.keyframes[pose.from], b.keyframes[pose.to], pose.mix, pose.stagger ?? 0, pose.brighten ?? false);
      const d = drawing ? (k === 0 ? write : b.draw(t)) : 0;
      head += d * (k === 0 ? f.count - 1 : f.count);
      if (d < 1) drawing = false;
    });
    this.head = Math.min(head, this.count - 1);

    // A packet of light travelling along a figure, and a label riding on it.
    this.pulse = null;
    this.builds.forEach((b, k) => {
      const p = b.pulse?.(t);
      if (p == null) return;
      const i = this.figures[k].start + p;
      this.pulse = i;
      const o = Math.floor(i) * 4;
      this.anchors[`pulse.${b.id}`] = [P[o], P[o + 1], P[o + 2]];
    });

    // Secondary lines' state.
    this.builds.forEach((b, k) => {
      const n = this.lineCounts[k];
      if (!n || !b.lineState) return;
      if (this.stateScratch.length < n * 2) this.stateScratch = new Float32Array(n * 2);
      b.lineState(t, this.stateScratch);
      for (let i = 0; i < n; i++) {
        const o = (this.lineOffsets[k] + i) * 4;
        this.lineState[o] = this.stateScratch[i * 2];
        this.lineState[o + 1] = this.stateScratch[i * 2 + 1];
        this.lineState[o + 2] = this.lineData[(this.lineOffsets[k] + i) * (LINE_POINTS + 2) * 4 + (LINE_POINTS + 1) * 4 + 2];
      }
    });
  }

  private morph(s: Span, from: Float32Array, to: Float32Array, t: number, stagger: number, brighten: boolean) {
    const P = this.positions;
    if (t <= 0 || from === to) {
      P.set(from.subarray(0, s.count * 4), s.start * 4);
      return;
    }
    for (let i = 0; i < s.count; i++) {
      const u = s.count > 1 ? i / (s.count - 1) : 0;
      const x = stagger > 0 ? Math.min(Math.max((t - u * stagger) / (1 - stagger), 0), 1) : t;
      const e = E.inOutCubic(x);
      const o = i * 4;
      const p = (s.start + i) * 4;
      P[p] = from[o] + (to[o] - from[o]) * e;
      P[p + 1] = from[o + 1] + (to[o + 1] - from[o + 1]) * e;
      P[p + 2] = from[o + 2] + (to[o + 2] - from[o + 2]) * e;
      // Faint pen travel turns into ink as the figure morphs.
      P[p + 3] = brighten ? from[o + 3] + (1 - from[o + 3]) * e : from[o + 3] + (to[o + 3] - from[o + 3]) * e;
    }
  }

  /** Motes of dust in a loose tube around the whole path, so flights have depth. */
  private scatterDust(count: number) {
    const rand = prng(7);
    const pos = new Float32Array(count * 4);
    const col = new Float32Array(count * 4);
    const paths = [...this.connectorPts, ...this.builds.map((b) => b.keyframes[0])];
    for (let i = 0; i < count; i++) {
      const a = paths[Math.floor(rand() * paths.length)];
      const k = Math.floor(rand() * (a.length / 4));
      const p = pointAt(a, k);
      const dist = 2.5 + 26 * Math.pow(rand(), 1.4);
      const dir = normalize([rand() - 0.5, (rand() - 0.5) * 0.8, rand() - 0.5]);
      pos.set([...add(p, scale(dir, dist)), rand()], i * 4);
      const tint = this.builds[Math.min(this.builds.length - 1, Math.floor(rand() * this.builds.length))].color;
      const warm = rand() < 0.6;
      col.set([warm ? 1 : tint[0], warm ? 0.95 : tint[1], warm ? 0.88 : tint[2], 0.03 + 0.14 * Math.pow(rand(), 4)], i * 4);
    }
    return { pos, col, count };
  }
}
