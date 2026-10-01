// Draws the social cards (see og.ts) at build time: satori lays the card out as SVG, resvg turns it
// into a PNG, sharp shrinks it. Satori reads neither WOFF2 nor variable fonts, so the cards use the static Geist cuts;
// it doesn't read WebP either, so the thread's stills are re-encoded as JPEG first (sharp).

import { readFileSync } from "node:fs";

import { Resvg } from "@resvg/resvg-js";
import satori, { type SatoriOptions } from "satori";
import sharp from "sharp";

import { fromRoot, publicFileExists } from "./files";
import { OG_HEIGHT, OG_WIDTH, type OgCard } from "./og";

const INK = "#0B0B0C";
const TEXT = "#EDEBE6";
const TEXT_2 = "#C8C5BE";
const MUTED = "#8C8A85";
/** The four stations' colours, in thread order (src/data/projects.ts). */
const STATION_TINTS = ["#34d07f", "#ffbd52", "#73d9fa", "#b9a9ff"];
const PAD_X = 80;
const PAD_Y = 68;
/** The stills are 1800 × 1126; on the card they sit right of the text, their edges masked off. */
const STILL_H = 580;
const STILL_W = Math.round((STILL_H / 1126) * 1800);

type El = { type: string; props: Record<string, unknown> };
const h = (
  type: string,
  style: Record<string, unknown>,
  children?: unknown,
  attrs: Record<string, unknown> = {}
): El => ({
  type,
  props: { style, children, ...attrs },
});

let fonts: SatoriOptions["fonts"] | undefined;
function loadFonts(): SatoriOptions["fonts"] {
  const file = (pkg: string, name: string) =>
    readFileSync(fromRoot("node_modules", "@fontsource", pkg, "files", name));
  fonts ??= ["latin", "latin-ext"].flatMap((subset) => [
    {
      name: "Geist",
      data: file("geist", `geist-${subset}-400-normal.woff`),
      weight: 400 as const,
      style: "normal" as const,
    },
    {
      name: "Geist",
      data: file("geist", `geist-${subset}-500-normal.woff`),
      weight: 500 as const,
      style: "normal" as const,
    },
    {
      name: "Geist Mono",
      data: file("geist-mono", `geist-mono-${subset}-400-normal.woff`),
      weight: 400 as const,
      style: "normal" as const,
    },
  ]);
  return fonts;
}

/** A station's still as a JPEG data URI, sized for the card. Null until the still is rendered. */
const stills = new Map<string, Promise<string | null>>();
function still(station: string): Promise<string | null> {
  const src = `/media/thread/${station}.webp`;
  if (!stills.has(station)) {
    stills.set(
      station,
      publicFileExists(src)
        ? sharp(fromRoot("public", src))
            .resize({ height: STILL_H })
            .jpeg({ quality: 84 })
            .toBuffer()
            .then((jpeg) => `data:image/jpeg;base64,${jpeg.toString("base64")}`)
        : Promise.resolve(null)
    );
  }
  return stills.get(station)!;
}

