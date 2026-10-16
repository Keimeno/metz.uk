// The portrait at its stable URL (/constantin-metz.jpg, for search and structured data) plus a
// smaller copy for phones, both 4:5, and three crops for the Person's `image` in structured data,
// where Google asks for 16:9, 4:3 and 1:1, each at least 50,000 pixels. Colour kept, and every bit
// of metadata stripped: the original carries the camera's GPS position.
//   node scripts/gen/portrait.mjs [source]
import sharp from "sharp";

const src = process.argv[2] ?? "data/sources/portrait/constantin-portrait.jpeg";
const meta = await sharp(src).metadata();
// The size once EXIF orientation is applied, which `.rotate()` below does.
const { width: w, height: h } = meta.autoOrient ?? meta;

// Full width, cut to each ratio. `top` places the cut in the height left over: 0 keeps the top of
// the photo, 1 the bottom. Each keeps the whole head with some air above it; the wider the crop,
// the less of the coat fits.
const OUTPUTS = [
  // Trim the sky above the arch, not the shoulders.
  { out: "public/constantin-metz.jpg", ratio: [4, 5], width: 1200, top: 0.85 },
  { out: "public/media/constantin-metz-640.jpg", ratio: [4, 5], width: 640, top: 0.85 },
  { out: "public/media/constantin-metz-16x9.jpg", ratio: [16, 9], width: 1200, top: 0.47 },
  { out: "public/media/constantin-metz-4x3.jpg", ratio: [4, 3], width: 1200, top: 0.51 },
  { out: "public/media/constantin-metz-1x1.jpg", ratio: [1, 1], width: 1200, top: 0.64 },
];

for (const { out, ratio, width, top } of OUTPUTS) {
  const cropH = Math.round((w * ratio[1]) / ratio[0]);
  if (cropH > h) throw new Error(`${out}: the source is too wide for ${ratio.join(":")}`);
  const info = await sharp(src)
    .rotate()
    .extract({ left: 0, top: Math.round((h - cropH) * top), width: w, height: cropH })
    .resize(width, Math.round((width * ratio[1]) / ratio[0]))
    .toColourspace("srgb")
    .jpeg({ quality: 80, mozjpeg: true, progressive: true })
    .toFile(out);
  console.log(out, `${info.width}×${info.height}`, `${(info.size / 1024).toFixed(0)} KB`);
}
