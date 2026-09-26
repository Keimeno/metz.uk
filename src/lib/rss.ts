// One RSS feed per language. Drafts stay out until they're published.

import rss from "@astrojs/rss";
import type { APIRoute } from "astro";

import { getPosts } from "./content";
import { postPath, route, type Locale } from "../i18n/routes";
import { useT } from "../i18n/ui";

export function feed(locale: Locale): APIRoute {
  return async (context) => {
    const t = useT(locale);
    const posts = (await getPosts()).map((p) => p[locale]).filter((entry) => !entry.data.draft);
    return rss({
      title: `Constantin Metz · ${t("writing.title")}`,
      description: t("writing.lede"),
      site: new URL(route("writing", locale), context.site).href,
      items: posts.map((entry) => ({
        title: entry.data.title,
        description: entry.data.description,
        pubDate: entry.data.published,
        link: postPath(entry.data.slug, locale),
      })),
      customData: `<language>${locale === "de" ? "de-DE" : "en-GB"}</language>`,
    });
  };
}
