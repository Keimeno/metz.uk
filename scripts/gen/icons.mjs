// The favicon set, from the "M" mark in public/favicon.svg: favicon.ico (16, 32 and 48 px, for
// RSS readers, crawlers and older browsers), apple-touch-icon.png (180 px, opaque: iOS rounds the
// corners itself) and the web manifest's 192 and 512 px icons.
//   node scripts/gen/icons.mjs
import { writeFileSync } from "node:fs";
import sharp from "sharp";

const SVG = "public/favicon.svg";
const INK = "#0B0B0C";

/** The mark as a PNG of `size` px; `square` fills the rounded corners with the background. */
const png = (size, square = false) => {
  let img = sharp(SVG, { density: Math.max(72, Math.ceil((72 * size) / 64)) }).resize(size, size);
  if (square) img = img.flatten({ background: INK });
  return img.png({ compressionLevel: 9, palette: size <= 48 }).toBuffer();
};

for (const [file, size] of [
  ["public/apple-touch-icon.png", 180],
  ["public/icon-192.png", 192],
  ["public/icon-512.png", 512],
]) {
  const buf = await png(size, true);
  writeFileSync(file, buf);
  console.log(file, `${size}×${size}`, `${(buf.length / 1024).toFixed(1)} KB`);
}

// An .ico is a directory of images; modern ones may simply hold PNGs.
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map((s) => png(s)));
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
