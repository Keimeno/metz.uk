// The inline scripts a page will execute, and their CSP hashes. Shared by the post-build step
// (which writes the hashes into dist/_headers) and verify-dist (which checks them).
import { createHash } from "node:crypto";

const EXECUTABLE = new Set(["", "module", "text/javascript", "application/javascript"]);

/** The source of every inline <script> that runs (not JSON-LD or other data blocks). */
export function inlineScripts(html) {
  const out = [];
  for (const [, attrs, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc\s*=/.test(attrs)) continue;
    const type =
      attrs
        .match(/\btype\s*=\s*"([^"]*)"/i)?.[1]
        .trim()
        .toLowerCase() ?? "";
    if (EXECUTABLE.has(type)) out.push(body);
  }
  return out;
}

/** `'sha256-…'`, as a CSP source expression. */
export const cspHash = (source) =>
  `'sha256-${createHash("sha256").update(source, "utf8").digest("base64")}'`;

/** Where the post-build step puts the hashes in public/_headers. */
export const HASH_PLACEHOLDER = "'inline-script-hashes'";
