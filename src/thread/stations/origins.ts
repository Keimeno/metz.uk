// Station 4: Origins. A block (the Minecraft network it began with) unfolds into the route a
// sign-in takes across that network — forum, auth server, game sites — with a signed token
// travelling along it (the OpenID Connect provider he wrote at school), and then into a git
// branch merging into Sequelize's main line (his largest open-source change, #13710).

import { at, cue, stationStart, type Cue } from "../beats";
import { E, rotateYX, type Vec3 } from "../math";
import { PathBuilder, resample } from "../geometry/path";
import { circle, holdBetween, localToWorld, segment, toWorld, type LineDef, type StationModule } from "./kit";

export const CUES = {
  arrive: at("origins", -0.55, 0.45),
  block: at("origins", 0.45, 0.9),
  unfold: at("origins", 0.98, 1.3),
  token: at("origins", 1.35, 1.85),
  merge: at("origins", 1.9, 2.22),
  git: at("origins", 2.0, 2.45),
} as const satisfies Record<string, Cue>;

export const PANELS = {
  "org.mc": at("origins", 0.5, 1.02),
  "org.oidc": at("origins", 1.1, 1.92),
  "org.oss": at("origins", 2.05, 2.62),
  "org.forum": at("origins", 1.15, 1.9),
  "org.auth": at("origins", 1.15, 1.9),
  "org.game": at("origins", 1.15, 1.9),
  "org.token": at("origins", 1.36, 1.86),
  "org.main": at("origins", 2.08, 2.62),
  "org.pr": at("origins", 2.15, 2.62),
} as const satisfies Record<string, Cue>;

const VIOLET: Vec3 = [0.68, 0.58, 1.0];
const DIM: Vec3 = [0.93, 0.9, 0.84];

