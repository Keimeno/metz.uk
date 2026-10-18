// The long-form history, oldest first. This is the only place on the site that names employers.
// Every entry carries both languages (`Record<Locale, …>`), so a missing translation is a type error.

import type { Locale } from "../i18n/routes";

type Text = Record<Locale, string>;

export interface HistoryLink {
  href: string;
  label: Text;
}

export interface HistoryEntry {
  id: string;
  when: Text;
  title: Text;
  /** Who it was with, and where. */
  org?: { name: string; place?: Text };
  body?: Text;
  points?: Record<Locale, string[]>;
  links?: HistoryLink[];
}

export const HISTORY: HistoryEntry[] = [
  {
    id: "early",
    when: { en: "Childhood", de: "Kindheit" },
    title: { en: "Teaching myself to code", de: "Programmieren, selbst beigebracht" },
    body: {
      en: "HTML, CSS and JavaScript first, building pages for the fun of it. Then Java, by writing Minecraft mods: the first real programs, and the first time code had to work for someone else.",
      de: "Erst HTML, CSS und JavaScript, Webseiten aus Spaß an der Sache. Dann Java, über Minecraft-Mods: die ersten richtigen Programme, und das erste Mal, dass Code für jemand anderen funktionieren musste.",
    },
  },
  {
    id: "internships",
    when: { en: "2018–2019", de: "2018–2019" },
    title: { en: "Internships during school", de: "Praktika während der Schulzeit" },
    org: { name: "oliv newlab · Evolit Consulting · Hoffmann Eitle" },
    points: {
      en: [
        "oliv newlab: web development with Django.",
        "Evolit Consulting in Vienna: a fleet-management tool in TypeScript and Angular.",
        "Hoffmann Eitle, a patent law firm.",
      ],
      de: [
        "oliv newlab: Webentwicklung mit Django.",
        "Evolit Consulting in Wien: ein Flottenmanagement-Tool in TypeScript und Angular.",
        "Hoffmann Eitle, eine Patentanwaltskanzlei.",
      ],
    },
  },
  {
    id: "luminunet",
    when: { en: "Dec 2019 – Apr 2020", de: "Dez. 2019 – Apr. 2020" },
    title: {
      en: "Web services for a Minecraft network",
      de: "Webdienste für ein Minecraft-Netzwerk",
    },
    org: { name: "LuminuNET" },
    body: {
      en: "Still at school, I built the web side of the LuminuNET Minecraft network: one sign-in for the forum, the website and the game servers, a Vue component library for its sites, and key redemption.",
      de: "Noch in der Schule habe ich die Webseite des Minecraft-Netzwerks LuminuNET gebaut: einen Login für Forum, Website und Spielserver, eine Vue-Komponentenbibliothek für die Seiten und das Einlösen von Keys.",
    },
    points: {
      en: [
        "A hand-rolled OpenID Connect provider (implicit flow) on the forum's legacy XenForo accounts, December 2019 to January 2020: consent screens, Redis rate limits, an RSA-4096 key pair per client, RS256 tokens.",
      ],
      de: [
        "Ein selbst geschriebener OpenID-Connect-Provider (Implicit Flow) auf den alten XenForo-Konten des Forums, Dezember 2019 bis Januar 2020: Zustimmungsdialoge, Rate Limits mit Redis, ein RSA-4096-Schlüsselpaar pro Client, RS256-Tokens.",
      ],
    },
    links: [
      {
        href: "https://github.com/Keimeno/oidc-server",
        label: { en: "oidc-server on GitHub", de: "oidc-server auf GitHub" },
      },
      {
        href: "https://github.com/LuminuNET/key-redeem-feedback",
        label: { en: "key redemption on GitHub", de: "Key-Einlösung auf GitHub" },
      },
    ],
  },
  {
    id: "adabay",
    when: { en: "Feb 2020 – Oct 2021", de: "Feb. 2020 – Okt. 2021" },
    title: {
      en: "Intern, then developer, then senior developer",
      de: "Praktikant, dann Entwickler, dann Senior Developer",
    },
    org: { name: "adabay", place: { en: "Munich", de: "München" } },
    points: {
      en: [
        "Web development internships: the mobile site for Mammut, and an internal i18n tool built from scratch.",
        "Part-time developer at 18, alongside school: a monorepo of React widgets with Storybook, sites on the Twill CMS, contributions to open source.",
        "Senior Developer from April 2021: client architectures documented with arc42 and C4, server-side rendering with caching, introduced Storybook and Tailwind, upgraded TYPO3.",
      ],
      de: [
        "Praktika in der Webentwicklung: die mobile Website für Mammut und ein internes i18n-Tool, von Grund auf gebaut.",
        "Mit 18 Entwickler in Teilzeit, neben der Schule: ein Monorepo aus React-Widgets mit Storybook, Websites auf dem Twill CMS, Beiträge zu Open Source.",
        "Ab April 2021 Senior Developer: Client-Architekturen, dokumentiert mit arc42 und C4, Server-Side Rendering mit Caching, Storybook und Tailwind eingeführt, TYPO3 aktualisiert.",
      ],
    },
  },
  {
    id: "sequelize",
    when: { en: "2020–2021", de: "2020–2021" },
    title: { en: "Sequelize maintainers team", de: "Im Maintainer-Team von Sequelize" },
    org: { name: "Sequelize" },
    body: {
      en: "On the maintainers team of Sequelize, the SQL ORM for Node.js, while it moved to TypeScript: 13 pull requests (10 merged) and, in 2021, reviews of 28 pull requests by other contributors. The largest, #13710, moved the library's errors to TypeScript: +731 −616 across 41 files.",
      de: "Im Maintainer-Team von Sequelize, dem SQL-ORM für Node.js, während es auf TypeScript umzog: 13 Pull Requests (10 gemergt) und 2021 Reviews von 28 Pull Requests anderer. Der größte, #13710, brachte die Fehlerklassen der Bibliothek nach TypeScript: +731 −616 in 41 Dateien.",
    },
    links: [
      {
        href: "https://github.com/sequelize/sequelize/pull/13710",
        label: { en: "sequelize#13710", de: "sequelize#13710" },
      },
    ],
  },
  {
    id: "dealercenter",
    when: { en: "Nov 2021 – Sep 2023", de: "Nov. 2021 – Sep. 2023" },
    title: { en: "Senior Software Engineer", de: "Senior Software Engineer" },
    org: { name: "DealerCenter Digital", place: { en: "Landshut", de: "Landshut" } },
    points: {
      en: [
        "Frontend, backend and DevOps, on a modular architecture documented in C4.",
        "An Nx monorepo for the internal tools.",
        "Led an offline-capable PWA that keeps in-store kiosks and tablets in sync.",
        "Merged several inventory systems into one cached service.",
        "Faster, safer CI/CD.",
      ],
      de: [
        "Frontend, Backend und DevOps, auf einer modularen Architektur, dokumentiert in C4.",
        "Ein Nx-Monorepo für die internen Tools.",
        "Leitung einer offlinefähigen PWA, die Kiosks und Tablets im Laden synchron hält.",
        "Mehrere Bestandssysteme zu einem Service mit Cache zusammengeführt.",
        "Schnellere, sicherere CI/CD.",
      ],
    },
  },
  {
    id: "appfire",
    when: { en: "Oct 2023 – Sep 2026", de: "Okt. 2023 – Sep. 2026" },
    title: {
      en: "Software Engineer, Jira marketplace apps",
      de: "Software Engineer, Marketplace-Apps für Jira",
    },
    org: { name: "Appfire", place: { en: "remote", de: "remote" } },
    points: {
      en: [
        "A large React app, Node.js services, and C#/.NET.",
        "Introduced an Nx monorepo.",
        "Aligned engineering practices across teams.",
        "Part of a winning hackathon project.",
      ],
      de: [
        "Eine große React-App, Node.js-Services und C#/.NET.",
        "Ein Nx-Monorepo eingeführt.",
        "Engineering-Praktiken über Teams hinweg vereinheitlicht.",
        "Teil eines Gewinnerprojekts beim Hackathon.",
      ],
    },
  },
  {
    id: "zenarios",
    when: { en: "Mar 2025 – Oct 2026", de: "März 2025 – Okt. 2026" },
    title: { en: "Zenarios, on my own", de: "Zenarios, allein" },
    org: { name: "Zenarios" },
    body: {
      en: "Alongside work, a financial planner for iPhone and Mac, designed and built alone: the simulation engine, the app, the design system, the website and the launch film. On the App Store since 2026.",
      de: "Neben der Arbeit ein Finanzplaner für iPhone und Mac, allein entworfen und gebaut: die Simulations-Engine, die App, das Design-System, die Website und der Launch-Film. Seit 2026 im App Store.",
    },
    links: [
      {
        href: "https://apps.apple.com/app/zenarios/id6819013653",
        label: { en: "Zenarios on the App Store", de: "Zenarios im App Store" },
      },
    ],
  },
  {
    id: "mercura",
    when: { en: "Since Oct 2026", de: "Seit Okt. 2026" },
    title: { en: "AI for industrial quoting", de: "KI für Angebote in der Industrie" },
    org: { name: "Mercura (YC W25)", place: { en: "Munich", de: "München" } },
    body: {
      en: "Mercura automates quotes and orders for industrial distributors and manufacturers with AI.",
      de: "Mercura automatisiert mit KI Angebote und Aufträge für Großhändler und Hersteller in der Industrie.",
    },
  },
];

/**
 * Employers, for the history pages' structured data (`worksFor`, `alumniOf`). Internships, open
 * source and my own projects are left out. Like everything in this file, history pages only.
 */
export const EMPLOYERS: {
  current: { name: string; url?: string }[];
  past: { name: string; url?: string }[];
} = {
  current: [{ name: "Mercura", url: "https://mercura.ai" }],
  past: [
    { name: "adabay" },
    { name: "DealerCenter Digital" },
    { name: "Appfire", url: "https://appfire.com" },
  ],
};

/** The site I had before this one, kept for the record. */
export const OLD_SITE = {
  name: "keimeno.party",
  year: 2020,
  wayback: "https://web.archive.org/web/20220208141524/https://keimeno.party/",
  /** Made by scripts/gen/old-site.mjs: 2000 × 1195, metadata stripped. */
  image: "/media/keimeno-party-2020.webp",
};
