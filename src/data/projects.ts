// The projects, in the order the site shows them. The words live in the content collection
// (`src/content/projects/<slug>/{en,de}.mdx`); this registry holds what doesn't change between
// languages: years, links, the station on the thread and its colour.

import type { StationId } from "../thread/beats";

export type LinkKind = "appStore" | "site" | "live" | "repo" | "docs" | "pr";

export interface ProjectLink {
  kind: LinkKind;
  href: string;
  /** Shown instead of the kind's label, e.g. a domain. */
  label?: string;
}

export interface ProjectMedia {
  src: string;
  width: number;
  height: number;
  /** "phone": a portrait app screenshot; "still": a wide render of the thread's figure. */
  kind: "phone" | "still";
}

/** What a project is, for its structured-data node (src/lib/seo.ts). */
export interface ProjectSchema {
  type: "MobileApplication" | "WebApplication" | "SoftwareSourceCode" | "CreativeWork";
  /** schema.org `applicationCategory`, for apps. */
  category?: string;
  operatingSystem?: string;
  /** The node's @id when another site already defines it, so both describe the same thing. */
  id?: string;
  /** For source code. */
  language?: string;
  runtime?: string;
}

export interface ProjectDef {
  slug: string;
  years: string;
  /** The project's station on the home page's thread, if it has one. */
  station?: Extract<StationId, "zenarios" | "signals" | "paperscores" | "origins">;
  /** The station's colour; the case study's accent. */
  tint: string;
  links: ProjectLink[];
  /** Header picture(s), first one leading. */
  media?: ProjectMedia[];
  schema: ProjectSchema;
}

export const PROJECTS = [
  {
    slug: "zenarios",
    years: "2025–2026",
    station: "zenarios",
    tint: "#34d07f",
    links: [
      { kind: "appStore", href: "https://apps.apple.com/app/zenarios/id6819013653" },
      { kind: "site", href: "https://zenarios.com", label: "zenarios.com" },
    ],
    media: [{ src: "/media/zenarios-overview.jpg", width: 480, height: 1020, kind: "phone" }],
    // Same node as zenarios.com's own structured data (zenarios-web/src/lib/seo.ts).
    schema: {
      type: "MobileApplication",
      id: "https://zenarios.com/#app",
      category: "FinanceApplication",
      operatingSystem: "iOS 16.4 or later",
    },
  },
  {
    slug: "signals",
    years: "2026",
    station: "signals",
    tint: "#ffbd52",
    links: [
      {
        kind: "repo",
        href: "https://github.com/Keimeno/word-growth-rate-analyzer/tree/wgra-v2",
        label: "WGRA v2",
      },
      { kind: "repo", href: "https://github.com/Keimeno/livetranslate", label: "LiveTranslate" },
    ],
    schema: { type: "CreativeWork" },
  },
  {
    slug: "paperscores",
    years: "2025–2026",
    station: "paperscores",
    tint: "#73d9fa",
    links: [],
    schema: { type: "WebApplication", category: "ReferenceApplication" },
  },
  {
    slug: "origins",
    years: "2019–2021",
    station: "origins",
    tint: "#b9a9ff",
    links: [
      { kind: "repo", href: "https://github.com/Keimeno/oidc-server", label: "oidc-server" },
      {
        kind: "pr",
        href: "https://github.com/sequelize/sequelize/pull/13710",
        label: "sequelize#13710",
      },
      {
        kind: "repo",
        href: "https://github.com/LuminuNET/key-redeem-feedback",
        label: "key-redeem-feedback",
      },
    ],
    schema: { type: "CreativeWork" },
  },
  {
    slug: "lexicon-bluff",
    years: "2026",
    tint: "#ff8f70",
    links: [{ kind: "live", href: "https://lexicon.pergata.com/", label: "lexicon.pergata.com" }],
    schema: { type: "WebApplication", category: "GameApplication" },
  },
  {
    slug: "carcost",
    years: "2026",
    tint: "#9fd3c7",
    links: [],
    schema: { type: "WebApplication", category: "FinanceApplication" },
  },
  {
    slug: "travel-cost-calculator",
    years: "2026",
    tint: "#e7c97a",
    links: [],
    schema: { type: "WebApplication", category: "TravelApplication" },
  },
  {
    slug: "segno",
    years: "2020",
    tint: "#8fb4ff",
    links: [
      { kind: "docs", href: "https://segno.js.org", label: "segno.js.org" },
      { kind: "repo", href: "https://github.com/Keimeno/segno" },
    ],
    schema: { type: "SoftwareSourceCode", language: "TypeScript", runtime: "Deno" },
  },
] as const satisfies readonly ProjectDef[];

export type ProjectSlug = (typeof PROJECTS)[number]["slug"];

export const PROJECT_SLUGS = PROJECTS.map((p) => p.slug) as ProjectSlug[];

export const projectBySlug = (slug: string): ProjectDef | undefined =>
  (PROJECTS as readonly ProjectDef[]).find((p) => p.slug === slug);

/** The four on the thread, then the rest. */
export const STATION_PROJECTS = (PROJECTS as readonly ProjectDef[]).filter((p) => p.station);
export const INDEX_PROJECTS = (PROJECTS as readonly ProjectDef[]).filter((p) => !p.station);
