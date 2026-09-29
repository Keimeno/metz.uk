// Every indexable page, each with its alternates in both languages (and x-default → English), so
// search engines get the language pairs from the sitemap as well as from the pages. Drafts and the
// 404 are left out.
import type { APIRoute } from "astro";

import { LOCALES } from "../i18n/routes";
import { getSitePages } from "../lib/pages";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

export const GET: APIRoute = async ({ site }) => {
  const abs = (path: string) => esc(new URL(path, site).href);
  const pages = await getSitePages();
  const indexable = new Set(pages.filter((p) => p.indexable).map((p) => p.path));

  const urls = pages
    .filter((p) => p.indexable)
    .map((page) => {
      const links = LOCALES.filter((l) => indexable.has(page.alternates[l])).map(
        (l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${abs(page.alternates[l])}"/>`
      );
      if (indexable.has(page.alternates.en)) {
        links.push(
          `    <xhtml:link rel="alternate" hreflang="x-default" href="${abs(page.alternates.en)}"/>`
        );
      }
      const lastmod = page.lastmod
        ? `\n    <lastmod>${page.lastmod.toISOString().slice(0, 10)}</lastmod>`
        : "";
      return `  <url>\n    <loc>${abs(page.path)}</loc>${lastmod}\n${links.join("\n")}\n  </url>`;
    });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>
`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
