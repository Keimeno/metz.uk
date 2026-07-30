// Every page exists in English (at `/`) and German (at `/de/`, with German slugs). This map is the
// one place that knows both addresses of a page: canonical and hreflang links, the language switch,
// the navigation and (later) the sitemap all read from it.

export const LOCALES = ["en", "de"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const ROUTES = {
  home: { en: "/", de: "/de/" },
  work: { en: "/work/", de: "/de/projekte/" },
  about: { en: "/about/", de: "/de/ueber-mich/" },
  history: { en: "/history/", de: "/de/werdegang/" },
  writing: { en: "/writing/", de: "/de/texte/" },
  privacy: { en: "/privacy/", de: "/de/datenschutz/" },
  imprint: { en: "/imprint/", de: "/de/impressum/" },
} as const satisfies Record<string, Record<Locale, string>>;

export type RouteKey = keyof typeof ROUTES;

/** The same page in every language, as root-relative paths. */
export type Alternates = Record<Locale, string>;

export const route = (key: RouteKey, locale: Locale): string => ROUTES[key][locale];
export const alternatesOf = (key: RouteKey): Alternates => ({ ...ROUTES[key] });

/** A case study: the slug is the project's name, the same in both languages. */
export const projectPath = (slug: string, locale: Locale) => `${ROUTES.work[locale]}${slug}/`;
export const projectAlternates = (slug: string): Alternates => ({
  en: projectPath(slug, "en"),
  de: projectPath(slug, "de"),
});

/** A post: each language has its own slug. */
export const postPath = (slug: string, locale: Locale) => `${ROUTES.writing[locale]}${slug}/`;
export const rssPath = (locale: Locale) => `${ROUTES.writing[locale]}rss.xml`;

export const otherLocale = (locale: Locale): Locale => (locale === "en" ? "de" : "en");

/** For `og:locale`. */
export const OG_LOCALE: Record<Locale, string> = { en: "en_GB", de: "de_DE" };

/** For `Intl` formatting. */
export const INTL_LOCALE: Record<Locale, string> = { en: "en-GB", de: "de-DE" };
