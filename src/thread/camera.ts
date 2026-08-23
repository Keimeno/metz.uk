// The camera: every station's "hold" poses (framing its figure in a given part of the screen),
// "chase" poses riding behind the pen along each connector, and the closing view of the whole
// spiral — joined by a C1-smooth spline in timeline time. Holds have zero velocity, so the camera
// eases into and out of them.

import { add, lookAt, mat4, multiply, normalize, perspective, scale, sub, type Mat4, type Vec3 } from "./math";
import type { Scene } from "./scene";
import { SPIRAL_AXIS, holdPose, type CameraKey, type Pose, type Rect } from "./stations/kit";
import { stationStart } from "./timeline";

export type { Rect };

export interface Viewport {
  width: number;
  height: number;
  /** Where the real headline is, so the drawn name lands on it. */
  nameRect?: Rect;
}

const DEG = Math.PI / 180;
const UP: Vec3 = [0, 1, 0];

/** Away from the spiral's axis: chase cameras sit outside the spiral, looking in at the pen. */
const outward = (p: Vec3) => normalize([p[0] - SPIRAL_AXIS[0], 0, p[2] - SPIRAL_AXIS[2]]);

const toVec = (p: Pose) => [...p.pos, ...p.target, p.fov, p.shift[0], p.shift[1]];
const fromVec = (v: number[]): Pose => ({
  pos: [v[0], v[1], v[2]],
  target: [v[3], v[4], v[5]],
  fov: v[6],
  shift: [v[7], v[8]],
});

export class CameraRig {
  private keys: CameraKey[] = [];
  private vecs: number[][] = [];
  private vels: number[][] = [];

  readonly view = mat4();
  readonly proj = mat4();
  readonly viewProj = mat4();
  /** Pixels per world unit at distance 1, for line widths. */
  projScale = 1;
  pose: Pose = { pos: [0, 0, 10], target: [0, 0, 0], fov: 0.6, shift: [0, 0] };

  constructor(private scene: Scene) {}

  build(vp: Viewport) {
    const s = this.scene;
    const aspect = vp.width / vp.height;
    const keys: CameraKey[] = [...s.holds({ aspect, nameRect: vp.nameRect })];

    // Riding behind the pen along each connector: outside the spiral, a little above, looking
    // ahead of the tip.
    s.builds.forEach((b, k) => {
      if (k === 0) return;
      const [a0, a1] = b.arrive;
      for (const x of [0.18, 0.42, 0.63, 0.82]) {
        const t = a0 + (a1 - a0) * x;
        const { p, dir } = s.along(k, s.flight(k, t));
        keys.push({
          t,
          pose: {
            pos: add(add(sub(p, scale(dir, 12)), scale(UP, 4)), scale(outward(p), 6)),
            target: add(p, scale(dir, 5)),
            fov: 43 * DEG,
            shift: [0, 0],
          },
          hold: false,
        });
      }
    });

    // The end: rise above the spiral and see the whole journey at once.
    const { center, radius } = s.extent;
    const endDir = normalize([-0.3, -0.62, -0.72]);
    const endFrame = aspect >= 1 ? { x0: -0.9, x1: 0.9, y0: -0.12, y1: 0.86 } : { x0: -0.95, x1: 0.95, y0: -0.05, y1: 0.85 };
    const end = holdPose(center, endDir, 34, radius * 0.72, radius * 0.5, endFrame, aspect);
    const es = stationStart("end");
    keys.push({ t: es + 0.45, pose: end, hold: true });
    keys.push({ t: es + 1.25, pose: { ...end, pos: add(end.pos, scale(endDir, -radius * 0.08)) }, hold: true });

    keys.sort((a, b) => a.t - b.t);
    this.keys = keys;
    this.vecs = keys.map((k) => toVec(k.pose));
    // Velocities per unit of time; zero at holds so the camera settles there.
    this.vels = keys.map((k, i) => {
      if (k.hold || i === 0 || i === keys.length - 1) return this.vecs[i].map(() => 0);
      const a = this.vecs[i - 1];
      const b = this.vecs[i + 1];
      const dt = keys[i + 1].t - keys[i - 1].t;
      return a.map((_, c) => (b[c] - a[c]) / dt);
    });
  }

  /** The pose at timeline time `t` (cubic Hermite between keys). */
  evaluate(t: number): Pose {
    const k = this.keys;
    if (t <= k[0].t) return k[0].pose;
    if (t >= k[k.length - 1].t) return k[k.length - 1].pose;
    let i = 0;
    while (i < k.length - 2 && t > k[i + 1].t) i++;
    const h = k[i + 1].t - k[i].t;
    const s = (t - k[i].t) / h;
    const s2 = s * s;
    const s3 = s2 * s;
    const h00 = 2 * s3 - 3 * s2 + 1;
    const h10 = s3 - 2 * s2 + s;
    const h01 = -2 * s3 + 3 * s2;
    const h11 = s3 - s2;
    const a = this.vecs[i];
    const b = this.vecs[i + 1];
    const va = this.vels[i];
    const vb = this.vels[i + 1];
    return fromVec(a.map((_, c) => h00 * a[c] + h10 * h * va[c] + h01 * b[c] + h11 * h * vb[c]));
  }

  /** Updates the matrices for time `t`. `drift` nudges the view for a living, breathing frame. */
  update(t: number, width: number, height: number, drift: [number, number] = [0, 0]): Mat4 {
    const pose = this.evaluate(t);
    this.pose = pose;
    const eye = add(pose.pos, [drift[0], drift[1], 0]);
    lookAt(this.view, eye, pose.target, UP);
    perspective(this.proj, pose.fov, width / height, 0.1, 900, pose.shift[0], pose.shift[1]);
    multiply(this.viewProj, this.proj, this.view);
    this.projScale = height / 2 / Math.tan(pose.fov / 2);
    return this.viewProj;
  }
}
