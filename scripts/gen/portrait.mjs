// The portrait at its stable URL (/constantin-metz.jpg, for search and structured data) plus a
// smaller copy for phones. Cropped to 4:5, colour kept, and every bit of metadata stripped: the
// original carries the camera's GPS position.
//   node scripts/gen/portrait.mjs [source]
import sharp from "sharp";

const src = process.argv[2] ?? "data/sources/portrait/constantin-portrait.jpeg";
const meta = await sharp(src).metadata();
const w = meta.width;
const h = Math.round((w * 5) / 4);
// Trim the sky above the arch, not the shoulders.
const top = Math.round((meta.height - h) * 0.85);

for (const [out, width] of [
  ["public/constantin-metz.jpg", 1200],
  ["public/media/constantin-metz-640.jpg", 640],
]) {
  const info = await sharp(src)
    .rotate()
    .extract({ left: 0, top, width: w, height: h })
    .resize(width, Math.round((width * 5) / 4))
    .toColourspace("srgb")
    .jpeg({ quality: 80, mozjpeg: true, progressive: true })
    .toFile(out);
  console.log(out, `${info.width}×${info.height}`, `${(info.size / 1024).toFixed(0)} KB`);
}
