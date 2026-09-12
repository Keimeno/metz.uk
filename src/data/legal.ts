// What the Imprint and the Privacy page need to know.
//
// TODO(Constantin): fill in the c/o address once the address service is set up, and confirm the
// host once the site is deployed. Until then the pages show these placeholders, visibly marked.

export const LEGAL = {
  name: "Constantin Metz",
  /** The postal address for the Imprint (§ 5 DDG): a c/o address service. */
  address: {
    todo: true,
    lines: ["c/o [address service — TODO]", "[Street and number — TODO]", "[Postcode] München — TODO"],
    country: { en: "Germany", de: "Deutschland" },
  },
  email: "constantin@metz.uk",
  /** The host whose servers deliver the site (and keep its access logs). */
  host: {
    todo: true,
    name: "Cloudflare, Inc.",
    address: "101 Townsend St., San Francisco, CA 94107, USA",
    privacy: "https://www.cloudflare.com/privacypolicy/",
  },
  /** The supervisory authority for private bodies in Bavaria. */
  authority: {
    name: { en: "Bavarian Data Protection Authority (BayLDA)", de: "Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)" },
    href: "https://www.lda.bayern.de/",
  },
  updated: "2026-10-15",
} as const;
