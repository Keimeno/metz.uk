// Loads the projects and posts as EN/DE pairs. Throws, and so fails the build, if any entry is
// missing a language or a project is missing from the registry (or the registry from the content).

import { getCollection, type CollectionEntry } from "astro:content";

import { PROJECTS, projectBySlug, type ProjectDef } from "../data/projects";
import { LOCALES, type Locale } from "../i18n/routes";

type Name = "projects" | "posts";
export type Pair<C extends Name> = Record<Locale, CollectionEntry<C>>;

async function pairs<C extends Name>(name: C): Promise<Map<string, Pair<C>>> {
  const entries = (await getCollection(name)) as CollectionEntry<C>[];
  const found = new Map<string, Partial<Pair<C>>>();
  for (const entry of entries) {
    const [id, lang] = entry.id.split("/") as [string, Locale];
    const pair = found.get(id) ?? {};
    pair[lang] = entry;
    found.set(id, pair);
  }
  const missing: string[] = [];
  for (const [id, pair] of found) {
    for (const lang of LOCALES) if (!pair[lang]) missing.push(`src/content/${name}/${id}/${lang}.mdx`);
  }
  if (missing.length) {
    throw new Error(`[content] Every ${name} entry needs English and German. Missing: ${missing.join(", ")}`);
  }
  return found as Map<string, Pair<C>>;
}

export interface Project extends Pair<"projects"> {
  def: ProjectDef;
}

/** Every project in registry order, with both languages. */
export async function getProjects(): Promise<Project[]> {
  const found = await pairs("projects");
  const problems: string[] = [];
  for (const def of PROJECTS) {
    if (!found.has(def.slug)) problems.push(`no content for "${def.slug}" (src/content/projects/${def.slug}/)`);
  }
  for (const id of found.keys()) {
    if (!projectBySlug(id)) problems.push(`"${id}" has content but no entry in src/data/projects.ts`);
  }
  if (problems.length) throw new Error(`[content] Projects out of sync: ${problems.join("; ")}`);
  return PROJECTS.map((def) => ({ def, ...found.get(def.slug)! }));
}

export interface Post extends Pair<"posts"> {
  id: string;
}

/** Every post, newest first, with both languages. */
export async function getPosts(): Promise<Post[]> {
  const found = await pairs("posts");
  return [...found]
    .map(([id, pair]) => ({ id, ...pair }))
    .sort((a, b) => b.en.data.published.getTime() - a.en.data.published.getTime() || a.id.localeCompare(b.id));
}

/** Minutes to read, at 220 words a minute. */
export function readingMinutes(body: string | undefined): number {
  const words = (body ?? "").replace(/```[\s\S]*?```/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
