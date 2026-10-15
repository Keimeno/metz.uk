// The home page's words, in both languages. The thread's timing lives in `src/thread/`; this is only
// what the panels and labels say. `HomeCopy` makes both languages carry every string.

import type { Locale } from "./routes";

type StationKey = "zenarios" | "signals" | "paperscores" | "origins" | "history";

export interface HomeCopy {
  title: string;
  description: string;
  intro: { kicker: string; lede: string; hint: string };
  chapters: Record<StationKey, string>;
  caseStudy: string;
  zen: {
    h2: string;
    body: string;
    /** "1,000" is a counter in front of this. */
    fanKicker: string;
    fanH2: string;
    fanBody: (lasts: string, trials: string) => string;
    fanNote: (engine: string) => string;
    appKicker: string;
    appH2: string;
    appBody: string;
    appCta: string;
    phoneAlt: string;
    today: (year: number) => string;
    studies: string;
    retire: (year: number) => string;
    p90: string;
    p10: string;
  };
  sig: {
    h2: string;
    body: string;
    graphKicker: string;
    graphH2: string;
    graphBody: string;
    graphNote: string;
    liveKicker: string;
    liveH2: string;
    liveBody: string;
    onset: string;
    labels: string;
    captionLabel: string;
    spreadLabel: string;
    spreadSource: string;
  };
  ps: {
    h2: string;
    body: string;
    note: string;
    subscores: Record<
      "methodsRigour" | "statisticalValidity" | "transparencyRepro" | "biasIntegrity" | "externalValidity" | "significanceNovelty",
      string
    >;
    /** Turns the scorecard's "pp. 192–196" into this language. */
    pages: (pp: string) => string;
    cited: [string, string, string];
    citedLabel: string;
    scoreLabel: string;
  };
  org: {
    h2: string;
    body: string;
    oidcH2: string;
    oidcBody: string;
    ossKicker: string;
    ossH2: string;
    ossBody: string;
    forum: string;
    auth: string;
    game: string;
    pr: string;
    labels: string;
  };
  his: {
    h2: string;
    body: string;
    more: string;
    steps: { year: string; text: string }[];
    labels: string;
  };
  end: { kicker: string; h2: string; work: string; about: string };
}

const en: HomeCopy = {
  title: "Constantin Metz · Software engineer in Munich",
  description:
    "Constantin Metz is a self-taught software engineer in Munich. Zenarios, Signals, PaperScores and more: products built end to end, from the engine to the launch.",
  intro: {
    kicker: "Software engineer · Munich",
    lede: "I build products end to end: the engine, the interface, and the film that launches them.",
    hint: "Scroll",
  },
  chapters: {
    zenarios: "Zenarios",
    signals: "Signals",
    paperscores: "PaperScores",
    origins: "Origins",
    history: "History",
  },
  caseStudy: "Case study",
  zen: {
    h2: "A financial planner that forecasts a household's money, month by month, for life.",
    body: "Built alone, from the simulation engine to the App Store listing: tax rules for 38 countries and a whole life in one forecast.",
    fanKicker: "futures",
    fanH2: "Then it throws a thousand different markets at the plan.",
    fanBody: (lasts, trials) =>
      `Fat-tailed returns and drifting inflation, drawn a thousand times, each draw seeded and reproducible. Each line is one future. In ${lasts} of these ${trials}, the money lasts.`,
    fanNote: (engine) => `Real engine output · the app's example household · engine ${engine}`,
    appKicker: "On the App Store",
    appH2: "Free on iPhone and Mac, in seven languages.",
    appBody: "No account, no ads, and the plan never leaves the device.",
    appCta: "View on the App Store",
    phoneAlt:
      "The Zenarios overview: net worth at retirement and the forecast with its range of market futures",
    today: (year) => `Today · ${year}`,
    studies: "Studies",
    retire: (year) => `Retirement · ${year}`,
    p90: "Best 10 %",
    p10: "Worst 10 %",
  },
  sig: {
    h2: "It notices what Reddit starts talking about before it trends.",
    body: "Every comment in 37 subreddits, counted like words: a log-odds score for what is rising today, Theil–Sen and Mann–Kendall for what grows over months.",
    graphKicker: "Lead–lag",
    graphH2: "And it learns which communities talk about things first.",
    graphBody:
      "Leader-to-follower edges between subreddits, tested for direction and turned into early warnings, then scored by replaying trends planted in the data.",
    graphNote: "An illustration · drawn on the real configuration of 37 subreddits",
    liveKicker: "LiveTranslate",
    liveH2: "And one that listens: a talk, captioned live in three languages.",
    liveBody:
      "The browser's microphone streams to Deepgram over a WebSocket, DeepL translates each finished line, and every line types itself out on screen.",
    onset: "Onset",
    labels: "The constellation",
    captionLabel: "A live caption in German, English and Portuguese",
    spreadLabel: "An illustrative trend, spreading",
    spreadSource: "source",
  },
  ps: {
    h2: "An AI reviewer that grades medical research before you trust it.",
    body: "Papers scored 0–100 on six dimensions, with checklists aligned with CONSORT and related standards, and findings that point to the page they came from, where there is one.",
    note: "A real scorecard: a narrative review, low on methods by design. The paper isn't named.",
    subscores: {
      methodsRigour: "Methods",
      statisticalValidity: "Statistics",
      transparencyRepro: "Transparency",
      biasIntegrity: "Bias & integrity",
      externalValidity: "External validity",
      significanceNovelty: "Significance",
    },
    pages: (pp) => pp,
    cited: ["Framework", "Model", "Sources"],
    citedLabel: "Cited passages",
    scoreLabel: "Overall score",
  },
  org: {
    h2: "It started with a Minecraft server network.",
    body: "At school I built its web services: a component library, key redemption, and the sign-in.",
    oidcH2: "One sign-in for the forum, the website and the game.",
    oidcBody:
      "A hand-rolled OpenID Connect provider on the forum's legacy XenForo accounts: consent screens, rate limits, a key pair per client and signed RS256 tokens.",
    ossKicker: "Open source",
    ossH2: "Then Sequelize: on the maintainers team as it moved to TypeScript.",
    ossBody: "Reviews, typings, and #13710, which moved the library's errors to TypeScript: +731 −616 across 41 files.",
    forum: "Forum",
    auth: "Auth server",
    game: "Game sites",
    pr: "#13710 · errors → TypeScript",
    labels: "The sign-in and the pull request",
  },
  his: {
    h2: "Self-taught, and shipping since school.",
    body: "A first engineering job at 18, senior a year later, and products end to end since. The full story, with names, is on the history page.",
    more: "The full history",
    steps: [
      { year: "Early", text: "HTML, CSS, JavaScript; Java for Minecraft mods" },
      { year: "2018", text: "Internships during school: Django, Angular" },
      { year: "2020", text: "First engineering job: React widgets, Storybook, CMS sites" },
      { year: "2021", text: "Senior engineer: an offline-capable PWA for in-store kiosks" },
      { year: "2023", text: "Marketplace apps for Jira: React, Node, .NET, an Nx monorepo" },
      { year: "2026", text: "AI quoting for industry at a YC startup; Zenarios ships" },
    ],
    labels: "Steps",
  },
  end: {
    kicker: "That's the thread",
    h2: "Constantin Metz, software engineer in Munich.",
    work: "All work",
    about: "About me",
  },
};

