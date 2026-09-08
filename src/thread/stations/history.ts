// Station 5: History. The thread straightens into a timeline, rising gently; a tick and a label at
// each step, from first code to now. What he did, not where (employers are named on /history).

import { at, cue, stationStart, type Cue } from "../beats";
import { E, type Vec3 } from "../math";
import { holdBetween, localToWorld, segment, toWorld, type LineDef, type StationModule } from "./kit";

/** The steps, left to right; `x` in the station's units along the line. */
export const STEPS = [
  { id: "his.early", x: -8.2 },
  { id: "his.2018", x: -5 },
  { id: "his.2020", x: -1.8 },
  { id: "his.2021", x: 1.4 },
  { id: "his.2023", x: 4.6 },
  { id: "his.2026", x: 7.8 },
] as const;

const DRAW: Cue = at("history", 0.45, 1.45);
const X0 = -9.5;
const X1 = 9.5;
const lineY = (x: number) => -0.8 + 0.06 * (x - X0);
/** When the pen passes `x` (the inverse of its eased progress). */
const passes = (x: number) => {
  const p = (x - X0) / (X1 - X0);
  return DRAW[0] + (Math.acos(1 - 2 * p) / Math.PI) * (DRAW[1] - DRAW[0]);
};

export const CUES = {
  arrive: at("history", -0.55, 0.45),
  draw: DRAW,
} as const satisfies Record<string, Cue>;

export const PANELS = {
  "his.title": at("history", 0.5, 1.92),
  ...Object.fromEntries(STEPS.map((s) => [s.id, [passes(s.x) - 0.02, stationStart("history") + 1.92] as const])),
} as unknown as Record<(typeof STEPS)[number]["id"] | "his.title", Cue>;

const WARM: Vec3 = [1.0, 0.95, 0.88];

export const history: StationModule = {
  id: "history",
  budget: 512,
  build(_ctx, frame, budget) {
    const line = new Float32Array(budget * 4);
    for (let i = 0; i < budget; i++) {
      const x = X0 + ((X1 - X0) * i) / (budget - 1);
      line.set([x, lineY(x), 0, 1], i * 4);
    }
    const lines: LineDef[] = STEPS.map((s, i) => {
      const y = lineY(s.x);
      const up = i % 2 === 0;
      return {
        points: localToWorld(frame, segment([s.x, y, 0], [s.x, y + (up ? 0.9 : -0.9), 0], 8)),
        color: WARM,
        width: 0.7,
      };
    });
    const anchors: Record<string, Vec3> = {};
    STEPS.forEach((s, i) => {
      const y = lineY(s.x);
      anchors[s.id] = toWorld(frame, s.x, y + (i % 2 === 0 ? 1.05 : -1.05));
    });

    return {
      id: "history",
      frame,
      keyframes: [localToWorld(frame, line)],
      color: WARM,
      width: 1,
      arrive: CUES.arrive,
      pose: () => ({ from: 0, to: 0, mix: 0 }),
      draw: (t) => E.inOutSine(cue(t, DRAW)),
      anchors,
      lines,
      lineState(t, out) {
        STEPS.forEach((s, i) => {
          const k = E.outCubic(Math.min(Math.max((t - passes(s.x)) / 0.12, 0), 1));
          out[i * 2] = k;
          out[i * 2 + 1] = 0.7 * k;
        });
      },
      holds(view) {
        const st = stationStart("history");
        const target = toWorld(frame, 0, lineY(0));
        // Across the full width, above the panel: the labels need the room.
        const wide = view.aspect >= 1;
        const f = wide ? { x0: -0.9, x1: 0.9, y0: -0.12, y1: 0.78 } : { x0: -0.9, x1: 0.9, y0: -0.25, y1: 0.8 };
        return [
          ...holdBetween(st + 0.5, st + 1.2, target, frame, [-0.12, -0.03], [-0.05, -0.04], 10.4, 2.8, view, 34, f),
          ...holdBetween(st + 1.45, st + 1.9, target, frame, [0.0, -0.05], [0.06, -0.06], 10.4, 2.8, view, 34, f),
        ];
      },
    };
  },
};
