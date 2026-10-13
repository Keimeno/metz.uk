// Who the site is about: the facts every page agrees on, and the JSON-LD Person (src/lib/seo.ts).

export const PERSON = {
  name: "Constantin Metz",
  alternateName: "Keimeno",
  email: "constantin@metz.uk",
  city: { en: "Munich", de: "München" },
  country: { en: "Germany", de: "Deutschland" },
  /** ISO 3166-1 code, for structured data. */
  countryCode: "DE",
  jobTitle: { en: "Software Engineer", de: "Softwareentwickler" },
  /** One line, for structured data and llms.txt. */
  summary: {
    en: "Self-taught software engineer in Munich who builds products end to end: the engine, the interface and the launch.",
    de: "Autodidaktischer Softwareentwickler in München, der Produkte von Anfang bis Ende baut: Engine, Oberfläche und Launch.",
  },
  knowsAbout: [
    "TypeScript",
    "JavaScript",
    "React",
    "React Native",
    "Node.js",
    "Python",
    "WebGL",
    "Monte Carlo simulation",
    "Statistics",
    "OpenID Connect",
    "Software architecture",
  ],
  knowsLanguage: ["de", "en"],
  /**
   * The portrait, made from `data/sources/portrait/` by `node scripts/gen/portrait.mjs` (4:5, metadata
   * stripped). `src` is the stable URL search engines and structured data point at.
   */
  portrait: {
    src: "/constantin-metz.jpg",
    small: "/media/constantin-metz-640.jpg",
    width: 1200,
    height: 1500,
  },
  profiles: [
    { id: "github", label: "GitHub", handle: "Keimeno", href: "https://github.com/Keimeno" },
    {
      id: "linkedin",
      label: "LinkedIn",
      handle: "c-metz",
      href: "https://www.linkedin.com/in/c-metz/",
    },
    { id: "gitlab", label: "GitLab", handle: "Keimeno", href: "https://gitlab.com/Keimeno" },
  ],
  /** Other pages that are about him or his work, for `sameAs` (the profiles are added to these). */
  sameAs: ["https://zenarios.com"],
} as const;
