// The master timeline: every station's cues and panels in one table. The thread, the camera, the
// text panels and the sound all read their timing from here, the way the Zenarios film reads its
// cues from one table. Isomorphic: no DOM.

import { at, type Cue, type StationId } from "./beats";
import * as history from "./stations/history";
import * as intro from "./stations/intro";
import * as origins from "./stations/origins";
import * as paperscores from "./stations/paperscores";
import * as signals from "./stations/signals";
import * as zenarios from "./stations/zenarios";

export * from "./beats";

/** The stations that draw a figure, in the order the pen visits them. */
export const STATION_MODULES = [
  intro.intro,
  zenarios.zenarios,
  signals.signals,
  paperscores.paperscores,
  origins.origins,
  history.history,
];

const prefixed = (prefix: string, cues: Record<string, Cue>) =>
  Object.fromEntries(Object.entries(cues).map(([k, v]) => [`${prefix}.${k}`, v]));

/** Every cue, as "<station>.<cue>" (e.g. "zen.burst"). */
export const CUES: Record<string, Cue> = {
  ...prefixed("intro", intro.CUES),
  ...prefixed("zen", zenarios.CUES),
  ...prefixed("sig", signals.CUES),
  ...prefixed("ps", paperscores.CUES),
  ...prefixed("org", origins.CUES),
  ...prefixed("his", history.CUES),
  "end.overview": at("end", 0.05, 0.5),
};

/** When each text panel or label is on screen. */
export const PANELS = {
  ...intro.PANELS,
  ...zenarios.PANELS,
  ...signals.PANELS,
  ...paperscores.PANELS,
  ...origins.PANELS,
  ...history.PANELS,
  "end.next": at("end", 0.35, 99),
} as const satisfies Record<string, Cue>;

export type PanelId = keyof typeof PANELS;

/** The chapters in the header, in order, and the station each one jumps to. */
export const CHAPTERS: { id: string; station: StationId }[] = [
  { id: "zenarios", station: "zenarios" },
  { id: "signals", station: "signals" },
  { id: "paperscores", station: "paperscores" },
  { id: "origins", station: "origins" },
  { id: "history", station: "history" },
];