export const origins: StationModule = {
  id: "origins",
  budget: 768,
  build(ctx, frame, budget) {
    // 1. The block: a cube's twelve edges in one stroke (the pen lifts where it must retrace).
    const s = 1.7;
    const corner = (x: number, y: number, z: number): Vec3 => {
      const r = rotateYX([x * s, y * s, z * s], 0.62, 0.42);
      return [r[0], r[1] + 0.2, r[2]];
    };
    const A = corner(-1, -1, -1), B = corner(1, -1, -1), C = corner(1, -1, 1), D = corner(-1, -1, 1);
    const Et = corner(-1, 1, -1), F = corner(1, 1, -1), G = corner(1, 1, 1), Hc = corner(-1, 1, 1);
    // (In 3D, so the camera can turn round it: corners in order, w = ink or pen lifted.)
    const pts3: [Vec3, number][] = [];
    const walk = (p: Vec3, w: number) => pts3.push([p, w]);
    walk([-8, 0, 0], 0);
    walk(A, 0);
    for (const [p, w] of [[B, 1], [C, 1], [D, 1], [A, 1], [Et, 1], [F, 1], [G, 1], [Hc, 1], [Et, 1], [F, 0], [B, 1], [C, 0], [G, 1], [Hc, 0], [D, 1]] as [Vec3, number][]) walk(p, w);
    // Every figure here leaves the station from the same point.
    walk([8, -1.4, 0], 0);
    const cubeRaw = densify(pts3);

    // 2. The sign-in route: forum → auth server → game sites, looping round each.
    const nodes: Record<string, [number, number]> = { forum: [-5.4, 0.9], auth: [0, -1.1], game: [5.4, 0.9] };
    const route = new PathBuilder();
    route.point(-8, 0, 1);
    const loop = (c: [number, number]) => {
      route.line(c[0] - 1, c[1], 1, 0.05);
      route.arc(c[0], c[1], 1, 1, Math.PI, Math.PI - Math.PI * 2);
    };
    loop(nodes.forum);
    loop(nodes.auth);
    loop(nodes.game);
    route.line(7, 0.9, 1, 0.05);
    route.line(8, -1.4, 1, 0.05);
    const routeRaw = route.build();

    // 3. The pull request: off main, a few commits up the branch, merged back.
    const mainY = -1.4;
    const branch = new PathBuilder();
    branch.point(-8, 0, 1);
    branch.line(-7.4, mainY, 1, 0.05);
    branch.line(-5.6, mainY, 1, 0.05);
    for (let i = 1; i <= 30; i++) {
      const t = i / 30;
      branch.point(-5.6 + 1.8 * t, mainY + (1.0 - mainY) * (0.5 - 0.5 * Math.cos(Math.PI * t)), 1);
    }
    branch.line(2.4, 1.0, 1, 0.05);
    for (let i = 1; i <= 30; i++) {
      const t = i / 30;
      branch.point(2.4 + 1.8 * t, 1.0 + (mainY - 1.0) * (0.5 - 0.5 * Math.cos(Math.PI * t)), 1);
    }
    branch.line(8, mainY, 1, 0.05);
    const branchRaw = branch.build();

    const keyframes = [cubeRaw, routeRaw, branchRaw].map((k) => localToWorld(frame, resample(k, budget, 0.4)));

    const lines: LineDef[] = [];
    for (const c of Object.values(nodes)) {
      lines.push({ points: localToWorld(frame, circle(c[0], c[1], 1.25, 40)), color: DIM, width: 0.55 });
    }
    const ringLines = lines.length;
    lines.push({ points: localToWorld(frame, segment([-8, mainY, 0], [8, mainY, 0], 2)), color: DIM, width: 0.8 });
    for (const x of [-7, -4.8, -2.4, 0, 2.6, 5, 7]) {
      lines.push({ points: localToWorld(frame, circle(x, mainY, 0.13, 16)), color: DIM, width: 0.8 });
    }
    for (const x of [-2.6, -0.6, 1.4]) {
      lines.push({ points: localToWorld(frame, circle(x, 1.0, 0.13, 16)), color: VIOLET, width: 0.8 });
    }

    const anchors: Record<string, Vec3> = {
      "org.forum": toWorld(frame, nodes.forum[0], nodes.forum[1] - 1.45),
      "org.auth": toWorld(frame, nodes.auth[0], nodes.auth[1] - 1.45),
      "org.game": toWorld(frame, nodes.game[0], nodes.game[1] - 1.45),
      "org.main": toWorld(frame, -8, mainY - 0.5),
      "org.pr": toWorld(frame, -0.6, 1.5),
    };

    return {
      id: "origins",
      frame,
      keyframes,
      color: VIOLET,
      width: 1,
      arrive: CUES.arrive,
      pose(t) {
        const m = cue(t, CUES.merge);
        if (m > 0) return { from: 1, to: 2, mix: E.inOutCubic(m), stagger: 0.3 };
        return { from: 0, to: 1, mix: E.inOutCubic(cue(t, CUES.unfold)), stagger: 0.25, brighten: true };
      },
      draw: (t) => E.inOutSine(cue(t, CUES.block)),
      anchors,
      lines,
      lineState(t, out) {
        const rings = Math.min(cue(t, CUES.unfold), 1 - cue(t, CUES.merge));
        const git = cue(t, CUES.git);
        lines.forEach((_, i) => {
          if (i < ringLines) {
            out[i * 2] = E.outCubic(rings);
            out[i * 2 + 1] = 0.55 * rings;
          } else {
            out[i * 2] = E.outCubic(git);
            out[i * 2 + 1] = 0.6 * git;
          }
        });
      },
      pulse(t) {
        const k = cue(t, CUES.token);
        return k > 0 && k < 1 ? E.inOutSine(k) * (budget - 1) : null;
      },
      holds(view) {
        const st = stationStart("origins");
        const cubeCenter = toWorld(frame, 0, 0.2);
        return [
          ...holdBetween(st + 0.5, st + 0.95, cubeCenter, frame, [-0.35, -0.08], [0.25, -0.12], 3.4, 3.4, view),
          ...holdBetween(st + 1.12, st + 1.85, toWorld(frame, 0, 0), frame, [-0.06, -0.05], [0.04, -0.06], 8.6, 3.2, view),
          ...holdBetween(st + 2.08, st + 2.6, toWorld(frame, 0, -0.2), frame, [0.05, -0.04], [-0.04, -0.05], 8.6, 2.8, view),
        ];
      },
    };
  },
};

/** A 3D polyline from corner points, sampled densely along each edge, keeping intensities. */
function densify(corners: [Vec3, number][]) {
  const out: number[] = [];
  for (let i = 0; i < corners.length; i++) {
    const [p, w] = corners[i];
    if (i === 0) {
      out.push(p[0], p[1], p[2], w);
      continue;
    }
    const [q] = corners[i - 1];
    const n = Math.max(2, Math.ceil(Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) / 0.03));
    for (let k = 1; k <= n; k++) {
      const t = k / n;
      out.push(q[0] + (p[0] - q[0]) * t, q[1] + (p[1] - q[1]) * t, q[2] + (p[2] - q[2]) * t, w);
    }
  }
  return new Float32Array(out);
}
