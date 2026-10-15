// Geist and Geist Mono, cut down to the characters the site uses: every character in the built
// pages' text (and their alt, title and aria-label attributes, and the CSS `content` strings),
// plus printable ASCII (code samples, the thread's decoding kickers) and a few German and
// typographic marks. The weight axis and the layout features the site uses stay.
// Sources: the upstream variable fonts in data/sources/fonts (OFL-1.1, from the `geist` npm
// package 1.7.2), which also have the arrows (→ ↗) the fontsource builds lack.
// Writes src/assets/fonts/{geist,geist-mono}.woff2 and fonts.json (the code points each covers);
// verify-dist fails when a page uses a character the fonts have but the subsets don't.
//   npm run build && node scripts/gen/fonts.mjs && npm run build   (needs uv; fontTools runs via uvx)
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { visibleText } from "../lib/visible-text.mjs";

const FONTTOOLS = "fonttools[woff]==4.67.0";
const FONTS = [
  { name: "geist", src: "data/sources/fonts/Geist-Variable.woff2" },
  { name: "geist-mono", src: "data/sources/fonts/GeistMono-Variable.woff2" },
];
const OUT = "src/assets/fonts";
// Everything the CSS can ask for: kerning, ligatures and marks, tabular figures, case forms.
const FEATURES = "kern,liga,calt,ccmp,locl,mark,mkmk,tnum,case";
const ALWAYS =
  Array.from({ length: 0x7f - 0x20 }, (_, i) => String.fromCodePoint(0x20 + i)).join("") +
  " ÄÖÜäöüßéèêëàáâçñóôøåæ€£§©®°±×÷·•…–—‘’‚“”„‹›«»→←↑↓↗↘−≤≥≈";

const pages = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (name.endsWith(".html")) pages.push(path);
  }
};
walk("dist");
if (!pages.length) throw new Error("No pages in dist/: run `npm run build` first.");

const chars = new Set(ALWAYS);
for (const page of pages) for (const ch of visibleText(readFileSync(page, "utf8"))) chars.add(ch);
const codepoints = [...chars]
  .map((c) => c.codePointAt(0))
  .filter((cp) => cp >= 0x20 && cp !== 0x7f);

const uvx = (args) => {
  const r = spawnSync("uvx", ["--from", FONTTOOLS, ...args], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`uvx ${args[0]} failed:\n${r.stderr || r.error}`);
  return r.stdout;
};
const tmp = mkdtempSync(join(tmpdir(), "metz-fonts-"));
const unicodes = join(tmp, "unicodes.txt");
writeFileSync(
  unicodes,
  codepoints.map((cp) => `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`).join("\n")
);

const manifest = { pages: pages.length, fonts: {} };
for (const font of FONTS) {
  const out = join(OUT, `${font.name}.woff2`);
  uvx([
    "pyftsubset",
    font.src,
    `--unicodes-file=${unicodes}`,
    `--layout-features=${FEATURES}`,
    "--flavor=woff2",
    "--no-hinting",
    "--desubroutinize",
    `--output-file=${out}`,
  ]);
  const covered = JSON.parse(
    uvx([
      "python",
      "-c",
      "import json,sys; from fontTools.ttLib import TTFont; print(json.dumps(sorted(TTFont(sys.argv[1]).getBestCmap())))",
      out,
    ])
  );
  const missing = codepoints.filter((cp) => !covered.includes(cp));
  manifest.fonts[font.name] = { file: `${font.name}.woff2`, covered, missing };
  console.log(
    out,
    `${(statSync(out).size / 1024).toFixed(1)} KB,`,
    `${covered.length} characters`,
    missing.length
      ? `(not in the font: ${missing.map((cp) => String.fromCodePoint(cp)).join(" ")})`
      : ""
  );
}
writeFileSync(join(OUT, "fonts.json"), JSON.stringify(manifest) + "\n");
rmSync(tmp, { recursive: true, force: true });
