// What every station is made of, and the geometry helpers they share.
//
// A station supplies its figure (keyframes the thread morphs between), when the pen draws it,
// labels and planes that follow it, extra lines (edges, rings, ticks), and where the camera holds.
// The scene strings the stations together on a descending spiral and joins them with connectors.

import type { ZenariosData } from "../data/zenarios";
import type { Cue, StationId } from "../beats";
import { add, frame, mat4, normalize, rotateYX, scale, sub, type Mat4, type Vec3 } from "../math";

export type { Vec3 };

export interface StationFrame {
  origin: Vec3;
  x: Vec3;
  y: Vec3;
  z: Vec3;
  matrix: Mat4;
}

/** A flat rectangle in the world that an HTML element is mapped onto (the app screenshot). */
export interface Plane {
  center: Vec3;
  right: Vec3;
  up: Vec3;
  width: number;
  height: number;
}

/** A screen rectangle in normalised device coordinates (y up). */
export interface Rect {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export interface Pose {
  pos: Vec3;
  target: Vec3;
  /** Vertical field of view, radians. */
  fov: number;
  /** Lens shift: where the view axis lands on screen (NDC). */
  shift: [number, number];
}

export interface CameraKey {
  t: number;
  pose: Pose;
  /** Holds have zero velocity: the camera eases in and out of them. */
  hold: boolean;
}

/** A secondary line (an edge, a ring, a tick): up to `LINE_POINTS` points, world space. */
export interface LineDef {
  points: Float32Array;
  color: Vec3;
  width: number;
}

export const LINE_POINTS = 48;

export interface ViewInfo {
  aspect: number;
  /** Where the real headline is (the intro frames the drawn name over it). */
  nameRect?: Rect;
}

export interface BuildContext {
  data: ZenariosData;
  portrait: boolean;
  nameAspect?: number;
}

export interface FigurePose {
  /** Blend keyframe `from` into keyframe `to` by `mix` (0…1). */
  from: number;
  to: number;
  mix: number;
  /** Morph the start of the figure first (0 = all at once). */
  stagger?: number;
  /** Faint pen travel turns into ink as it morphs. */
  brighten?: boolean;
}

export interface StationBuild {
  id: StationId;
  frame: StationFrame;
  /** The thread's figure here: keyframes of `budget` xyzw points each, world space. */
  keyframes: Float32Array[];
  color: Vec3;
  width: number;
  /** When the pen flies in from the station before. */
  arrive: Cue;
  pose(t: number): FigurePose;
  /** How much of the figure the pen has drawn (0…1). */
  draw(t: number): number;
  anchors: Record<string, Vec3>;
  planes?: Record<string, Plane>;
  lines?: LineDef[];
  /** Per line: [drawn 0…1, brightness]. */
  lineState?(t: number, out: Float32Array): void;
  /** A point index (within this figure) where a bright packet of light travels, or null. */
  pulse?(t: number): number | null;
  holds(view: ViewInfo): CameraKey[];
  /** Zenarios only: where its fan of futures is drawn. */
  fan?: { model: Mat4; size: { width: number; height: number } };
}

export interface StationModule {
  id: StationId;
  /** Thread points for the figure, before the quality multiplier. */
  budget: number;
  build(ctx: BuildContext, frame: StationFrame, budget: number): StationBuild;
}

/** The stations sit on a slowly descending spiral, each figure facing outwards. */
export const SPIRAL = { radius: 46, drop: 12, step: (68 * Math.PI) / 180 } as const;
export const SPIRAL_AXIS: Vec3 = [0, 0, -SPIRAL.radius];

export function spiralFrame(k: number): StationFrame {
  const a = k * SPIRAL.step;
  const r = SPIRAL.radius;
  return stationFrame([r * Math.sin(a), -SPIRAL.drop * k, -r + r * Math.cos(a)], a);
}

export function stationFrame(origin: Vec3, yaw: number): StationFrame {
  const x = rotateYX([1, 0, 0], yaw);
  const y: Vec3 = [0, 1, 0];
  const z = rotateYX([0, 0, 1], yaw);
  return { origin, x, y, z, matrix: frame(mat4(), origin, x, y, z) };
}

export function toWorld(f: StationFrame, lx: number, ly: number, lz = 0): Vec3 {
  return [
    f.origin[0] + f.x[0] * lx + f.y[0] * ly + f.z[0] * lz,
    f.origin[1] + f.x[1] * lx + f.y[1] * ly + f.z[1] * lz,
    f.origin[2] + f.x[2] * lx + f.y[2] * ly + f.z[2] * lz,
  ];
}

/** A direction in a station's local frame, in world space. */
export const toWorldDir = (f: StationFrame, l: Vec3): Vec3 =>
  normalize(add(add(scale(f.x, l[0]), scale(f.y, l[1])), scale(f.z, l[2])));

/** Maps a local xyzw polyline (station units) into world space, in place. */
export function localToWorld(f: StationFrame, pts: Float32Array) {
  for (let i = 0; i < pts.length; i += 4) {
    const w = toWorld(f, pts[i], pts[i + 1], pts[i + 2]);
    pts[i] = w[0];
    pts[i + 1] = w[1];
    pts[i + 2] = w[2];
  }
  return pts;
}

/** A cubic Bézier, densely sampled as xyzw. */
export function bezier(p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3, w = 1, samples = 400) {
  const out = new Float32Array(samples * 4);
  for (let i = 0; i < samples; i++) {
    const t = i / (samples - 1);
    const a = (1 - t) ** 3;
    const b = 3 * (1 - t) ** 2 * t;
    const c = 3 * (1 - t) * t * t;
    const d = t ** 3;
    for (let k = 0; k < 3; k++) out[i * 4 + k] = a * p0[k] + b * p1[k] + c * p2[k] + d * p3[k];
    out[i * 4 + 3] = w;
  }
  return out;
}

export const pointAt = (a: Float32Array, i: number): Vec3 => [a[i * 4], a[i * 4 + 1], a[i * 4 + 2]];

/** A circle of `n` points in a station's local plane (closed: the last point is the first). */
export function circle(cx: number, cy: number, r: number, n = 32, z = 0, from = 0, sweep = Math.PI * 2) {
  const out = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const a = from + (sweep * i) / (n - 1);
    out.set([cx + r * Math.cos(a), cy + r * Math.sin(a), z, 1], i * 4);
  }
  return out;
}

