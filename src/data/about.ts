// The canonical statement of who Constantin Metz is and what he does: the facts list and the "In
// short" questions and answers of the About page. The About pages draw them, and llms.txt is built
// from them, so a fact changed here changes both.
//
// When his role or his projects change, change this file first, then the pages that repeat a fact
// in their own words (the home page, the case studies, the history). The build fails if "What has he
// built?" leaves out a project that has a station on the thread or lives at an address of its own.
//
// Employers are not named here (that's the history page's job); nothing here is an email address
// (the About page shows it through src/components/ui/Email.astro).

import { projectPath, type Locale } from "../i18n/routes";
import { PERSON } from "./person";
import { PROJECTS, type ProjectDef } from "./projects";

/** Text, a link, or the email address. */
export type AnswerPart = string | { href: string; text: string } | { email: true };

export interface Answer {
  id: "who" | "built" | "where" | "keimeno" | "contact";
  q: string;
  a: AnswerPart[];
}

export interface About {
  facts: { k: string; v: string }[];
  inShort: string;
  answers: Answer[];
}

const EMAIL = { email: true } as const;
const linkedIn = PERSON.profiles.find((p) => p.id === "linkedin")!.href;
const work = (slug: string, text: string, locale: Locale) => ({
  href: projectPath(slug, locale),
  text,
});

export const ABOUT: Record<Locale, About> = {
  en: {
    facts: [
      { k: "Based in", v: "Munich, Germany" },
      { k: "Also known as", v: "Keimeno (on GitHub and GitLab)" },
      { k: "Works on", v: "TypeScript, React and React Native, Node.js, Python, WebGL" },
      { k: "Now", v: "AI for industrial quoting at a Y Combinator startup" },
      { k: "Open source", v: "Sequelize maintainers team, 2020–2021" },
      { k: "Languages", v: "German, English" },
    ],
    inShort: "In short",
    answers: [
      {
        id: "who",
        q: "Who is Constantin Metz?",
        a: [
          "Constantin Metz is a self-taught software engineer in Munich, Germany, who builds products end to end: the engine, the interface and the launch. Today he builds AI for industrial quoting at a Y Combinator startup.",
        ],
      },
      {
        id: "built",
        q: "What has he built?",
        a: [
          "His largest project is ",
          work("zenarios", "Zenarios", "en"),
          ", a financial planner for iPhone and Mac that he designed and built alone, with a simulation engine that plays through a thousand market futures and tax rules for 38 countries. Alongside it he has built ",
          work("signals", "Signals", "en"),
          ", a trend detector for 37 subreddits and live captions for talks; ",
          work("paperscores", "PaperScores", "en"),
          ", an AI reviewer for medical papers; ",
          work("stet", "Stet", "en"),
          ", a Fictionary party game for phones; and ",
          work("unterm-strich", "Unterm Strich", "en"),
          ", a total-cost calculator for cars in Germany. Before them, he wrote ",
          work("origins", "an OpenID Connect provider", "en"),
          " while still at school, and was on the maintainers team of Sequelize, the Node.js ORM, in 2020–2021.",
        ],
      },
      {
        id: "where",
        q: "Where is he based?",
        a: ["In Munich, Germany. He speaks German and English."],
      },
      {
        id: "keimeno",
        q: "Is “Keimeno” the same person?",
        a: ["Yes. Keimeno is the handle he uses on GitHub, GitLab, Stack Overflow and npm."],
      },
      {
        id: "contact",
        q: "How can I reach him?",
        a: ["By email, at ", EMAIL, ", or on ", { href: linkedIn, text: "LinkedIn" }, "."],
      },
    ],
  },
  de: {
    facts: [
      { k: "Lebt in", v: "München" },
      { k: "Auch bekannt als", v: "Keimeno (auf GitHub und GitLab)" },
      { k: "Arbeitet mit", v: "TypeScript, React und React Native, Node.js, Python, WebGL" },
      { k: "Jetzt", v: "KI für Angebote in der Industrie bei einem Y-Combinator-Start-up" },
      { k: "Open Source", v: "Maintainer-Team von Sequelize, 2020–2021" },
      { k: "Sprachen", v: "Deutsch, Englisch" },
    ],
    inShort: "Kurz gesagt",
    answers: [
      {
        id: "who",
        q: "Wer ist Constantin Metz?",
        a: [
          "Constantin Metz ist ein autodidaktischer Softwareentwickler in München, der Produkte von Anfang bis Ende baut: Engine, Oberfläche und Launch. Heute baut er KI für Angebote in der Industrie bei einem Y-Combinator-Start-up.",
        ],
      },
      {
        id: "built",
        q: "Was hat er gebaut?",
        a: [
          "Sein größtes Projekt ist ",
          work("zenarios", "Zenarios", "de"),
          ", ein Finanzplaner für iPhone und Mac, den er allein entworfen und gebaut hat: mit einer Simulations-Engine, die tausend Marktverläufe durchspielt, und Steuerregeln für 38 Länder. Daneben sind entstanden: ",
          work("signals", "Signals", "de"),
          ", eine Trenderkennung für 37 Subreddits und Live-Untertitel für Vorträge; ",
          work("paperscores", "PaperScores", "de"),
          ", ein KI-Gutachter für medizinische Studien; ",
          work("stet", "Stet", "de"),
          ", ein Bluffspiel mit seltenen Wörtern fürs Handy; und ",
          work("unterm-strich", "Unterm Strich", "de"),
          ", ein Vollkostenrechner für Autos in Deutschland. Davor schrieb er noch in der Schule ",
          work("origins", "einen eigenen OpenID-Connect-Provider", "de"),
          " und war 2020–2021 im Maintainer-Team von Sequelize, dem ORM für Node.js.",
        ],
      },
      {
        id: "where",
        q: "Wo lebt er?",
        a: ["In München. Er spricht Deutsch und Englisch."],
      },
      {
        id: "keimeno",
        q: "Ist „Keimeno“ dieselbe Person?",
        a: [
          "Ja. Unter dem Namen Keimeno ist er auf GitHub, GitLab, Stack Overflow und npm zu finden.",
        ],
      },
      {
        id: "contact",
        q: "Wie erreiche ich ihn?",
        a: ["Per E-Mail an ", EMAIL, " oder über ", { href: linkedIn, text: "LinkedIn" }, "."],
      },
    ],
  },
};

/** The projects "What has he built?" has to link: on the thread, or live at an address of its own. */
const mustBeNamed = (PROJECTS as readonly ProjectDef[]).filter(
  (p) => p.station || p.links.some((l) => l.kind === "live" || l.kind === "appStore")
);

for (const locale of Object.keys(ABOUT) as Locale[]) {
  const built = ABOUT[locale].answers.find((a) => a.id === "built")!;
  const linked = new Set(
    built.a.map((part) => (typeof part === "object" && "href" in part ? part.href : ""))
  );
  const missing = mustBeNamed.filter((p) => !linked.has(projectPath(p.slug, locale)));
  if (missing.length)
    throw new Error(
      `src/data/about.ts (${locale}): "What has he built?" doesn't link ${missing
        .map((p) => p.slug)
        .join(", ")}. Add the new project to the answer, in both languages.`
    );
}

/**
 * An answer as plain text with absolute links, for llms.txt. The email address never leaves the
 * About page, so `email` stands in for it.
 */
export function plainAnswer(parts: AnswerPart[], abs: (path: string) => string, email: string) {
  return parts
    .map((part) =>
      typeof part === "string"
        ? part
        : "email" in part
          ? email
          : `[${part.text}](${part.href.startsWith("/") ? abs(part.href) : part.href})`
    )
    .join("");
}
