// The favicon set: the thread's M (src/thread/figures/name.ts, its grid scaled so the cap height
// is 100 units, y down) on an ink tile, ending in the nib, the pen's point of light. favicon.svg
// and favicon.ico (16, 32 and 48 px, for RSS readers, crawlers and older browsers) with a line
// heavy enough for a tab; apple-touch-icon.png (180 px, opaque: iOS rounds the corners itself) and
// the manifest's 192 and 512 px icons with a finer one; and a maskable 512 px icon whose M stays
// inside the safe circle Android crops to.
//   node scripts/gen/icons.mjs
import { writeFileSync } from "node:fs";
import sharp from "sharp";

const INK = "#0B0B0C";
const TEXT = "#EDEBE6";

// name.ts draws on a grid where the cap height is 0.72; its M's stems are 0.76 apart and the vee
// reaches to 0.04 above the baseline.
const K = 100 / 0.72;
const W = +(0.76 * K).toFixed(1);
const M = `M0 100L0 0L${+(W / 2).toFixed(1)} ${+(100 - 0.04 * K).toFixed(1)}L${W} 0L${W} 100`;

/**
 * The tile as SVG: a square of side `s` (in the M's units) centred on it, the line `sw` of the
 * side thick, with its own rounded corners (the favicon) or a full square.
 */
function tile({ s, sw: share, rounded }) {
  const [x, y] = [W / 2 - s / 2, 50 - s / 2].map((v) => +v.toFixed(2));
  const side = +s.toFixed(2);
  const sw = +(share * s).toFixed(2);
  const r = rounded ? +(s * 0.22).toFixed(2) : 0;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${side} ${side}">` +
    `<rect x="${x}" y="${y}" width="${side}" height="${side}" rx="${r}" fill="${INK}"/>` +
    `<path d="${M}" fill="none" stroke="${TEXT}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<circle cx="${W}" cy="100" r="${(sw * 1.15).toFixed(2)}" fill="${TEXT}"/></svg>`
  );
}

// The M across most of the tile; for the maskable icon, within the middle 80 % circle.
const S = Math.max(W, 100) * 1.6;
const MS = Math.hypot(W, 100) / 0.8;

const small = tile({ s: S, sw: 0.075, rounded: true });
const large = tile({ s: S, sw: 0.042, rounded: false });
const maskable = tile({ s: MS, sw: (0.042 * S) / MS, rounded: false });

writeFileSync("public/favicon.svg", small + "\n");
console.log("public/favicon.svg", `${(small.length / 1024).toFixed(1)} KB`);

/** `svg` as a PNG of `size` px. */
const png = (svg, size) =>
  sharp(Buffer.from(svg), { density: Math.max(72, Math.ceil((72 * size) / 64)) })
    .resize(size, size)
    .png({ compressionLevel: 9, palette: size <= 48 })
    .toBuffer();

for (const [file, svg, size] of [
  ["public/apple-touch-icon.png", large, 180],
  ["public/icon-192.png", large, 192],
  ["public/icon-512.png", large, 512],
  ["public/icon-maskable-512.png", maskable, 512],
]) {
  const buf = await png(svg, size);
  writeFileSync(file, buf);
  console.log(file, `${size}×${size}`, `${(buf.length / 1024).toFixed(1)} KB`);
}

// An .ico is a directory of images; modern ones may simply hold PNGs.
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map((s) => png(small, s)));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((size, i) => {
  const e = 6 + 16 * i;
  header.writeUInt8(size, e);
  header.writeUInt8(size, e + 1);
  header.writeUInt16LE(1, e + 4);
  header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(images[i].length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += images[i].length;
});
const ico = Buffer.concat([header, ...images]);
writeFileSync("public/favicon.ico", ico);
console.log("public/favicon.ico", sizes.join("/"), `${(ico.length / 1024).toFixed(1)} KB`);
