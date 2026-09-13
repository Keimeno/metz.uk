// Social cards: one PNG per page and language, drawn at build time (src/lib/og-render.ts) and served
// from a path derived from the page's own: /work/zenarios/ → /og/work/zenarios.png.

import type { StationId } from "../thread/beats";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/** What a card says. */
export interface OgCard {
  /** The page's path; the card shows it as its address. */
  path: string;
  /** The small line above the title, e.g. "Case study". */
  eyebrow: string;
  title: string;
  subtitle?: string;
  /** The accent colour (a project's tint). */
  tint?: string;
  /** Draws this station's still behind the text. */
  station?: Extract<StationId, "zenarios" | "signals" | "paperscores" | "origins">;
  /** The home card: the name is the title, so the footer doesn't repeat it. */
  home?: boolean;
}

/** "/" → "/og/index.png", "/de/" → "/og/de.png", "/work/zenarios/" → "/og/work/zenarios.png". */
export const ogImagePath = (pagePath: string): string =>
  pagePath === "/" ? "/og/index.png" : `/og${pagePath.replace(/\/$/, "")}.png`;

/** The endpoint's `[...slug]` for a page path (the inverse of the route). */
export const ogSlug = (pagePath: string): string =>
  ogImagePath(pagePath).slice("/og/".length, -".png".length);
