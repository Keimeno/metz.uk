// llms.txt (llmstxt.org): who Constantin Metz is and where things are, for language models and AI
// answer engines. English, with the German address of every page. Drafts are left out, and like
// everything outside the history pages, it names no employers.
import type { APIRoute } from "astro";

import { PERSON } from "../data/person";
import { postPath, projectPath, route, type Locale, type RouteKey } from "../i18n/routes";
import { getPosts, getProjects } from "../lib/content";

export const GET: APIRoute = async ({ site }) => {
  const abs = (path: string) => new URL(path, site).href;
  const both = (key: RouteKey, en: string, de: string, note: string) =>
    `- [${en}](${abs(route(key, "en"))}): ${note} German: [${de}](${abs(route(key, "de"))})`;
  const projects = await getProjects();
  const posts = (await getPosts()).filter((p) => !p.en.data.draft || !p.de.data.draft);
  const appStore = projects.flatMap((p) => p.def.links).find((l) => l.kind === "appStore")?.href;

  const lines = [
    `# ${PERSON.name}`,
    "",
    `> ${PERSON.name} (${PERSON.alternateName} on GitHub and GitLab) is a self-taught software engineer in Munich, Germany. He builds products end to end: the engine, the interface and the launch. This is his personal site, metz.uk, in English and in German.`,
    "",
    "- Based in Munich, Germany. Works with TypeScript, React and React Native, Node.js, Python and WebGL.",
    "- Now builds AI for industrial quoting at a Y Combinator startup.",
    "- Builds his own products alongside: the largest is Zenarios, a financial planning app for iPhone and Mac, designed and built alone.",
    "- Open source: on the maintainers team of Sequelize, the Node.js ORM, 2020–2021.",
    `- Contact: see ${abs(route("about", "en"))}`,
    "",
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
    ...PERSON.profiles.map((p) => `- ${p.label}: ${p.href}`),
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
