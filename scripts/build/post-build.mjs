// An Astro integration for two steps after every build:
// - the German 404 moves to dist/de/404.html, where Cloudflare looks for the nearest 404 page
//   (Astro writes it to dist/de/404/index.html);
// - the Content-Security-Policy in dist/_headers gets the hash of every inline script the pages
//   actually ship, in place of the placeholder in public/_headers.
import {
  existsSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { HASH_PLACEHOLDER, cspHash, inlineScripts } from "../lib/inline-scripts.mjs";

const htmlFiles = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? htmlFiles(path) : name.endsWith(".html") ? [path] : [];
  });

export default function postBuild() {
  return {
    name: "metz-post-build",
    hooks: {
      "astro:build:done": ({ dir, logger }) => {
        const dist = fileURLToPath(dir);

        const de404 = join(dist, "de/404/index.html");
        if (existsSync(de404)) {
          renameSync(de404, join(dist, "de/404.html"));
          rmSync(join(dist, "de/404"), { recursive: true });
        }

        const headersFile = join(dist, "_headers");
        const headers = readFileSync(headersFile, "utf8");
        if (headers.split(HASH_PLACEHOLDER).length !== 2)
          throw new Error(`_headers must contain ${HASH_PLACEHOLDER} exactly once`);
        const hashes = new Set();
        for (const file of htmlFiles(dist))
          for (const script of inlineScripts(readFileSync(file, "utf8")))
            hashes.add(cspHash(script));
        writeFileSync(headersFile, headers.replace(HASH_PLACEHOLDER, [...hashes].sort().join(" ")));
        logger.info(
          `CSP: ${hashes.size} inline script hash(es) in _headers; German 404 at de/404.html`
        );
      },
    },
  };
}