const de: HomeCopy = {
  title: "Constantin Metz · Softwareentwickler in München",
  description:
    "Constantin Metz ist autodidaktischer Softwareentwickler in München. Zenarios, Signals, PaperScores und mehr: Produkte von der Engine bis zum Launch.",
  intro: {
    kicker: "Softwareentwickler · München",
    lede: "Ich baue Produkte von Anfang bis Ende: die Engine, die Oberfläche und den Film, mit dem sie starten.",
    hint: "Scrollen",
  },
  chapters: {
    zenarios: "Zenarios",
    signals: "Signals",
    paperscores: "PaperScores",
    origins: "Anfänge",
    history: "Werdegang",
  },
  caseStudy: "Fallstudie",
  zen: {
    h2: "Ein Finanzplaner, der das Geld eines Haushalts Monat für Monat vorausrechnet, ein Leben lang.",
    body: "Allein gebaut, von der Simulations-Engine bis zum App-Store-Eintrag: Steuerregeln für 38 Länder und ein ganzes Leben in einer Prognose.",
    fanKicker: "Zukünfte",
    fanH2: "Dann lässt es tausend verschiedene Märkte auf den Plan los.",
    fanBody: (lasts, trials) =>
      `Renditen mit Fat Tails und schwankende Inflation, tausendmal gezogen, jeder Zug mit eigenem Seed und reproduzierbar. Jede Linie ist eine mögliche Zukunft. In ${lasts} von ${trials} reicht das Geld.`,
    fanNote: (engine) => `Echte Engine-Ausgabe · der Beispielhaushalt der App · Engine ${engine}`,
    appKicker: "Im App Store",
    appH2: "Kostenlos für iPhone und Mac, in sieben Sprachen.",
    appBody: "Kein Konto, keine Werbung, und der Plan verlässt nie das Gerät.",
    appCta: "Im App Store ansehen",
    phoneAlt:
      "Die Zenarios-Übersicht: das Vermögen zum Renteneintritt und die Prognose mit der Bandbreite möglicher Marktverläufe",
    today: (year) => `Heute · ${year}`,
    studies: "Studium",
    retire: (year) => `Rente · ${year}`,
    p90: "Beste 10 %",
    p10: "Schlechteste 10 %",
  },
  sig: {
    h2: "Es merkt, worüber Reddit zu reden beginnt, bevor es zum Trend wird.",
    body: "Jeder Kommentar in 37 Subreddits, Wort für Wort gezählt: ein Log-Odds-Score für das, was heute steigt, Theil–Sen und Mann–Kendall für das, was über Monate wächst.",
    graphKicker: "Lead–Lag",
    graphH2: "Und es lernt, welche Communitys zuerst über etwas sprechen.",
    graphBody:
      "Kanten von Vorreitern zu Nachzüglern zwischen Subreddits, auf ihre Richtung getestet, in Frühwarnungen übersetzt und an eingepflanzten Trends im Replay gemessen.",
    graphNote: "Eine Illustration · gezeichnet auf der echten Konfiguration mit 37 Subreddits",
    liveKicker: "LiveTranslate",
    liveH2: "Und eins, das zuhört: ein Vortrag, live untertitelt in drei Sprachen.",
    liveBody:
      "Das Mikrofon im Browser streamt per WebSocket zu Deepgram, DeepL übersetzt jede fertige Zeile, und jede Zeile tippt sich auf dem Bildschirm aus.",
    onset: "Beginn",
    labels: "Die Konstellation",
    captionLabel: "Ein Live-Untertitel auf Deutsch, Englisch und Portugiesisch",
    spreadLabel: "Ein Beispieltrend breitet sich aus",
    spreadSource: "Quelle",
  },
  ps: {
    h2: "Ein KI-Gutachter, der medizinische Studien bewertet, bevor man ihnen vertraut.",
    body: "Studien bekommen 0–100 Punkte in sechs Dimensionen, mit Checklisten nach CONSORT und verwandten Standards. Befunde nennen die Seite, von der sie stammen, wo es eine gibt.",
    note: "Eine echte Bewertung: ein narratives Review, das methodisch naturgemäß schwach abschneidet. Die Studie bleibt ungenannt.",
    subscores: {
      methodsRigour: "Methodik",
      statisticalValidity: "Statistik",
      transparencyRepro: "Transparenz",
      biasIntegrity: "Bias & Integrität",
      externalValidity: "Externe Validität",
      significanceNovelty: "Relevanz",
    },
    pages: (pp) => pp.replace(/^pp?\.\s*/, "S. "),
    cited: ["Rahmen", "Modell", "Quellen"],
    citedLabel: "Zitierte Stellen",
    scoreLabel: "Gesamtwertung",
  },
  org: {
    h2: "Angefangen hat es mit einem Minecraft-Servernetzwerk.",
    body: "Noch in der Schule habe ich seine Webdienste gebaut: eine Komponentenbibliothek, das Einlösen von Keys und den Login.",
    oidcH2: "Ein Login für Forum, Website und Spiel.",
    oidcBody:
      "Ein selbst geschriebener OpenID-Connect-Provider auf den alten XenForo-Konten des Forums: Zustimmungsdialoge, Rate Limits, ein Schlüsselpaar pro Client und signierte RS256-Tokens.",
    ossKicker: "Open Source",
    ossH2: "Dann Sequelize: im Maintainer-Team, als das Projekt auf TypeScript umzog.",
    ossBody:
      "Reviews, Typdefinitionen und #13710, das die Fehlerklassen der Bibliothek nach TypeScript brachte: +731 −616 in 41 Dateien.",
    forum: "Forum",
    auth: "Auth-Server",
    game: "Spieleseiten",
    pr: "#13710 · Fehler → TypeScript",
    labels: "Der Login und der Pull Request",
  },
  his: {
    h2: "Autodidakt, und schon zu Schulzeiten mit Software in Produktion.",
    body: "Mit 18 der erste Job als Entwickler, ein Jahr später Senior, seitdem Produkte von Anfang bis Ende. Die ganze Geschichte, mit Namen, steht im Werdegang.",
    more: "Zum Werdegang",
    steps: [
      { year: "Früh", text: "HTML, CSS, JavaScript; Java für Minecraft-Mods" },
      { year: "2018", text: "Praktika während der Schulzeit: Django, Angular" },
      { year: "2020", text: "Erster Job als Entwickler: React-Widgets, Storybook, CMS-Websites" },
      { year: "2021", text: "Senior Engineer: eine offlinefähige PWA für Kiosks im Laden" },
      { year: "2023", text: "Marketplace-Apps für Jira: React, Node, .NET, ein Nx-Monorepo" },
      { year: "2026", text: "KI für Angebote in der Industrie bei einem YC-Start-up; Zenarios erscheint" },
    ],
    labels: "Stationen",
  },
  end: {
    kicker: "Das war der Thread",
    h2: "Constantin Metz, Softwareentwickler in München.",
    work: "Alle Projekte",
    about: "Über mich",
  },
};

export const HOME: Record<Locale, HomeCopy> = { en, de };
