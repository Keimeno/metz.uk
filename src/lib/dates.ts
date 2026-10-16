// When each page was first written and last changed, from the git history of the files it's made of
// (src/lib/pages.ts says which), for the sitemap's <lastmod> and the page's dateCreated and
// dateModified in structured data. Committed changes only: a build of the repository says what
// was deployed, and Google ignores a lastmod that always says "today".
//
// Without the history (no git in a Docker build, no .git folder, or a shallow clone, where every
// file would date from the one commit there is) the pages get no dates at all, as before, and the
// build says so once.

import { spawnSync } from "node:child_process";

import { fromRoot } from "./files";

export interface PageDates {
  created: Date;
  modified: Date;
}

type History = Map<string, PageDates>;

let history: History | null | undefined;

/** Every file the history has touched, with its first and last commit; null without full history. */
function loadHistory(): History | null {
  const git = (...args: string[]) =>
    spawnSync("git", ["-C", fromRoot(), ...args], { encoding: "utf8", maxBuffer: 64 << 20 });
  const shallow = git("rev-parse", "--is-shallow-repository");
  if (shallow.status !== 0 || shallow.stdout.trim() !== "false") {
    const why = shallow.error
      ? "git isn't installed"
      : shallow.status !== 0
        ? "not a git repository"
        : "a shallow clone";
    console.warn(`[dates] no git history (${why}): pages get no lastmod or dateModified.`);
    return null;
  }
  // Newest first: "\x1e<committer date>" then the files that commit touched, one per line, as
  // paths from the repository's root (the project's, unless it sits in a subfolder).
  const prefix = git("rev-parse", "--show-prefix").stdout.trim();
  const log = git("log", "--format=%x1e%cI", "--name-only", "--no-renames");
  if (log.status !== 0) return null;
  const files: History = new Map();
  for (const record of log.stdout.split("\x1e").slice(1)) {
    const [date, ...paths] = record.trim().split("\n");
    const when = new Date(date);
    for (const path of paths) {
      if (!path.startsWith(prefix)) continue;
      const name = path.slice(prefix.length);
      if (!name) continue;
      const seen = files.get(name);
      if (seen) seen.created = when;
      else files.set(name, { created: when, modified: when });
    }
  }
  return files;
}

/**
 * The first and last commit across `sources`: files, or folders ending in "/", relative to the
 * project root. Undefined without the history, or if none of them has been committed.
 */
export function datesOf(sources: readonly string[]): PageDates | undefined {
  if (history === undefined) history = loadHistory();
  if (!history) return undefined;
  let created: Date | undefined;
  let modified: Date | undefined;
  for (const [file, d] of history) {
    if (!sources.some((s) => (s.endsWith("/") ? file.startsWith(s) : file === s))) continue;
    if (!created || d.created < created) created = d.created;
    if (!modified || d.modified > modified) modified = d.modified;
  }
  return created && modified ? { created, modified } : undefined;
}

/** "2026-10-16T20:30:00Z": ISO 8601 to the second, for structured data. */
export const isoSeconds = (d: Date): string => d.toISOString().replace(/\.\d{3}Z$/, "Z");

/** "2026-10-16", for the sitemap and llms.txt. */
export const isoDay = (d: Date): string => d.toISOString().slice(0, 10);
