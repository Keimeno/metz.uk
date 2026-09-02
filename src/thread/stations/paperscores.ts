// Station 3: PaperScores. A page of a paper, its lines faint; the pen underlines the passages the
// grader cites as evidence, then winds into a gauge whose arc is the score, the six sub-scores as
// rings inside it. The scorecard is a real output of the PaperScores pipeline (a narrative review,
// which scores low on methods by design); the paper itself isn't named.

import scorecard from "../../../data/sources/paperscores/scorecard.json";
import { at, cue, stationStart, type Cue } from "../beats";
import { E, clamp, prng, type Vec3 } from "../math";
import { PathBuilder, resample } from "../geometry/path";
import { circle, holdBetween, localToWorld, segment, toWorld, type LineDef, type StationModule } from "./kit";

export const CUES = {
  arrive: at("paperscores", -0.55, 0.45),
  page: at("paperscores", 0.2, 0.7),
  read: at("paperscores", 0.5, 1.35),
  rings: at("paperscores", 1.3, 1.9),
  score: at("paperscores", 1.05, 1.35),
} as const satisfies Record<string, Cue>;

export const PANELS = {
  "ps.title": at("paperscores", 0.55, 1.98),
  "ps.f1": at("paperscores", 0.68, 1.98),
  "ps.f2": at("paperscores", 0.84, 1.98),
  "ps.f3": at("paperscores", 0.98, 1.98),
  "ps.score": at("paperscores", 1.08, 1.98),
} as const satisfies Record<string, Cue>;

export const SCORE = scorecard.overall;
export const SUBSCORES = scorecard.subscores;

const CYAN: Vec3 = [0.45, 0.85, 0.98];
const PAPER: Vec3 = [0.93, 0.9, 0.84];

export const paperscores: StationModule = {
  id: "paperscores",
  budget: 640,
  build(ctx, frame, budget) {
    const rand = prng(41);
    // The page: a title, then paragraphs of text lines. Wide screens put the gauge beside the
    // page, tall ones below it.
    const tall = ctx.portrait;
    const left = tall ? -3.3 : -7.4;
    const right = tall ? 3.3 : -1.2;
    const top = tall ? 6.8 : 4.2;
    const bottom = tall ? 0.9 : -4.4;
    const lines: LineDef[] = [];
    const bars: { y: number; x1: number }[] = [];
    let y = top;
    lines.push({ points: localToWorld(frame, segment([left, y, 0], [left + 4.6, y, 0])), color: PAPER, width: 1.6 });
    y -= 0.42;
    lines.push({ points: localToWorld(frame, segment([left, y, 0], [left + 3.1, y, 0])), color: PAPER, width: 1.6 });
    y -= 0.7;
    while (y > bottom) {
      const paragraph = 4 + Math.floor(rand() * 4);
      for (let i = 0; i < paragraph && y > bottom; i++) {
        const last = i === paragraph - 1;
        const x1 = last ? left + (right - left) * (0.35 + 0.4 * rand()) : right - rand() * 0.25;
        bars.push({ y, x1 });
        lines.push({ points: localToWorld(frame, segment([left, y, 0], [x1, y, 0])), color: PAPER, width: 0.7 });
        y -= 0.3;
      }
      y -= 0.22;
    }
    const pageLines = lines.length;

    // The gauge, right of the page.
    const gx = tall ? 0 : 4.1;
    const gy = tall ? -2.6 : 0;
    const R = 3.2;
    const start = Math.PI / 2;
    const subs = Object.values(SUBSCORES);
    subs.forEach((score, i) => {
      const r = 2.6 - i * 0.36;
      lines.push({ points: localToWorld(frame, circle(gx, gy, r, 48)), color: CYAN, width: 0.5 });
      lines.push({
        points: localToWorld(frame, circle(gx, gy, r, 48, 0, start, -Math.PI * 2 * (score / 100))),
        color: CYAN,
        width: 1.1,
      });
    });
    lines.push({ points: localToWorld(frame, circle(gx, gy, R, 48)), color: CYAN, width: 0.5 });

    // The pen: underline three cited passages, then sweep into the gauge.
    const cited = (tall ? [3, 8, 13] : [5, 12, 19]).map((i) => bars[Math.min(i, bars.length - 1)]);
    const p = new PathBuilder();
    cited.forEach((b, i) => {
      const uy = b.y - 0.13;
      if (i === 0) p.point(left, uy);
      else p.moveTo(left, uy);
      p.line(b.x1, uy);
    });
    const last = cited[cited.length - 1];
    p.moveTo(last.x1 + 0.4, last.y - 0.13);
    // A swoop up to the top of the gauge, then the arc: as long as the score.
    const from: [number, number] = [last.x1 + 0.4, last.y - 0.13];
    const to: [number, number] = [gx, gy + R];
    for (let i = 1; i <= 40; i++) {
      const t = i / 40;
      const cx = (from[0] + to[0]) / 2;
      const cy = Math.max(from[1], to[1]) + 1.2;
      p.point((1 - t) ** 2 * from[0] + 2 * (1 - t) * t * cx + t * t * to[0], (1 - t) ** 2 * from[1] + 2 * (1 - t) * t * cy + t * t * to[1], 0.55);
    }
    p.arc(gx, gy, R, R, start, start - Math.PI * 2 * (SCORE / 100));
    const figure = resample(p.build(), budget, 0.3);

    const anchors: Record<string, Vec3> = {
      "ps.f1": toWorld(frame, cited[0].x1, cited[0].y - 0.13),
      "ps.f2": toWorld(frame, cited[1].x1, cited[1].y - 0.13),
      "ps.f3": toWorld(frame, cited[2].x1, cited[2].y - 0.13),
      "ps.score": toWorld(frame, gx, gy),
    };

    const ringCount = subs.length * 2 + 1;
    return {
      id: "paperscores",
      frame,
      keyframes: [localToWorld(frame, figure)],
      color: CYAN,
      width: 1.1,
      arrive: CUES.arrive,
      pose: () => ({ from: 0, to: 0, mix: 0 }),
      draw: (t) => E.inOutSine(cue(t, CUES.read)),
      anchors,
      lines,
      lineState(t, out) {
        const page = cue(t, CUES.page);
        for (let i = 0; i < pageLines; i++) {
          out[i * 2] = E.outCubic(clamp(page * 2.2 - (i / pageLines) * 1.2));
          out[i * 2 + 1] = 0.32;
        }
        const rings = cue(t, CUES.rings);
        for (let j = 0; j < ringCount; j++) {
          const i = pageLines + j;
          const isTrack = j % 2 === 0 || j === ringCount - 1;
          const k = Math.floor(j / 2);
          out[i * 2] = isTrack ? E.outCubic(clamp(rings * 3)) : E.inOutCubic(clamp(rings * 1.6 - k * 0.12));
          out[i * 2 + 1] = isTrack ? 0.18 : 0.9;
        }
      },
      holds(view) {
        const s = stationStart("paperscores");
        const target = tall ? toWorld(frame, 0, 0.5) : toWorld(frame, -1.6, 0);
        const hw = tall ? 3.8 : 6.8;
        const hh = tall ? 6.6 : 4.9;
        return [
          ...holdBetween(s + 0.5, s + 1.0, target, frame, [-0.14, -0.04], [-0.06, -0.05], hw, hh, view),
          ...holdBetween(s + 1.2, s + 1.95, target, frame, [0.02, -0.06], [0.12, -0.05], hw, hh, view),
        ];
      },
    };
  },
};

