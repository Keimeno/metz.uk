// llms.txt (llmstxt.org): who Constantin Metz is and where things are, for language models and AI
// answer engines. English, with the German address of every page. The facts and the questions and
// answers come from src/data/about.ts, the same text as the About page, so the two never differ.
// Drafts are left out, and like everything outside the history pages, it names no employers. "Last
// updated" is the newest change to any page it lists (left out when the build has no git history).
import type { APIRoute } from "astro";

import { ABOUT, plainAnswer } from "../data/about";
import { PERSON } from "../data/person";
import { postPath, projectPath, route, type Locale, type RouteKey } from "../i18n/routes";
import { getPosts, getProjects } from "../lib/content";
import { isoDay } from "../lib/dates";
import { getSitePages } from "../lib/pages";

export const GET: APIRoute = async ({ site }) => {
  const abs = (path: string) => new URL(path, site).href;
  const both = (key: RouteKey, en: string, de: string, note: string) =>
    `- [${en}](${abs(route(key, "en"))}): ${note} German: [${de}](${abs(route(key, "de"))})`;
  const projects = await getProjects();
  const posts = (await getPosts()).filter((p) => !p.en.data.draft || !p.de.data.draft);
  const appStore = projects.flatMap((p) => p.def.links).find((l) => l.kind === "appStore")?.href;
  const updated = (await getSitePages())
    .filter((p) => p.indexable && p.dates)
    .map((p) => p.dates!.modified)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  const lines = [
    `# ${PERSON.name}`,
    "",
    `> ${PERSON.name} (${PERSON.alternateName} on GitHub and GitLab) is a self-taught software engineer in Munich, Germany. He builds products end to end: the engine, the interface and the launch. This is his personal site, metz.uk, in English and in German.`,
    "",
    ...(updated ? [`Last updated: ${isoDay(updated)}`, ""] : []),
    ...ABOUT.en.facts.map((f) => `- ${f.k}: ${f.v}`),
    "",
    "## Questions and answers",
    "",
    ...ABOUT.en.answers.flatMap(({ q, a }) => [
      `### ${q}`,
      "",
      plainAnswer(a, abs, `the address on the About page (${abs(route("about", "en"))})`),
      "",
    ]),
    "## About",
    "",
    both(
      "home",
      "Home",
      "Startseite",
      "the thread, an interactive tour of four projects in WebGL, with a plain HTML version."
    ),
    both("about", "About Constantin Metz", "Über mich", "who he is, in short."),
    both(
      "history",
      "History",
      "Werdegang",
      "the whole story, oldest first, with the names of employers."
    ),
    "",
    "## Projects",
    "",
    ...projects.map(
      (p) =>
        `- [${p.en.data.title}](${abs(projectPath(p.def.slug, "en"))}) (${p.def.years}): ${p.en.data.headline} German: [${p.de.data.title}](${abs(projectPath(p.def.slug, "de"))})`
    ),
    "",
    ...(posts.length
      ? [
          "## Writing",
          "",
          ...posts.map((p) => {
            const link = (l: Locale) => `[${p[l].data.title}](${abs(postPath(p[l].data.slug, l))})`;
            if (p.en.data.draft) return `- ${link("de")} (German): ${p.de.data.description}`;
            return `- ${link("en")}: ${p.en.data.description}${p.de.data.draft ? "" : ` German: ${link("de")}`}`;
          }),
          "",
        ]
      : []),
    "## Elsewhere",
    "",
    ...[...PERSON.profiles, ...PERSON.elsewhere].map((p) => `- ${p.label}: ${p.href}`),
    "- Zenarios: https://zenarios.com",
    ...(appStore ? [`- Zenarios on the App Store: ${appStore}`] : []),
    "",
    "## Optional",
    "",
    both("work", "All work", "Projekte", "every project, each with a case study."),
    both("imprint", "Imprint", "Impressum", "legal notice."),
    both("privacy", "Privacy", "Datenschutz", "no cookies, no tracking, no third parties."),
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
