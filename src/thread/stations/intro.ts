// Station 0: the name. The thread writes "Constantin Metz" over the real headline (on the clock,
// not on scroll), and the first scroll pulls the letters taut into one line, left to right.

import { at, cue, type Cue } from "../beats";
import { nameFigure } from "../figures/name";
import { resample } from "../geometry/path";
import type { Vec3 } from "../math";
import { holdPose, localToWorld, type StationModule } from "./kit";

export const CUES = {
  unspool: at("intro", 0.04, 0.62),
} as const satisfies Record<string, Cue>;

export const PANELS = {
  "intro.lede": [-1, 0.32],
  "intro.hint": [-1, 0.12],
} as const satisfies Record<string, Cue>;

const WARM: Vec3 = [1.0, 0.95, 0.88];

export const intro: StationModule = {
  id: "intro",
  budget: 1536,
  build(ctx, frame, budget) {
    const fig = nameFigure();
    const stretch = ctx.nameAspect ? ctx.nameAspect / fig.width : 1;
    for (let i = 0; i < fig.points.length; i += 4) fig.points[i] *= stretch;
    const width = fig.width * stretch;

    const lettering = resample(fig.points, budget);
    const end = [lettering[(budget - 1) * 4], lettering[(budget - 1) * 4 + 1]];
    const taut = new Float32Array(budget * 4);
    for (let i = 0; i < budget; i++) {
      const t = i / (budget - 1);
      taut.set([-width / 2 + (end[0] + width / 2) * t, fig.baseline, 0, 1], i * 4);
    }

    return {
      id: "intro",
      frame,
      keyframes: [localToWorld(frame, lettering), localToWorld(frame, taut)],
      color: WARM,
      width: 1,
      arrive: [0, 0],
      pose: (t) => ({ from: 0, to: 1, mix: cue(t, CUES.unspool), stagger: 0.6, brighten: true }),
      // The write-on runs on the clock; the scene supplies it.
      draw: () => 1,
      anchors: {},
      holds(view) {
        const rect = view.nameRect ?? { x0: -0.82, x1: 0.82, y0: 0.0, y1: 0.24 };
        const pose = holdPose(frame.origin, [0, 0, -1], 30, width / 2, 0.01, rect, view.aspect);
        return [
          { t: 0, pose, hold: true },
          { t: 0.1, pose, hold: true },
        ];
      },
    };
  },
};
