// Every page of the site, in both languages: what the sitemap lists, what llms.txt links and which
// social cards get drawn. Built from the route map and the content collections, so a new project or
// post shows up in all three at once. The 404 is the one page left out.

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
import { getPosts, getProjects } from "./content";
import type { OgCard } from "./og";

export interface SitePage {
  locale: Locale;
  path: string;
  alternates: Alternates;
  /** Drafts are readable but kept out of search (noindex, no sitemap, no llms.txt). */
  indexable: boolean;
  /** When the content last changed, where that's known (posts). */
  lastmod?: Date;
  card: OgCard;
}

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

/** Every page, English then German for each. */
export async function getSitePages(): Promise<SitePage[]> {
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
      pages.push({ locale, path, alternates, indexable: true, card });
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
        lastmod: data.updated ?? data.published,
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
