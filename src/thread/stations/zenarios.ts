// Station 1: Zenarios. The pen draws the household's forecast month by month (real engine output),
// 1,000 market futures burst out of it and settle onto the median, and the line ends in the app.

import figures from "../../generated/zenarios.json";
import { at, cue, stationStart, type Cue } from "../beats";
import { E, catmullRom, rotateYX, type Vec3 } from "../math";
import {
  figureFrame,
  holdPose,
  toWorld,
  toWorldDir,
  viewDir,
  type CameraKey,
  type StationModule,
} from "./kit";

export const CUES = {
  arrive: at("zenarios", -0.7, 0.5),
  forecast: at("zenarios", 0.5, 1.1),
  burst: at("zenarios", 1.42, 2.0),
  collapse: at("zenarios", 2.22, 2.62),
} as const satisfies Record<string, Cue>;

/** The life events labelled on the forecast: label id → the engine's milestone id. */
export const MILESTONES = [
  { id: "zen.studies", milestone: "ms_gift-to-family" },
  { id: "zen.retire", milestone: "ms_retirement-self" },
] as const;

/** Where a milestone falls along the chart, 0…1. */
function milestoneU(milestone: string): number {
  const m = figures.milestones.find((x) => x.id === milestone);
  return m ? m.index / (figures.horizonMonths - 1) : 0;
}

/** When the pen passes `u` on the forecast (the inverse of its eased progress). */
function penPasses(u: number): number {
  const x = Math.acos(1 - 2 * Math.min(Math.max(u, 0), 1)) / Math.PI;
  return CUES.forecast[0] + x * (CUES.forecast[1] - CUES.forecast[0]);
}
const fromPen = (milestone: string, until: number): Cue => [
  penPasses(milestoneU(milestone)) - 0.02,
  stationStart("zenarios") + until,
];

export const PANELS = {
  "zen.title": at("zenarios", 0.6, 1.42),
  "zen.fan": at("zenarios", 1.6, 2.5),
  "zen.app": at("zenarios", 2.66, 3.38),
  "zen.today": [CUES.forecast[0] + 0.02, stationStart("zenarios") + 2.5],
  "zen.studies": fromPen("ms_gift-to-family", 1.5),
  "zen.retire": fromPen("ms_retirement-self", 2.5),
  "zen.p90": at("zenarios", 1.85, 2.3),
  "zen.p10": at("zenarios", 1.85, 2.3),
  "zen.phone": at("zenarios", 2.48, 3.42),
} as const satisfies Record<string, Cue>;

/** How far the fan has burst and collapsed at time `t`. */
export const fanState = (t: number) => ({
  reveal: E.outCubic(cue(t, CUES.burst)),
  collapse: E.inOutCubic(cue(t, CUES.collapse)),
});

export const FAN_SPREAD = 5.5;
const GREEN: Vec3 = [0.2, 0.86, 0.52];

export const zenarios: StationModule = {
  id: "zenarios",
  budget: 512,
  build(ctx, frame, budget) {
    const data = ctx.data;
    const size = ctx.portrait ? { width: 16, height: 19 } : { width: 16, height: 12 };
    const { width: W, height: H } = size;
    const local = (u: number, v: number): Vec3 => toWorld(frame, (u - 0.5) * W, (v - 0.5) * H);
    const months = data.forecast.length - 1;

    const forecast = new Float32Array(budget * 4);
    const median = new Float32Array(budget * 4);
    for (let i = 0; i < budget; i++) {
      const u = i / (budget - 1);
      forecast.set([...local(u, catmullRom(data.forecast, u * months)), 1], i * 4);
      median.set([...local(u, catmullRom(data.medianYearly, u * data.years)), 1], i * 4);
    }
    let fMin = Infinity;
    let fMax = -Infinity;
    for (const v of data.forecast) {
      fMin = Math.min(fMin, v);
      fMax = Math.max(fMax, v);
    }

    const onForecast = (u: number) => local(u, catmullRom(data.forecast, u * months));
    const anchors: Record<string, Vec3> = {
      ...Object.fromEntries(MILESTONES.map((m) => [m.id, onForecast(data.milestones.get(m.milestone) ?? 0)])),
      "zen.today": local(0, data.forecast[0]),
      "zen.p90": toWorld(frame, W / 2, (data.endP90 - 0.5) * H, 0.4 * FAN_SPREAD),
      "zen.p10": toWorld(frame, W / 2, (data.endP10 - 0.5) * H, -0.4 * FAN_SPREAD),
    };

    // The app, standing where the line ends: the median flows into its own chart.
    const phoneH = ctx.portrait ? 10.5 : 9.4;
    const phone = {
      center: toWorld(frame, W / 2 + phoneH * 0.36, ctx.portrait ? 0.4 : -0.2, 1.4),
      right: toWorldDir(frame, rotateYX([1, 0, 0], -0.32)),
      up: frame.y,
      width: phoneH * (480 / 1020),
      height: phoneH,
    };

    return {
      id: "zenarios",
      frame,
      keyframes: [forecast, median],
      color: GREEN,
      width: 1.15,
      arrive: CUES.arrive,
      pose: (t) => ({ from: 0, to: 1, mix: E.inOutCubic(cue(t, CUES.collapse)) }),
      draw: (t) => E.inOutSine(cue(t, CUES.forecast)),
      anchors,
      planes: { "zen.phone": phone },
      fan: { model: frame.matrix, size },
      holds(view) {
        const zs = stationStart("zenarios");
        const f = figureFrame(view.aspect);
        const a = view.aspect;
        const zw = W / 2;
        const zh = H / 2;
        // While only the forecast is drawn, frame the curve itself so it fills the space.
        const fCenter = toWorld(frame, 0, ((fMin + fMax) / 2 - 0.5) * H);
        const fh = Math.max(((fMax - fMin) / 2) * H * 1.25, zh * 0.45);
        const wide = a >= 1;
        const appTarget = wide ? toWorld(frame, W * 0.3, 0, 0.6) : toWorld(frame, W / 2 + 1.4, 0.4, 0.8);
        const appW = wide ? W * 0.42 : 6.4;
        const appH = phoneH * (wide ? 0.56 : 0.6);
        const key = (t: number, target: Vec3, yaw: number, pitch: number, hw: number, hh: number): CameraKey => ({
          t: zs + t,
          pose: holdPose(target, viewDir(frame, yaw, pitch), 34, hw, hh, f, a),
          hold: true,
        });
        return [
          key(0.6, fCenter, -0.12, -0.02, zw * 1.02, fh),
          key(1.28, fCenter, -0.04, -0.04, zw * 1.02, fh),
          key(1.6, frame.origin, 0.36, -0.14, zw * 1.04, zh * 1.22),
          key(2.2, frame.origin, 0.46, -0.1, zw * 1.04, zh * 1.22),
          key(2.66, appTarget, -0.2, -0.05, appW, appH),
          key(3.22, appTarget, -0.08, -0.06, appW * 0.97, appH * 0.97),
        ];
      },
    };
  },
};
