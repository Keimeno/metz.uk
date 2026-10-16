// Structured data (schema.org JSON-LD) for search engines and AI answer engines. Every page carries
// one @graph: the Person and the WebSite, the page itself, its breadcrumbs, and what it's about (a
// project, a post). Nodes have stable @ids, so pages point at them instead of repeating them.
//
// Employers are named only on the history pages, here as everywhere: `worksFor` and `alumniOf` are
// added to the Person there and nowhere else.

import { EMPLOYERS } from "../data/history";
import { PERSON } from "../data/person";
import type { ProjectDef } from "../data/projects";
import { route, postPath, projectPath, otherLocale, type Locale } from "../i18n/routes";
import { useT } from "../i18n/ui";
import { SITE_URL } from "../site.mjs";
import type { Post, Project } from "./content";
import { isoDay, isoSeconds, type PageDates } from "./dates";
import { publicFileExists } from "./files";
import { OG_HEIGHT, OG_WIDTH, ogImagePath } from "./og";

type Node = Record<string, unknown>;

const abs = (path: string) => new URL(path, SITE_URL).href;
const ref = (id: string) => ({ "@id": id });

export const IDS = {
  person: abs("/#person"),
  website: abs("/#website"),
};

/** What a page adds to the graph. Every field is optional; the page node is a WebPage by default. */
export interface PageLd {
  type?: "WebPage" | "ProfilePage" | "CollectionPage";
  /** The trail below Home to this page, as [name, path]. Leave out on the home page. */
  crumbs?: [string, string][];
  /** The @id of what the page is about. */
  about?: string;
  /** The page's main entity: an @id, or a node (a list of projects). */
  mainEntity?: string | Node;
  /** More nodes: the project, the post. */
  nodes?: Node[];
  /** The page is his own writing about his work (case studies): the Person is its author. */
  author?: boolean;
  /** The history pages only: the Person gets `worksFor` and `alumniOf`. */
  employers?: boolean;
}

/** His profiles: the ones on the about page, and the others once they link back to metz.uk. */
export const personSameAs = (): string[] => [
  ...PERSON.profiles.map((p) => p.href),
  ...PERSON.elsewhere.filter((p) => p.linksBack).map((p) => p.href),
];

function person(locale: Locale, employers: boolean): Node {
  const images = PERSON.portrait.crops.filter((c) => publicFileExists(c.src));
  const org = (o: { name: string; url?: string }) => ({
    "@type": "Organization",
    name: o.name,
    ...(o.url ? { url: o.url } : {}),
  });
  return {
    "@type": "Person",
    "@id": IDS.person,
    name: PERSON.name,
    givenName: PERSON.givenName,
    familyName: PERSON.familyName,
    alternateName: PERSON.alternateName,
    url: abs("/"),
    jobTitle: PERSON.jobTitle[locale],
    description: PERSON.summary[locale],
    homeLocation: {
      "@type": "Place",
      name: PERSON.city[locale],
      address: {
        "@type": "PostalAddress",
        addressLocality: PERSON.city[locale],
        addressCountry: PERSON.countryCode,
      },
    },
    knowsAbout: PERSON.knowsAbout,
    knowsLanguage: PERSON.knowsLanguage,
    ...(images.length
      ? {
          image: images.map((c) => ({
            "@type": "ImageObject",
            url: abs(c.src),
            width: c.width,
            height: c.height,
            caption: PERSON.name,
          })),
        }
      : {}),
    sameAs: personSameAs(),
    ...(employers
      ? { worksFor: EMPLOYERS.current.map(org), alumniOf: EMPLOYERS.past.map(org) }
      : {}),
  };
}

function website(locale: Locale): Node {
  return {
    "@type": "WebSite",
    "@id": IDS.website,
    url: abs("/"),
    name: PERSON.name,
    alternateName: "metz.uk",
    description: PERSON.summary[locale],
    inLanguage: ["en", "de"],
    author: ref(IDS.person),
    publisher: ref(IDS.person),
    about: ref(IDS.person),
  };
}

function breadcrumbs(locale: Locale, crumbs: [string, string][], id: string): Node {
  const trail: [string, string][] = [[useT(locale)("nav.home"), route("home", locale)], ...crumbs];
  return {
    "@type": "BreadcrumbList",
    "@id": id,
    itemListElement: trail.map(([name, path], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: abs(path),
    })),
  };
}

/** A date from git to the second; a date set by hand (midnight, UTC) as just the day. */
const isoDate = (d: Date) =>
  d.getTime() % 86_400_000 === 0 ? isoDay(d) : isoSeconds(d);

