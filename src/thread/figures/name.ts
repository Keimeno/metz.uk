// "Constantin Metz" as single-stroke lettering, so the thread can write the name in one line.
// Glyphs are drawn on a grid where the cap height is 0.72 and the x-height 0.52 (close to Geist's
// proportions), then centred and scaled so the cap height is 1 world unit.

import { PathBuilder, bounds, roundCorners, transform2D } from "../geometry/path";

const XH = 0.52;
const CAP = 0.72;
const D = Math.PI / 180;

/** Draws one glyph at `x` and returns its advance width. */
type Glyph = (p: PathBuilder, x: number) => number;

const GLYPHS: Record<string, Glyph> = {
  C: (p, x) => {
    p.arc(x + 0.37, CAP / 2, 0.35, CAP / 2, 40 * D, 320 * D);
    return 0.8;
  },
  o: (p, x) => {
    p.arc(x + 0.26, XH / 2, 0.24, XH / 2, 100 * D, 460 * D);
    return 0.58;
  },
  n: (p, x) => {
    p.moveTo(x + 0.04, 0).line(x + 0.04, XH);
    p.arc(x + 0.25, 0.3, 0.21, 0.22, 180 * D, 0).line(x + 0.46, 0);
    return 0.56;
  },
  s: (p, x) => {
    p.arc(x + 0.2, 0.385, 0.17, 0.125, 28 * D, 270 * D);
    p.arc(x + 0.2, 0.135, 0.18, 0.125, 90 * D, -152 * D);
    return 0.46;
  },
  t: (p, x) => {
    p.moveTo(x, XH).line(x + 0.3, XH);
    p.moveTo(x + 0.12, 0.66).line(x + 0.12, 0.1);
    p.arc(x + 0.24, 0.1, 0.12, 0.1, 180 * D, 270 * D).line(x + 0.33, 0);
    return 0.39;
  },
  a: (p, x) => {
    p.arc(x + 0.25, XH / 2, 0.23, XH / 2, 0, 360 * D);
    p.moveTo(x + 0.48, XH).line(x + 0.48, 0);
    return 0.6;
  },
  i: (p, x) => {
    p.arc(x + 0.06, 0.67, 0.024, 0.024, 90 * D, 450 * D);
    p.moveTo(x + 0.06, XH).line(x + 0.06, 0);
    return 0.24;
  },
  M: (p, x) => {
    p.moveTo(x + 0.02, 0).line(x + 0.02, CAP).line(x + 0.4, 0.04).line(x + 0.78, CAP).line(x + 0.78, 0);
    return 0.92;
  },
  e: (p, x) => {
    p.moveTo(x + 0.03, 0.27).line(x + 0.49, 0.27);
    p.arc(x + 0.26, XH / 2, 0.23, XH / 2, 2.5 * D, 318 * D);
    return 0.58;
  },
  z: (p, x) => {
    p.moveTo(x + 0.03, XH).line(x + 0.43, XH).line(x + 0.03, 0).line(x + 0.46, 0);
    return 0.5;
  },
  " ": () => 0.3,
};

export const NAME = "Constantin Metz";

export interface NameFigure {
  /** The lettering, xyzw, centred on the origin with a cap height of 1. */
  points: Float32Array;
  width: number;
  height: number;
  /** Where the baseline sits (y), so the thread can pull taut along it. */
  baseline: number;
}

export function nameFigure(text = NAME): NameFigure {
  const p = new PathBuilder();
  let x = 0;
  for (const ch of text) {
    const glyph = GLYPHS[ch];
    if (!glyph) throw new Error(`No glyph for "${ch}"`);
    x += glyph(p, x);
  }
  const points = roundCorners(p.build());
  const b = bounds(points);
  const s = 1 / CAP;
  transform2D(points, -(b.minX + b.width / 2), -CAP / 2, s);
  return { points, width: b.width * s, height: 1, baseline: -0.5 };
}
