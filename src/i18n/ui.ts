// Interface strings in both languages. The German table must have exactly the English keys:
// a missing or extra key is a type error, so `astro check` (and the build) catch drift.

import type { Locale } from "./routes";

const en = {
  "site.name": "Constantin Metz",
  "site.role": "Software engineer in Munich",
  "site.description":
    "Constantin Metz is a self-taught software engineer in Munich who builds products end to end: engines, interfaces, and the films that launch them.",
  "skip": "Skip to content",

  "nav.label": "Main",
  "nav.home": "Home",
  "nav.work": "Work",
  "nav.about": "About",
  "nav.history": "History",
  "nav.writing": "Writing",
  "nav.chapters": "Chapters",

  "lang.label": "Language",
  "lang.other": "Deutsch",
  "lang.otherShort": "DE",
  "lang.otherTitle": "Diese Seite auf Deutsch",

  "footer.contact": "Contact",
  "footer.elsewhere": "Elsewhere",
  "footer.site": "This site",
  "footer.imprint": "Imprint",
  "footer.privacy": "Privacy",
  "footer.rss": "RSS",
  "footer.note": "Built by hand in Munich. No cookies, no tracking.",

  "work.title": "Work",
  "work.lede": "Designed and built, mostly alone, from the engine to the launch.",
  "work.featured": "Stations on the thread",
  "work.more": "More things I've built",
  "work.case": "Case study",
  "work.all": "All work",
  "work.role": "Role",
  "work.stack": "Stack",
  "work.years": "When",
  "work.links": "Links",
  "work.next": "Next",
  "work.back": "All work",

  "link.appStore": "App Store",
  "link.site": "Website",
  "link.live": "Live",
  "link.repo": "Source",
  "link.docs": "Docs",
  "link.pr": "Pull request",

  "writing.title": "Writing",
  "writing.lede": "Notes on things I've built: how they work, and how I'd build them today.",
  "writing.read": "Read",
  "writing.all": "All writing",
  "writing.draft": "Draft",
  "writing.draftNote": "This is a draft. The text is still being edited and may change.",
  "writing.published": "Published",
  "writing.minutes": "min read",
  "writing.otherLang": "Auf Deutsch lesen",
  "writing.rss": "Subscribe via RSS",

  "about.title": "About",
  "about.facts": "Facts",
  "about.profiles": "Profiles",
  "about.portraitPending": "Portrait coming soon",

  "history.title": "History",

  "home.chapters": "Chapters",
  "home.more": "More things I've built",
  "home.moreLede": "Smaller projects, each with a write-up.",
  "home.writing": "Writing",
  "home.writingLede": "How the thread works, and other notes.",
  "home.toTop": "Back to the top",

  "date.present": "today",
  "notFound.title": "Not found",
  "notFound.body": "This page doesn't exist, or it has moved.",
  "notFound.home": "Go to the home page",
} as const;

export type UiKey = keyof typeof en;

const de = {
  "site.name": "Constantin Metz",
  "site.role": "Softwareentwickler in München",
  "site.description":
    "Constantin Metz ist ein autodidaktischer Softwareentwickler aus München, der Produkte von Anfang bis Ende baut: Engines, Oberflächen und die Filme, mit denen sie starten.",
  "skip": "Zum Inhalt springen",

  "nav.label": "Hauptnavigation",
  "nav.home": "Start",
  "nav.work": "Projekte",
  "nav.about": "Über mich",
  "nav.history": "Werdegang",
  "nav.writing": "Texte",
  "nav.chapters": "Kapitel",

  "lang.label": "Sprache",
  "lang.other": "English",
  "lang.otherShort": "EN",
  "lang.otherTitle": "This page in English",

  "footer.contact": "Kontakt",
  "footer.elsewhere": "Anderswo",
  "footer.site": "Diese Seite",
  "footer.imprint": "Impressum",
  "footer.privacy": "Datenschutz",
  "footer.rss": "RSS",
  "footer.note": "Von Hand gebaut in München. Keine Cookies, kein Tracking.",

  "work.title": "Projekte",
  "work.lede": "Entworfen und gebaut, meist allein, von der Engine bis zum Launch.",
  "work.featured": "Stationen des Threads",
  "work.more": "Weitere Projekte",
  "work.case": "Fallstudie",
  "work.all": "Alle Projekte",
  "work.role": "Rolle",
  "work.stack": "Stack",
  "work.years": "Zeitraum",
  "work.links": "Links",
  "work.next": "Weiter",
  "work.back": "Alle Projekte",

  "link.appStore": "App Store",
  "link.site": "Website",
  "link.live": "Live",
  "link.repo": "Quellcode",
  "link.docs": "Doku",
  "link.pr": "Pull Request",

  "writing.title": "Texte",
  "writing.lede": "Notizen zu Dingen, die ich gebaut habe: wie sie funktionieren und wie ich sie heute bauen würde.",
  "writing.read": "Lesen",
  "writing.all": "Alle Texte",
  "writing.draft": "Entwurf",
  "writing.draftNote": "Dies ist ein Entwurf. Der Text wird noch überarbeitet und kann sich ändern.",
  "writing.published": "Veröffentlicht",
  "writing.minutes": "Min. Lesezeit",
  "writing.otherLang": "Read in English",
  "writing.rss": "Per RSS abonnieren",

  "about.title": "Über mich",
  "about.facts": "Fakten",
  "about.profiles": "Profile",
  "about.portraitPending": "Porträt folgt",

  "history.title": "Werdegang",

  "home.chapters": "Kapitel",
  "home.more": "Weitere Projekte",
  "home.moreLede": "Kleinere Projekte, jedes mit einer Beschreibung.",
  "home.writing": "Texte",
  "home.writingLede": "Wie der Thread funktioniert, und andere Notizen.",
  "home.toTop": "Zurück nach oben",

  "date.present": "heute",
  "notFound.title": "Nicht gefunden",
  "notFound.body": "Diese Seite gibt es nicht, oder sie ist umgezogen.",
  "notFound.home": "Zur Startseite",
} as const satisfies Record<UiKey, string>;

const UI: Record<Locale, Record<UiKey, string>> = { en, de };

/** The string table for a language: `const t = useT(locale); t("nav.work")`. */
export function useT(locale: Locale) {
  return (key: UiKey): string => UI[locale][key];
}
