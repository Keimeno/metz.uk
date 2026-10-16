// Every indexable page, each with its alternates in both languages (and x-default → English), so
// search engines get the language pairs from the sitemap as well as from the pages. Drafts and the
// 404 are left out. <lastmod> is when the page's words last changed (src/lib/pages.ts), and the
// about pages list the portrait, for image search.
import type { APIRoute } from "astro";

import { LOCALES } from "../i18n/routes";
import { isoDay } from "../lib/dates";
import { getSitePages } from "../lib/pages";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

export const GET: APIRoute = async ({ site }) => {
  const abs = (path: string) => esc(new URL(path, site).href);
  const pages = await getSitePages();
  const indexable = new Set(pages.filter((p) => p.indexable).map((p) => p.path));

  const urls = pages
    .filter((p) => p.indexable)
    .map((page) => {
      const lines = [`    <loc>${abs(page.path)}</loc>`];
      if (page.dates) lines.push(`    <lastmod>${isoDay(page.dates.modified)}</lastmod>`);
      for (const l of LOCALES.filter((l) => indexable.has(page.alternates[l])))
        lines.push(`    <xhtml:link rel="alternate" hreflang="${l}" href="${abs(page.alternates[l])}"/>`);
      if (indexable.has(page.alternates.en)) {
        lines.push(
          `    <xhtml:link rel="alternate" hreflang="x-default" href="${abs(page.alternates.en)}"/>`
        );
      }
      for (const image of page.images ?? [])
        lines.push(`    <image:image>\n      <image:loc>${abs(image)}</image:loc>\n    </image:image>`);
      return `  <url>\n${lines.join("\n")}\n  </url>`;
    });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join("\n")}
</urlset>
`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