/** The whole graph for one page. `path` is null only for the 404, which gets the Person and the WebSite. */
export function pageGraph(opts: {
  locale: Locale;
  path: string | null;
  title: string;
  description: string;
  ld?: PageLd;
  /** When the page was first written and last changed (src/lib/pages.ts), if known. */
  dates?: PageDates;
}): Node {
  const { locale, path, title, description, ld = {}, dates } = opts;
  const graph: Node[] = [person(locale, ld.employers ?? false), website(locale)];
  if (path) {
    const url = abs(path);
    const crumbId = `${url}#breadcrumb`;
    graph.push({
      "@type": ld.type ?? "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: title,
      description,
      inLanguage: locale,
      isPartOf: ref(IDS.website),
      ...(dates
        ? { dateCreated: isoDate(dates.created), dateModified: isoDate(dates.modified) }
        : {}),
      ...(ld.author ? { author: ref(IDS.person) } : {}),
      ...(ld.about ? { about: ref(ld.about) } : {}),
      ...(ld.mainEntity
        ? { mainEntity: typeof ld.mainEntity === "string" ? ref(ld.mainEntity) : ld.mainEntity }
        : {}),
      ...(ld.crumbs?.length ? { breadcrumb: ref(crumbId) } : {}),
      primaryImageOfPage: ogImage(path),
    });
    if (ld.crumbs?.length) graph.push(breadcrumbs(locale, ld.crumbs, crumbId));
  }
  graph.push(...(ld.nodes ?? []));
  return { "@context": "https://schema.org", "@graph": graph };
}

/** For `<script type="application/ld+json">`: no "</script>" can end it early. */
export const serializeLd = (graph: Node): string => JSON.stringify(graph).replace(/</g, "\\u003c");

function ogImage(path: string): Node {
  return {
    "@type": "ImageObject",
    url: abs(ogImagePath(path)),
    width: OG_WIDTH,
    height: OG_HEIGHT,
  };
}

/** A short list of pages, for the index pages' `mainEntity`. */
export function itemList(items: { name: string; path: string }[]): Node {
  return {
    "@type": "ItemList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: abs(item.path),
    })),
  };
}

/** The @id of a project's node: its own site's, if it has one, else the English case study's. */
export const projectId = (def: ProjectDef): string =>
  def.schema.id ?? `${abs(projectPath(def.slug, "en"))}#project`;

/** What a case study is about: an app, a library, or a body of work with its repositories. */
export function projectNode(project: Project, locale: Locale): Node {
  const { def } = project;
  const { data } = project[locale];
  const { schema } = def;
  const link = (kind: string) => def.links.find((l) => l.kind === kind)?.href;
  const repos = def.links.filter((l) => l.kind === "repo");
  const url = link("site") ?? link("live") ?? link("docs") ?? abs(projectPath(def.slug, locale));
  const still = def.station ? `/media/thread/${def.station}.webp` : null;
  const image = def.media?.[0]?.src ?? (still && publicFileExists(still) ? still : null);
  const isApp = schema.type === "MobileApplication" || schema.type === "WebApplication";
  // Only pages about the same thing (the App Store listing, the product's site); repositories are parts.
  const sameAs = def.links
    .filter((l) => ["appStore", "site", "live", "docs"].includes(l.kind) && l.href !== url)
    .map((l) => l.href);

  return {
    "@type": schema.type,
    "@id": projectId(def),
    name: data.title,
    description: data.headline,
    url,
    author: ref(IDS.person),
    dateCreated: def.years.split("–")[0],
    keywords: data.stack.join(", "),
    ...(image ? { image: abs(image) } : {}),
    ...(isApp && schema.category ? { applicationCategory: schema.category } : {}),
    ...(isApp ? { operatingSystem: schema.operatingSystem ?? "Any (web browser)" } : {}),
    ...(link("appStore") ? { installUrl: link("appStore") } : {}),
    ...(schema.offers
      ? {
          offers: {
            "@type": "Offer",
            price: schema.offers.price,
            priceCurrency: schema.offers.currency,
          },
        }
      : {}),
    ...(schema.type === "SoftwareSourceCode"
      ? {
          ...(repos[0] ? { codeRepository: repos[0].href } : {}),
          ...(schema.language ? { programmingLanguage: schema.language } : {}),
          ...(schema.runtime ? { runtimePlatform: schema.runtime } : {}),
        }
      : {}),
    ...(schema.type === "CreativeWork" && repos.length
      ? {
          hasPart: repos.map((r) => ({
            "@type": "SoftwareSourceCode",
            name: r.label ?? r.href.replace(/^https:\/\/github\.com\//, ""),
            codeRepository: r.href,
            author: ref(IDS.person),
          })),
        }
      : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

/** The post in this language, and a short node for its translation, linked both ways. English is the original. */
export function postNodes(post: Post, locale: Locale): Node[] {
  const other = otherLocale(locale);
  const urlOf = (l: Locale) => abs(postPath(post[l].data.slug, l));
  const articleId = (l: Locale) => `${urlOf(l)}#article`;
  const link = (l: Locale) =>
    l === "en"
      ? { workTranslation: ref(articleId("de")) }
      : { translationOfWork: ref(articleId("en")) };
  const { data } = post[locale];
  const day = (d: Date) => d.toISOString().slice(0, 10);

  return [
    {
      "@type": "BlogPosting",
      "@id": articleId(locale),
      url: urlOf(locale),
      headline: data.title,
      description: data.description,
      inLanguage: locale,
      datePublished: day(data.published),
      dateModified: day(data.updated ?? data.published),
      author: ref(IDS.person),
      publisher: ref(IDS.person),
      image: abs(ogImagePath(postPath(data.slug, locale))),
      mainEntityOfPage: ref(`${urlOf(locale)}#webpage`),
      isPartOf: ref(IDS.website),
      ...link(locale),
    },
    {
      "@type": "BlogPosting",
      "@id": articleId(other),
      url: urlOf(other),
      headline: post[other].data.title,
      inLanguage: other,
      author: ref(IDS.person),
      ...link(other),
    },
  ];
}
