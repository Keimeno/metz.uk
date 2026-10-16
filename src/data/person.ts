// Who the site is about: the facts every page agrees on, and the JSON-LD Person (src/lib/seo.ts).

export const PERSON = {
  name: "Constantin Metz",
  givenName: "Constantin",
  familyName: "Metz",
  /** His handle, on GitHub, GitLab, Stack Overflow and npm. */
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
   * The portrait, made from `data/sources/portrait/` by `node scripts/gen/portrait.mjs` (metadata
   * stripped). `src` (4:5) is the one the about pages show and the sitemap lists; `crops` are the
   * Person's `image` in structured data, in the three shapes Google asks for.
   */
  portrait: {
    src: "/constantin-metz.jpg",
    small: "/media/constantin-metz-640.jpg",
    width: 1200,
    height: 1500,
    crops: [
      { src: "/media/constantin-metz-16x9.jpg", width: 1200, height: 675 },
      { src: "/media/constantin-metz-4x3.jpg", width: 1200, height: 900 },
      { src: "/media/constantin-metz-1x1.jpg", width: 1200, height: 1200 },
    ],
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
  /**
   * His other profiles, listed in llms.txt. One joins `sameAs` once it links back to metz.uk
   * (`linksBack`), so the two pages vouch for each other. Checked 16 Oct 2026: none did yet. The App
   * Store's developer page links to zenarios.com, Stack Overflow to keimeno.party, npm's packages
   * to GitHub.
   */
  elsewhere: [
    {
      label: "App Store (developer)",
      href: "https://apps.apple.com/developer/constantin-metz/id6819013655",
      linksBack: false,
    },
    {
      label: "Stack Overflow",
      href: "https://stackoverflow.com/users/11098471/keimeno",
      linksBack: false,
    },
    { label: "npm", href: "https://www.npmjs.com/~keimeno", linksBack: false },
  ],
} as const;