/** A straight local line of `n` points. */
export function segment(a: Vec3, b: Vec3, n = 2) {
  const out = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const t = n > 1 ? i / (n - 1) : 0;
    out.set([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, 1], i * 4);
  }
  return out;
}

const DEG = Math.PI / 180;

/** Where a station's figure goes: left of the text on wide screens, above the card on tall ones. */
export function figureFrame(aspect: number): Rect {
  return aspect >= 1
    ? { x0: -0.94, x1: 0.06, y0: -0.62, y1: 0.66 }
    : { x0: -0.88, x1: 0.92, y0: -0.3, y1: 0.8 };
}

/** The camera pose that fits a `halfW` × `halfH` figure, seen along `dir`, into `frame`. */
export function holdPose(
  target: Vec3,
  dir: Vec3,
  fovDeg: number,
  halfW: number,
  halfH: number,
  frame: Rect,
  aspect: number
): Pose {
  const fov = fovDeg * DEG;
  const tan = Math.tan(fov / 2);
  const fw = (frame.x1 - frame.x0) / 2;
  const fh = (frame.y1 - frame.y0) / 2;
  const dist = Math.max(halfH / (tan * fh), halfW / (tan * aspect * fw));
  return {
    pos: sub(target, scale(dir, dist)),
    target,
    fov,
    shift: [(frame.x0 + frame.x1) / 2, (frame.y0 + frame.y1) / 2],
  };
}

/** A view direction in a station's frame: straight on, turned by `yaw` and tilted by `pitch`. */
export function viewDir(f: StationFrame, yaw: number, pitch: number): Vec3 {
  return toWorldDir(f, rotateYX([0, 0, -1], yaw, pitch));
}

/** Two hold keys framing a figure, the camera drifting from one angle to another between them. */
export function holdBetween(
  t0: number,
  t1: number,
  target: Vec3,
  f: StationFrame,
  from: [number, number],
  to: [number, number],
  halfW: number,
  halfH: number,
  view: ViewInfo,
  fovDeg = 34,
  frame: Rect = figureFrame(view.aspect)
): CameraKey[] {
  return [
    { t: t0, pose: holdPose(target, viewDir(f, ...from), fovDeg, halfW, halfH, frame, view.aspect), hold: true },
    { t: t1, pose: holdPose(target, viewDir(f, ...to), fovDeg, halfW, halfH, frame, view.aspect), hold: true },
  ];
}
