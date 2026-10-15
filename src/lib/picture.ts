// The modern-format versions of a picture in public/ (made by scripts/gen/phone.mjs), as <source>
// elements for <picture>: "/media/x.jpg" finds x.avif and x.webp, plus x-960.* where they exist.

import { publicFileExists } from "./files";

const FORMATS = [
  ["avif", "image/avif"],
  ["webp", "image/webp"],
] as const;

/** One `{ type, srcset }` per format that exists; `width` is the base file's width in px. */
export function pictureSources(src: string, width: number): { type: string; srcset: string }[] {
  const stem = src.replace(/\.[a-z]+$/i, "");
  return FORMATS.flatMap(([ext, type]) => {
    const files = [
      [`${stem}.${ext}`, width],
      [`${stem}-${width * 2}.${ext}`, width * 2],
    ].filter(([file]) => publicFileExists(file as string));
    return files.length ? [{ type, srcset: files.map(([f, w]) => `${f} ${w}w`).join(", ") }] : [];
  });
}
