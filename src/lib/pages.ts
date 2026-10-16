// Every page of the site, in both languages: what the sitemap lists, what llms.txt links and which
// social cards get drawn. Built from the route map and the content collections, so a new project or
// post shows up in all three at once. The 404 is the one page left out.
//
// Each page also names the files its words come from, and gets its dates from their git history
// (src/lib/dates.ts). Templates, styles and interface strings are left out on purpose: a new
// header doesn't make every page news.

import { HOME } from "../i18n/home";
import {
  LOCALES,
  ROUTES,
  alternatesOf,
  postPath,
  projectAlternates,
  type Alternates,
  type Locale,
  type RouteKey,
} from "../i18n/routes";
import { useT } from "../i18n/ui";
import { PERSON } from "../data/person";
import { getPosts, getProjects } from "./content";
import { datesOf, type PageDates } from "./dates";
import { publicFileExists } from "./files";
import type { OgCard } from "./og";

export interface SitePage {
  locale: Locale;
  path: string;
  alternates: Alternates;
  /** Drafts are readable but kept out of search (noindex, no sitemap, no llms.txt). */
  indexable: boolean;
  /** First written and last changed: a post's own dates, else from git. Unknown without git. */
  dates?: PageDates;
  /** Pictures shown on the page, for the image sitemap (paths). */
  images?: string[];
  card: OgCard;
}

/** The files each fixed page's words come from (folders end in "/"). */
const STATIC_SOURCES: Record<RouteKey, string[]> = {
  home: [
    "src/components/home/",
    "src/i18n/home.ts",
    "src/generated/",
    "data/sources/paperscores/",
  ],
  work: ["src/components/pages/WorkIndex.astro", "src/data/projects.ts", "src/content/projects/"],
  about: [
    "src/components/pages/AboutPage.astro",
    "src/data/person.ts",
    "public/constantin-metz.jpg",
  ],
  history: ["src/components/pages/HistoryPage.astro", "src/data/history.ts"],
  writing: ["src/components/pages/WritingIndex.astro", "src/content/posts/"],
  privacy: ["src/components/pages/LegalPage.astro", "src/data/legal.ts"],
  imprint: ["src/components/pages/LegalPage.astro", "src/data/legal.ts"],
};

type CardCopy = Pick<OgCard, "eyebrow" | "title" | "subtitle">;

/** What the cards of the fixed pages say. Short on purpose: a card is read at a glance. */
const STATIC_CARDS: Record<Exclude<RouteKey, "home">, Record<Locale, CardCopy>> = {
  work: {
    en: {
      eyebrow: "Work",
      title: "Things I've built",
      subtitle: "Designed and built, mostly alone, from the engine to the launch.",
    },
    de: {
      eyebrow: "Projekte",
      title: "Was ich gebaut habe",
      subtitle: "Entworfen und gebaut, meist allein, von der Engine bis zum Launch.",
    },
  },
  about: {
    en: {
      eyebrow: "About",
      title: "Constantin Metz",
      subtitle: "Self-taught software engineer in Munich. Builds products end to end.",
    },
    de: {
      eyebrow: "Über mich",
      title: "Constantin Metz",
      subtitle:
        "Autodidaktischer Softwareentwickler in München. Baut Produkte von Anfang bis Ende.",
    },
  },
  history: {
    en: {
      eyebrow: "History",
      title: "From Minecraft mods to the App Store",
      subtitle: "Self-taught, shipping software since school.",
    },
    de: {
      eyebrow: "Werdegang",
      title: "Von Minecraft-Mods in den App Store",
      subtitle: "Autodidakt, mit Software in Produktion seit der Schulzeit.",
    },
  },
  writing: {
    en: {
      eyebrow: "Writing",
      title: "Notes on things I've built",
      subtitle: "How they work, and what I got wrong.",
    },
    de: {
      eyebrow: "Texte",
      title: "Notizen zu Dingen, die ich gebaut habe",
      subtitle: "Wie sie funktionieren, und was ich falsch gemacht habe.",
    },
  },
  privacy: {
    en: {
      eyebrow: "Privacy",
      title: "No cookies, no tracking",
      subtitle: "No third parties either. Only the host's server logs.",
    },
    de: {
      eyebrow: "Datenschutz",
      title: "Keine Cookies, kein Tracking",
      subtitle: "Auch keine Drittanbieter. Nur die Server-Logs des Hosters.",
    },
  },
  imprint: {
    en: {
      eyebrow: "Legal",
      title: "Imprint",
      subtitle: "Who runs this site, and how to get in touch.",
    },
    de: {
      eyebrow: "Rechtliches",
      title: "Impressum",
      subtitle: "Anbieter, Anschrift und Kontakt.",
    },
  },
};

let cached: Promise<SitePage[]> | undefined;

/** Every page, English then German for each. Built once per build (afresh each time in dev). */
export function getSitePages(): Promise<SitePage[]> {
  if (import.meta.env.DEV) return buildSitePages();
  return (cached ??= buildSitePages());
}

/** The page at `path`, if it's one of the site's pages (the 404 isn't). */
export async function getSitePage(path: string): Promise<SitePage | undefined> {
  return (await getSitePages()).find((p) => p.path === path);
}

async function buildSitePages(): Promise<SitePage[]> {
  const pages: SitePage[] = [];

  for (const key of Object.keys(ROUTES) as RouteKey[]) {
    const alternates = alternatesOf(key);
    for (const locale of LOCALES) {
      const path = alternates[locale];
      const card: OgCard =
        key === "home"
          ? {
              path,
              eyebrow: HOME[locale].intro.kicker,
              title: "Constantin Metz",
              subtitle: HOME[locale].intro.lede,
              home: true,
            }
          : { path, ...STATIC_CARDS[key][locale] };
      const images =
        key === "about" && publicFileExists(PERSON.portrait.src) ? [PERSON.portrait.src] : undefined;
      pages.push({
        locale,
        path,
        alternates,
        indexable: true,
        dates: datesOf(STATIC_SOURCES[key]),
        images,
        card,
      });
    }
  }

  for (const project of await getProjects()) {
    const { def } = project;
    const alternates = projectAlternates(def.slug);
    for (const locale of LOCALES) {
      const { data } = project[locale];
      pages.push({
        locale,
        path: alternates[locale],
        alternates,
        indexable: true,
        dates: datesOf([
          "src/components/pages/CaseStudy.astro",
          "src/data/projects.ts",
          `src/content/projects/${def.slug}/${locale}.mdx`,
        ]),
        card: {
          path: alternates[locale],
          eyebrow: useT(locale)("work.case"),
          title: data.title,
          subtitle: data.headline,
          tint: def.tint,
          station: def.station,
        },
      });
    }
  }

  for (const post of await getPosts()) {
    const alternates = {
      en: postPath(post.en.data.slug, "en"),
      de: postPath(post.de.data.slug, "de"),
    };
    for (const locale of LOCALES) {
      const { data } = post[locale];
      pages.push({
        locale,
        path: alternates[locale],
        alternates,
        indexable: !data.draft,
        dates: { created: data.published, modified: data.updated ?? data.published },
        card: {
          path: alternates[locale],
          eyebrow: useT(locale)("writing.title"),
          title: data.title,
          subtitle: data.description,
        },
      });
    }
  }

  return pages;
}
