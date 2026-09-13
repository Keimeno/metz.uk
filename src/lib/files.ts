// Build-time checks for files in `public/`, so optional pictures (the portrait, the thread's stills)
// show up as soon as they're dropped in, and a placeholder shows until then. Also finds the fonts
// and stills the social cards are drawn from.

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** The project root: the nearest folder up from this module (source or bundled) with the config. */
function projectRoot(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(dir, "astro.config.mjs"))) return dir;
    const up = dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return process.cwd();
}

const ROOT = projectRoot();

/** An absolute path from project-relative parts ("public", "media/x.webp"). */
export const fromRoot = (...parts: string[]): string => join(ROOT, ...parts);

/** Whether `public/<path>` exists; `path` as the site serves it ("/media/x.webp"). */
export function publicFileExists(path: string): boolean {
  return existsSync(join(ROOT, "public", path));
}
