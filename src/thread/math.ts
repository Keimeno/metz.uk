// Small vector and matrix helpers. Matrices are column-major Float32Arrays, as WebGL expects.
// No DOM here, so the same code runs in the browser and in build scripts.

export type Vec3 = [number, number, number];
export type Mat4 = Float32Array;

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, x: number) => a + (b - a) * x;
/** Where `t` is between `from` and `to`, as 0…1. */
export const range = (t: number, from: number, to: number) => clamp((t - from) / (to - from));
export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export const E = {
  inOutCubic: (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  outCubic: (x: number) => 1 - Math.pow(1 - x, 3),
  inCubic: (x: number) => x * x * x,
  outExpo: (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
  inOutSine: (x: number) => -(Math.cos(Math.PI * x) - 1) / 2,
  inOutQuint: (x: number) => (x < 0.5 ? 16 * x ** 5 : 1 - Math.pow(-2 * x + 2, 5) / 2),
};

export const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const length = (a: Vec3) => Math.hypot(a[0], a[1], a[2]);
export const normalize = (a: Vec3): Vec3 => {
  const l = length(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
export const mix3 = (a: Vec3, b: Vec3, t: number): Vec3 => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];

/** Rotates `v` around the y axis (yaw) and then the x axis (pitch), in radians. */
export function rotateYX(v: Vec3, yaw: number, pitch = 0): Vec3 {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const x = v[0] * cy + v[2] * sy;
  const z = -v[0] * sy + v[2] * cy;
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  return [x, v[1] * cp - z * sp, v[1] * sp + z * cp];
}

export const mat4 = () => new Float32Array(16);

/**
 * Perspective projection with a lens shift: the view axis lands at (`shiftX`, `shiftY`) in
 * normalised device coordinates instead of the centre, so a figure can sit in the left half
 * of the screen without turning the camera.
 */
export function perspective(
  out: Mat4,
  fovY: number,
  aspect: number,
  near: number,
  far: number,
  shiftX = 0,
  shiftY = 0
) {
  const f = 1 / Math.tan(fovY / 2);
  out.fill(0);
  out[0] = f / aspect;
  out[5] = f;
  out[8] = -shiftX;
  out[9] = -shiftY;
  out[10] = (far + near) / (near - far);
  out[11] = -1;
  out[14] = (2 * far * near) / (near - far);
  return out;
}

export function lookAt(out: Mat4, eye: Vec3, target: Vec3, up: Vec3) {
  const z = normalize(sub(eye, target));
  let x = cross(up, z);
  if (length(x) < 1e-6) x = cross([0, 0, 1], z);
  x = normalize(x);
  const y = cross(z, x);
  out[0] = x[0];
  out[1] = y[0];
  out[2] = z[0];
  out[3] = 0;
  out[4] = x[1];
  out[5] = y[1];
  out[6] = z[1];
  out[7] = 0;
  out[8] = x[2];
  out[9] = y[2];
  out[10] = z[2];
  out[11] = 0;
  out[12] = -dot(x, eye);
  out[13] = -dot(y, eye);
  out[14] = -dot(z, eye);
  out[15] = 1;
  return out;
}

export function multiply(out: Mat4, a: Mat4, b: Mat4) {
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      out[c * 4 + r] =
        a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
  }
  return out;
}

/** A model matrix from an origin and three axes (the station's local frame). */
export function frame(out: Mat4, origin: Vec3, x: Vec3, y: Vec3, z: Vec3) {
  out.set([x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, z[0], z[1], z[2], 0, ...origin, 1]);
  return out;
}

/** Projects a world point; returns clip coordinates [x, y, z, w]. */
export function project(m: Mat4, p: Vec3): [number, number, number, number] {
  return [
    m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12],
    m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13],
    m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14],
    m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15],
  ];
}

/** Uniform Catmull-Rom through `values` at fractional index `x`, clamped at the ends. */
export function catmullRom(values: ArrayLike<number>, x: number) {
  const n = values.length;
  const i = Math.min(Math.max(Math.floor(x), 0), n - 2);
  const t = clamp(x - i, 0, 1);
  const p0 = values[Math.max(i - 1, 0)];
  const p1 = values[i];
  const p2 = values[i + 1];
  const p3 = values[Math.min(i + 2, n - 1)];
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

/** Seeded PRNG (mulberry32): the same seed always gives the same sequence. */
export function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