const rgba = (hex: string, alpha: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

/** A point on a cubic Bézier. */
const bezier = (p: number[][], t: number) =>
  [0, 1].map(
    (k) =>
      (1 - t) ** 3 * p[0][k] +
      3 * (1 - t) ** 2 * t * p[1][k] +
      3 * (1 - t) * t ** 2 * p[2][k] +
      t ** 3 * p[3][k]
  );

/** The thread: a glowing line rising through the right of the card, clear of the text. Dots mark stations. */
function threadSvg(color: string, dots: { t: number; color: string }[]): string {
  const a = [
    [780, 700],
    [880, 600],
    [880, 470],
    [975, 405],
  ];
  const b = [
    [975, 405],
    [1080, 335],
    [1150, 300],
    [1250, 70],
  ];
  const d = `M${a[0]} C${a[1]} ${a[2]} ${a[3]} C${b[1]} ${b[2]} ${b[3]}`;
  const at = (t: number) => (t < 0.5 ? bezier(a, t * 2) : bezier(b, t * 2 - 1));
  const dot = (t: number, c: string, r: number) => {
    const [x, y] = at(t);
    return `<circle cx="${x}" cy="${y}" r="${r * 3}" fill="${c}" opacity="0.4" filter="url(#wide)"/><circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}">
<defs><filter id="wide" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>
<filter id="near" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter></defs>
<path d="${d}" fill="none" stroke="${color}" stroke-width="14" stroke-linecap="round" opacity="0.22" filter="url(#wide)"/>
<path d="${d}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" opacity="0.6" filter="url(#near)"/>
<path d="${d}" fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" opacity="0.9"/>
${dots.map((p) => dot(p.t, p.color, 5)).join("")}
</svg>`;
}

/** Big for a word, smaller for a sentence. */
const titleSize = (title: string) =>
  title.length <= 16 ? 104 : title.length <= 30 ? 80 : title.length <= 52 ? 64 : 54;

async function tree(card: OgCard): Promise<El> {
  const tint = card.tint ?? TEXT;
  const image = card.station ? await still(card.station) : null;
  const textWidth = image ? 580 : 780;

  const background: El[] = image
    ? [
        h(
          "img",
          {
            position: "absolute",
            top: (OG_HEIGHT - STILL_H) / 2,
            right: -210,
            maskImage: "radial-gradient(closest-side, black 55%, transparent 100%)",
          },
          undefined,
          { src: image, width: STILL_W, height: STILL_H }
        ),
        h("div", {
          position: "absolute",
          top: 0,
          left: 0,
          width: OG_WIDTH,
          height: OG_HEIGHT,
          backgroundImage: `linear-gradient(90deg, ${INK} 0%, ${INK} 44%, ${rgba(INK, 0.85)} 56%, ${rgba(INK, 0)} 72%)`,
        }),
      ]
    : [
        h("div", {
          position: "absolute",
          top: 0,
          left: 0,
          width: OG_WIDTH,
          height: OG_HEIGHT,
          backgroundImage: `radial-gradient(circle at 78% 46%, ${rgba(tint, card.tint ? 0.16 : 0.08)} 0%, ${rgba(tint, 0)} 52%)`,
        }),
        h("img", { position: "absolute", top: 0, left: 0 }, undefined, {
          src: `data:image/svg+xml;base64,${Buffer.from(
            threadSvg(
              tint,
              card.home ? STATION_TINTS.map((color, i) => ({ t: 0.3 + i * 0.16, color })) : []
            )
          ).toString("base64")}`,
          width: OG_WIDTH,
          height: OG_HEIGHT,
        }),
      ];

  const eyebrow = h("div", { display: "flex", alignItems: "center", gap: 16 }, [
    h("div", {
      width: 10,
      height: 10,
      borderRadius: 10,
      background: tint,
      boxShadow: `0 0 14px ${tint}`,
    }),
    h(
      "div",
      {
        fontFamily: "Geist Mono",
        fontSize: 21,
        letterSpacing: 2.6,
        textTransform: "uppercase",
        color: MUTED,
      },
      card.eyebrow
    ),
  ]);

  const middle = h("div", { display: "flex", flexDirection: "column", width: textWidth }, [
    h(
      "div",
      {
        fontSize: titleSize(card.title),
        fontWeight: 500,
        letterSpacing: "-0.045em",
        lineHeight: 1.02,
        color: TEXT,
      },
      card.title
    ),
    h("div", {
      width: 72,
      height: 3,
      marginTop: 30,
      borderRadius: 3,
      background: tint,
      boxShadow: `0 0 18px ${tint}`,
    }),
    ...(card.subtitle
      ? [
          h(
            "div",
            {
              display: "block",
              marginTop: 28,
              fontSize: 28,
              lineHeight: 1.38,
              letterSpacing: "-0.01em",
              color: TEXT_2,
              lineClamp: card.title.length > 30 ? 3 : 4,
            },
            card.subtitle
          ),
        ]
      : []),
  ]);

  // The name, then the address; the right of the card is the picture's.
  const address = `metz.uk${card.path.replace(/\/$/, "")}`;
  const footer = h("div", { display: "flex", alignItems: "baseline", gap: 22 }, [
    ...(card.home
      ? []
      : [
          h(
            "div",
            { fontSize: 28, fontWeight: 500, letterSpacing: "-0.02em", color: TEXT },
            "Constantin Metz"
          ),
        ]),
    h("div", { fontFamily: "Geist Mono", fontSize: 20, letterSpacing: 0.5, color: MUTED }, address),
  ]);

  return h(
    "div",
    {
      position: "relative",
      display: "flex",
      width: OG_WIDTH,
      height: OG_HEIGHT,
      background: INK,
      fontFamily: "Geist",
      color: TEXT,
    },
    [
      ...background,
      h(
        "div",
        {
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: `${PAD_Y}px ${PAD_X}px`,
        },
        [eyebrow, middle, footer]
      ),
    ]
  );
}

/** The card as a PNG. Warns (doesn't fail) when the fonts lack a character the card uses. */
export async function renderOgCard(card: OgCard): Promise<Uint8Array<ArrayBuffer>> {
  const svg = await satori((await tree(card)) as Parameters<typeof satori>[0], {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: loadFonts(),
    loadAdditionalAsset: async (_code, segment) => {
      console.warn(`[og] "${card.title}": no glyph for "${segment}" in Geist`);
      return [];
    },
  });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: OG_WIDTH } }).render().asPng();
  // Quantized to a palette (fully dithered, or the glows band): under half the size, which keeps
  // every card well below the ~300 KB some messengers allow for a link preview.
  return new Uint8Array(
    await sharp(png).png({ palette: true, quality: 100, effort: 8, dither: 1 }).toBuffer()
  );
}
