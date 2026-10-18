// What the Imprint and the Privacy page need to know.
//
// The privacy page is only true while these match reality: the host, the log retention (see
// SEO-GEO-PLAN.md, Appendix A, for how to keep it at 7 days) and the mail host.

export const LEGAL = {
  name: "Constantin Metz",
  /** The postal address for the Imprint (§ 5 DDG): c/o his brother's company, where post reaches him. */
  address: {
    todo: false,
    lines: ["c/o Webstra Maximilian Metz & Michael Molata GbR", "Benzstraße 2", "82178 Puchheim"],
    country: { en: "Germany", de: "Deutschland" },
  },
  email: "constantin@metz.uk",
  /**
   * Who delivers the site. The VPS was ordered through ca.ovh.com, so the contract is with OVH's
   * Canadian company; the server itself stands in OVH's data centre in Gravelines, France, which
   * OVH SAS runs (the IP address 193.70.43.43 is in OVH SAS's block).
   */
  host: {
    name: "OVH Hosting Inc.",
    address: "1801 McGill College Avenue, Suite 800, Montréal (Québec) H3A 2N4",
    country: { en: "Canada", de: "Kanada" },
    operator: {
      en: "OVH SAS, 2 rue Kellermann, 59100 Roubaix, France",
      de: "OVH SAS, 2 rue Kellermann, 59100 Roubaix, Frankreich",
    },
    location: { en: "Gravelines, France", de: "Gravelines, Frankreich" },
    privacy: "https://www.ovhcloud.com/en-ca/terms-and-conditions/privacy-policy/",
  },
  /** The server logs of page requests are kept at most this long (the privacy page says so). */
  logRetentionDays: 7,
  /** Where mail to his address arrives (MX mail.metz.uk, an IP in Contabo's range). */
  mailHost: { name: "Contabo GmbH", city: "München" },
  /** The supervisory authority for private bodies in Bavaria. */
  authority: {
    name: {
      en: "Bavarian Data Protection Authority (BayLDA)",
      // In the dative: the privacy page says "beim …".
      de: "Bayerischen Landesamt für Datenschutzaufsicht (BayLDA)",
    },
    href: "https://www.lda.bayern.de/",
  },
  updated: "2026-10-18",
} as const;
