// The screenshot of keimeno.party (2020) for the history page, with every bit of metadata dropped
// (colour profile, EXIF, XMP, comments): the pixels are re-encoded as sRGB WebP and nothing else is
// copied over. Not resized: the page shows it at up to about 800 px wide, so 2000 px is sharp on
// 2× and 3× screens.
//   node scripts/gen/old-site.mjs <screenshot>
import sharp from "sharp";

const src = process.argv[2];
if (!src) {
  console.error("usage: node scripts/gen/old-site.mjs <screenshot>");
  process.exit(1);
}
const out = "public/media/keimeno-party-2020.webp";
const info = await sharp(src)
  .rotate()
  .toColourspace("srgb")
  .webp({ quality: 88, effort: 6 })
  .toFile(out);
const meta = await sharp(out).metadata();
if (meta.exif || meta.xmp || meta.iptc || meta.icc) throw new Error("metadata survived");
console.log(
  out,
  `${info.width}×${info.height}`,
  `${(info.size / 1024).toFixed(0)} KB`,
  "no metadata"
);
