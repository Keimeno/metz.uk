// Time on the thread is measured in "beats": one beat is one viewport height of scrolling.
// The stations and their lengths live here; each station module states its own cues relative to
// its start with `at()`. Isomorphic: no DOM.

import { range } from "./math";

export type StationId = "intro" | "zenarios" | "signals" | "paperscores" | "origins" | "history" | "end";

export const STATIONS: { id: StationId; beats: number }[] = [
  { id: "intro", beats: 1 },
  { id: "zenarios", beats: 3.8 },
  { id: "paperscores", beats: 2.6 },
  { id: "end", beats: 1.25 },
];

export const TOTAL_BEATS = STATIONS.reduce((s, x) => s + x.beats, 0);

export function stationStart(id: StationId) {
  let t = 0;
  for (const s of STATIONS) {
    if (s.id === id) return t;
    t += s.beats;
  }
  throw new Error(`Unknown station ${id}`);
}

/** [start, end] in beats. */
export type Cue = readonly [number, number];

/** A cue relative to a station's start (negative `from`: it begins in the station before). */
export const at = (id: StationId, from: number, to: number): Cue => {
  const s = stationStart(id);
  return [s + from, s + to];
};

/** Progress through a cue, 0…1. */
export const cue = (t: number, c: Cue) => range(t, c[0], c[1]);

export const PANEL_FADE = 0.14;

/** 0 outside the cue, 1 inside, with a soft edge of `fade` beats. */
export function visibility(t: number, [a, b]: Cue, fade = PANEL_FADE) {
  return Math.min(range(t, a, a + fade), 1 - range(t, b - fade, b));
}
