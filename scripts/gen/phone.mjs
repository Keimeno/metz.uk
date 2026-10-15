// The Zenarios phone picture in modern formats: AVIF and WebP next to the JPEG fallback, at
// 480 px, and at 960 px too when the source is that wide (sharp on 2× and 3× screens). Without
// metadata. The home page and the case study pick them up through src/lib/picture.ts.
//   node scripts/gen/phone.mjs [source]   (default: the current JPEG; a 960 px+ PNG is better)
import { existsSync } from "node:fs";
import sharp from "sharp";

const OUT = "public/media/zenarios-overview";
const src = process.argv[2] ?? `${OUT}.jpg`;
const { width } = await sharp(src).metadata();
const widths = [480, ...(width >= 960 ? [960] : [])];

for (const w of widths) {
  const stem = w === 480 ? OUT : `${OUT}-${w}`;
  const img = () => sharp(src).resize(w).toColourspace("srgb");
  const outputs = [
    [`${stem}.avif`, img().avif({ quality: 58, effort: 7 })],
    [`${stem}.webp`, img().webp({ quality: 80, effort: 6 })],
  ];
  // Re-encode the fallback only from a better source, never from itself.
  if (src !== `${OUT}.jpg` || !existsSync(`${stem}.jpg`))
    outputs.push([`${stem}.jpg`, img().jpeg({ quality: 82, mozjpeg: true, progressive: true })]);
  for (const [file, pipeline] of outputs) {
    const info = await pipeline.toFile(file);
    console.log(file, `${info.width}×${info.height}`, `${(info.size / 1024).toFixed(0)} KB`);
  }
}
