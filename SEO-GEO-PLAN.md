# SEO and GEO plan: Constantin Metz and metz.uk

Prepared 16 October 2026. This pass is analysis only: no site code changed, no external account
touched. Searches ran on 16 Oct 2026 between 21:00 and 22:20 CEST.

**Update, later on 16 Oct:** the site changes from §6A that needed no decision are done. §9 has
what changed and what the pass found; Appendix A has the nginx config for Coolify (A1).

**How the evidence was gathered (and its limits)**

- **Browser:** searches ran in the in-app browser from a German IP, logged out, with no consent
  accepted. Google results were read behind the consent banner. The browser was in a German
  locale, so treat the Google results as roughly "google.de, not personalised".
- **Bing: not observed directly.** For automated traffic it returned unrelated results: "keimeno
  github" gave the LinkedIn pages of an unrelated person. DuckDuckGo (largely Bing-backed) and
  ChatGPT search (Bing-backed) stand in for it below.
- **Gemini and Copilot: not observed.** Both need a sign-in.
- **Google AI Overviews** didn't appear for any name query. One did appear for the bare
  "Constantin".
- **Search volumes** come from Semrush (DE and US databases).
- **On-site findings** come from `npx astro build` on commit `fa8a3d5`, `dist/`, and the live
  site.

---

## 1. Summary

**Where he stands today**

- **His name already leads, but not through his own site.** On Google (DE), his LinkedIn is #1
  for "Constantin Metz" and his GitHub is in the top five. In Perplexity, ChatGPT search and
  Google AI Mode, he's the first person named among the namesakes.
- **metz.uk is in no index.** The site is live (nginx behind Coolify), but `site:metz.uk` returns
  nothing on Google or DuckDuckGo, and no Search Console or Bing property exists.
- **The facts engines repeat are stale or scattered.**
  - Bing, DuckDuckGo and ChatGPT still say "Software Engineer at Appfire". That comes from Bing's
    copy of LinkedIn and from GitHub's company field.
  - No profile links to metz.uk.
  - His old domains point nowhere useful: keimeno.party has lapsed and is unregistered, and the
    2019 portfolio at monternos.net still ranks #7 for his name.
  - zenarios.com doesn't name him at all.

**The levers, in order**

1. Get metz.uk into Google and Bing. Bing matters twice: it also feeds DuckDuckGo, ChatGPT search
   and Copilot.
2. Make every profile say the same thing and link to metz.uk: the same name, photo and one-line
   bio.
3. Retire or redirect the old domains.
4. Publish the three posts.
5. Earn a handful of genuine third-party pages that name him and link to metz.uk. These also
   matter most for AI answers.

**Realistic outcome**

- **Within 1–3 months:** #1–#3 on Google for "Constantin Metz", and #1 for name + Munich or name
  - software engineer. Several of the top ten would be his own properties.
- **"Zenarios":** #1 is likely within months.
- **"Keimeno":** top five, but probably not #1. A Marburg CMS company has used the name since 2006.
- **Bare "Constantin" or "Metz":** not reachable (section 3).

---

## 2. Today's landscape (evidence)

### 2.1 "Constantin Metz"

| Engine                           | What ranks (top 10, in order)                                                                                                                                                                                                                                                                                                                                                                                                                      | His properties                              |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Google, DE, hl=en                | **1** LinkedIn `/in/c-metz` "Constantin Metz – Mercura (YC W25)", 320+ followers, Munich · image pack (his LinkedIn photos ×4, GitHub avatar, a pastor named Konstantin Metz) · Facebook name directory · Instagram "Konstantin Metz" · LinkedIn: another Constantin Metz (account manager, NRW) · **GitHub Keimeno** · newspaper item about a pastor Konstantin Metz · hockey roster · Hyrox athlete page · LinkedIn "2 Constantin Metz profiles" | LinkedIn #1, GitHub ~#5, images             |
| Google, quoted "Constantin Metz" | Same set, plus **monternos.net "Portfolio - Constantin Metz"** (his 2019–2020 portfolio) at #7                                                                                                                                                                                                                                                                                                                                                     | LinkedIn #1, GitHub #4, monternos #7        |
| Google, `gl=us`                  | Instagram and Facebook "Konstantin Metz" first · **LinkedIn #3** · Hyrox · **GitHub #5** · flights Metz–Constantine                                                                                                                                                                                                                                                                                                                                | LinkedIn #3, GitHub #5                      |
| DuckDuckGo, de-de and us-en      | LinkedIn directory · other Constantin Metz's LinkedIn · **his LinkedIn, titled "Software Engineer at Appfire"** · Facebook ×2 · Instagram metz_cons · RocketReach (him, "Appfire") · getprog.ai (him, "Appfire") · a different name                                                                                                                                                                                                                | LinkedIn #2–3, only with the stale headline |
| Brave                            | Another Constantin Metz's LinkedIn · football club pages for a Konstantin Metz · flights Metz ↔ Constantine                                                                                                                                                                                                                                                                                                                                        | GitHub ~#12, LinkedIn absent                |
| Claude web search (US index)     | "Didn't turn up anyone named Constantin Metz"; flights Metz–Constantine                                                                                                                                                                                                                                                                                                                                                                            | none                                        |

- **No knowledge panel and no AI Overview** for any form of the name.
- **Search volume:** Semrush records no volume for "constantin metz" in DE or US, meaning fewer
  than about 10 searches a month. "konstantin metz" gets 30 a month in DE.
- **The brief said his GitLab was the only exact match.** That didn't reproduce on Google today.
  `site:gitlab.com Keimeno` returns no documents, so his GitLab isn't in Google's index at all.
  The GitLab profile still links to keimeno.party and to X `@_Keimeno`, which returns 404.

### 2.2 Name + city or role

| Query (Google DE)                  | Result                                                                                                          |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Constantin Metz München            | **LinkedIn #1** (his), then an Instagram, the LinkedIn directory, a phone book, the other Constantin Metz       |
| Constantin Metz software engineer  | **LinkedIn #1**, LinkedIn directory, theorg.com "Appfire – Munich" (lists him), other Metz engineers, TUM pages |
| Constantin Metz Softwareentwickler | **GitHub #1**, then other people named Metz                                                                     |
| who is Constantin Metz             | **LinkedIn #1**, IMDb "Konstantin Metz" (an actor), a Hyrox result, image pack                                  |

On DuckDuckGo ("software engineer" and "Softwareentwickler"), LinkedIn is #1 with the Appfire
headline. RocketReach comes #2, getprog.ai sits in the top five, GitHub is #8–10, and monternos.net
is #9.

### 2.3 "Keimeno"

- **Google:** keimeno.de (Keimeno CMS, Trebaxa, Marburg, founded 2006) holds #1 with sitelinks
  and the image pack. After it come the Keimeno CMS Facebook page (2.1K followers), the
  `robacarp/keimeno` Crystal library, trebaxa.com, Tracxn, **npmjs.com/~keimeno (his)** and a
  Greek song. His GitHub isn't on page 1.
- **Google "Keimeno Constantin":** GitHub #1 and LinkedIn #2. The LinkedIn snippet shows
  "Websites: Portfolio https://github.com/Keimeno", so his LinkedIn website field points at
  GitHub, not metz.uk. The Sequelize members page and neojax follow.
- **DuckDuckGo:** keimeno.de ×2, the Greek word (κείμενο = "text"), Wiktionary, robacarp,
  **github.com/Keimeno at #7**.
- **ChatGPT, "Who is Keimeno (developer)?":** names robacarp's library and Keimeno CMS. He isn't
  mentioned.
- **Perplexity, "Who is Keimeno on GitHub?":** identifies him, "a developer based in Munich who
  works at Appfire". That comes from GitHub's company field.
- **Typed "keimeno.party":** DuckDuckGo autocorrects it to kemono.party, a piracy archive. That's
  one more reason not to revive the name (§5.2).

### 2.4 "Zenarios" and "Constantin Metz Zenarios"

- **Google "Zenarios":**
  - #1 is a YouTube channel called Zenarios (4.1K subscribers, sneeze-themed stories).
  - **#2 is zenarios.com**, followed by a Tumblr sneeze tag, videos, zenar.io (Zenario CMS), a
    Gundam fan wiki, Instagram, and zenarios.com/methodology.
  - "People also search for" shows _Zenarios sneeze_, _Zenarios youtube_ and _Zenarios videos_.
- **Google "Zenarios app":** zenarios.com #1, its privacy page #4.
- **DuckDuckGo "Zenarios":** the YouTube channel, zenar.io, DeviantArt, Instagram ×2,
  github.com/zenariosapp #6, the App Store listing (TW storefront) #7. zenarios.com is **not in
  the top 10**.
- **"Constantin Metz Zenarios":** DuckDuckGo puts the App Store listing #1 ("Download Zenarios by
  Constantin Metz"). Google shows his LinkedIn with "Missing: Zenarios". No page links the two.
- **Perplexity, "Who made the Zenarios app?":** "made by Constantin Metz", citing the App Store.
- **App Store lookup:** released 2026-10-14, v1.0, 0 ratings, seller "Constantin Metz", developer
  page `apps.apple.com/…/developer/constantin-metz/id6819013655`, seller URL zenarios.com.
- **zenarios.com itself:**
  - Its JSON-LD has an Organization (`#organization`) and a MobileApplication (`#app`) with no
    `founder` or `author`.
  - The page has **0 mentions of "Constantin" or "Metz"**.
  - Its llms.txt doesn't name the maker.

### 2.5 The bare terms

| Query           | Who holds it                                                                                                                                                                                                       | Volume (Semrush)                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------- |
| Constantin      | Knowledge panel: **Constantin Film** (Munich). AI Overview: Constantine the Great, Constantin Film, Constantin Entertainment. Then constantin.film with sitelinks, Wikipedia, Vacheron Constantin, People also ask | DE 1,900/mo (KD 55); US 1,600 (KD 82) |
| Metz            | Knowledge panel: **Metz, the city** (weather, things to do). Then Wikipedia, the tourist office, METZ TVs (metz-ce.de), metz.de, metz-group, travel blogs                                                          | DE 33,100/mo (KD 40); "fc metz" 6,600 |
| metz.uk (typed) | METZ Blue TVs, metu.uk, metro.co.uk, Euronics "Metz"                                                                                                                                                               | 0                                     |

### 2.6 AI answer engines

| Engine (logged out) | Prompt                                            | What it said                                                                                                                                                                                                                                 | Cites                                         |
| ------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Perplexity          | Who is Constantin Metz?                           | "Most likely refers to a Munich-based software engineer". Self-taught; React, TypeScript, Node, "C#/.NET"; "associated with Appfire and, more recently, Mercura (YC W25)". Then the other Constantin Metz and an actor named Konstantin Metz | LinkedIn ×2, getprog.ai, GitHub, IMDb, … (10) |
| Perplexity          | Constantin Metz software engineer Munich projects | His whole LinkedIn job history as a table, plus a GitHub summary, "and a personal web-development portfolio"                                                                                                                                 | LinkedIn, GitHub                              |
| Perplexity          | Who made the Zenarios app?                        | Constantin Metz                                                                                                                                                                                                                              | App Store, GitHub org                         |
| Perplexity          | Who is Keimeno on GitHub?                         | Him, "who works at Appfire"                                                                                                                                                                                                                  | GitHub                                        |
| ChatGPT (search on) | Who is Constantin Metz?                           | "Several people…". #1 is him: Munich, self-taught, "His LinkedIn profile lists Appfire as his employer". #2 is the other Constantin Metz                                                                                                     | LinkedIn                                      |
| ChatGPT             | Who is Keimeno (developer)?                       | robacarp and Keimeno CMS. Not him                                                                                                                                                                                                            | GitHub, keimeno.de                            |
| Google AI Mode      | who is Constantin Metz                            | First "The Software Engineer": Munich, alias Keimeno, Mercura (YC W25), previously Appfire. Then a researcher and a pastor named Konstantin Metz                                                                                             | LinkedIn, GitHub                              |
| Gemini, Copilot     | —                                                 | Not observed (sign-in required)                                                                                                                                                                                                              | —                                             |

**What this means**

- The engines already rank him first among the namesakes.
- They describe him **from LinkedIn, GitHub and people-search aggregators** (getprog.ai, which is
  built from his GitHub ID 58604248, and RocketReach).
- **None cites metz.uk** yet, because it isn't indexed.
- The stale "Appfire" comes from Bing's index (ChatGPT, DuckDuckGo) and from GitHub's company
  field (Perplexity).

### 2.7 His properties today

| Property                                                 | Observed                                                                                                                                                                                                                                            | Problem                                                                                       |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **metz.uk**                                              | Live; `last-modified` 16 Oct 17:19, nginx, HTTP/2 + h3, brotli                                                                                                                                                                                      | Not indexed anywhere; no Search Console or Bing property; host issues (§4, E2)                |
| **LinkedIn** `/in/c-metz`                                | Google shows "Mercura (YC W25)". Bing/DuckDuckGo/ChatGPT still show "Software Engineer at Appfire"                                                                                                                                                  | Website field = GitHub, not metz.uk                                                           |
| **GitHub** `Keimeno` (ID 58604248)                       | Name ✓, location Munich ✓, **company "Appfire"**, **website empty**, bio empty, social: LinkedIn only; profile README = a metrics SVG only; public orgs `sequelize`, `mercura-tech`; repo `personal-portfolio` has homepage `https://keimeno.party` | Stale company; no link to metz.uk                                                             |
| **GitLab** `Keimeno`                                     | Name ✓, **website keimeno.party**, X `@_Keimeno` (404), one forked project                                                                                                                                                                          | Not indexed by Google; dead links                                                             |
| **Stack Overflow** 11098471 "Keimeno"                    | 2,659 reputation, **website keimeno.party**                                                                                                                                                                                                         | Dead link; display name is the handle                                                         |
| **npm** `~keimeno`                                       | Ranks on Google page 1 for "Keimeno"; packages neojax, veloce, `@luminu/*`, `@keimeno/scss`; neojax's `author` is "Keimeno"                                                                                                                         | Profile page is behind a bot check; homepage unknown                                          |
| **App Store developer** "Constantin Metz" (id6819013655) | Seller name = his name; seller URL zenarios.com                                                                                                                                                                                                     | Fine; a strong `sameAs` candidate                                                             |
| **zenarios.com**                                         | Product site, AI crawlers allowed, own llms.txt                                                                                                                                                                                                     | Doesn't name or link him                                                                      |
| **monternos.net**                                        | His 2019–2020 portfolio (Vue SPA, "Copyright © Constantin Metz"; links GitHub, X, Stack Overflow); IONOS, expires 2027-02-12                                                                                                                        | Live and ranking (#7) with old content                                                        |
| **keimeno.party**                                        | Registry WHOIS "No Data Found", no DNS; Wayback has 2021–22 snapshots. Semrush referring domains: gitlab.com plus auto-generated spam directories                                                                                                   | **Lapsed and registrable by anyone**, yet still linked from GitLab, Stack Overflow and GitHub |
| X `@_Keimeno`                                            | "This account doesn't exist"                                                                                                                                                                                                                        | Dead link on GitLab and monternos.net                                                         |
| Bluesky, Mastodon                                        | None found                                                                                                                                                                                                                                          | —                                                                                             |
| Sequelize                                                | Listed on the GitHub org's People page and in `AUTHORS`; 10 merged PRs (incl. #13710)                                                                                                                                                               | Nothing to change                                                                             |
| Aggregators                                              | RocketReach and getprog.ai ("Appfire"); theorg.com (Appfire Munich)                                                                                                                                                                                 | Stale facts that AI engines quote                                                             |

**Knowledge panels:** none for him. Panels exist for Constantin Film (on "Constantin") and for
Metz, the city (on "Metz").

---

## 3. Realistic targets

| Query                                                  | Today (Google DE)                             | Target                                      | When                      | Confidence                    | Why                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------ | --------------------------------------------- | ------------------------------------------- | ------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Constantin Metz                                        | LinkedIn #1, GitHub ~#5, metz.uk absent       | metz.uk #1–3, ≥5 of the top 10 his          | 4–12 weeks after indexing | High for top 3; medium for #1 | Almost no competition: the namesakes are LinkedIn, Facebook and roster pages with no entity signals. metz.uk has the exact name in every title, an H1 on `/`, Person + ProfilePage markup, and (once profiles link back) reciprocal identity links. Google often keeps LinkedIn at #1 for people; that's fine because it's his. |
| Constantin Metz München / Munich                       | LinkedIn #1                                   | metz.uk #1–2                                | 2–6 weeks                 | High                          | "Software engineer in Munich" / "Softwareentwickler in München" is in the titles of `/`, `/de/`, `/about/` and `/de/ueber-mich/`                                                                                                                                                                                                |
| Constantin Metz software engineer / Softwareentwickler | LinkedIn #1 / GitHub #1                       | metz.uk #1–2                                | 2–6 weeks                 | High                          | Same                                                                                                                                                                                                                                                                                                                            |
| Constantin Metz Zenarios                               | No page links the two                         | `/work/zenarios/` #1, App Store #2          | 2–6 weeks                 | High                          | The case study is titled "Zenarios: a case study by Constantin Metz"                                                                                                                                                                                                                                                            |
| Zenarios                                               | YouTube #1, zenarios.com #2                   | zenarios.com #1                             | 1–4 months                | Medium–high                   | The channel is unrelated and generic; app-store traction, reviews and a few links win. Bing/DuckDuckGo are further behind (zenarios.com isn't in the top 10).                                                                                                                                                                   |
| Keimeno                                                | keimeno.de, a company since 2006, owns it     | GitHub or npm top 5; metz.uk on page 1 or 2 | 2–6 months                | Low for #1                    | "Keimeno" is a business name, a Greek word and two other software projects. Aim for "Keimeno GitHub" or "Keimeno developer" (already his).                                                                                                                                                                                      |
| Constantin                                             | Constantin Film panel, Roman emperor, watches | Not reachable organically                   | —                         | —                             | There's a knowledge-graph entity with a panel for the head term, Wikipedia-grade competitors and 1,900 searches a month. A personal site can't enter that top 10 without being a famous entity.                                                                                                                                 |
| Metz                                                   | City panel, FC Metz, METZ TVs                 | Not reachable                               | —                         | —                             | 33,100 searches a month for a city and two brands                                                                                                                                                                                                                                                                               |

**Partial wins on the bare terms (honest list)**

- **"metz.uk" typed as a word:** metz.uk can rank for its own domain, and for "metz uk" next to the
  TV brand's UK pages, once it's indexed.
- **Images:** the image pack for "Constantin Metz" already shows his face (LinkedIn and GitHub).
  Using the same portrait on metz.uk keeps it that way. For the bare "Constantin", no.
- **"People also search for" and autocomplete** come from real search behaviour and the knowledge
  graph. They can't be engineered without manipulation (see §5.7). They may follow if he gets a
  knowledge panel.
- **AI answers:** for "Constantin" or "Metz" the engines talk about Constantine, Constantin Film and
  the city. He won't appear, and no honest tactic changes that. For "Constantin Metz", he already
  comes first. The goal there is **correct facts and a citation of metz.uk**.

---

## 4. On-site audit

### What's already strong (keep it)

- **Titles, descriptions and H1s.**
  - Every page title carries the name: "Constantin Metz · Software engineer in Munich", "Zenarios:
    a case study by Constantin Metz", and so on.
  - Descriptions open with "Constantin Metz is/by Constantin Metz".
  - `/` and `/de/` have the H1 "Constantin Metz".
- **Structured data.**
  - The JSON-LD graph has a stable `https://metz.uk/#person` and a WebSite on the home page
    (Google's site-name signal: name "Constantin Metz", alternateName "metz.uk").
  - ProfilePage is on `/`, `/de/`, `/about/` and `/de/ueber-mich/`, with BreadcrumbList,
    BlogPosting translations and project nodes.
  - **The live site validates:**
    - Schema Markup Validator on `/about/`: ProfilePage, 0 errors, 0 warnings.
    - Google Rich Results Test on `/about/`: Profile page and Breadcrumbs valid.
    - Rich Results Test on `/`: Profile page valid.
- **Languages and links.** hreflang en/de/x-default, self-canonicals, sitemap alternates, internal
  links and one H1 per page are all enforced by `npm run verify` (it passed on this build).
- **Portrait.**
  - Served at `/constantin-metz.jpg`.
  - Alt text: "Portrait of Constantin Metz in a dark coat, in front of a Roman stone arch".
  - EXIF stripped.
  - **The same photo is his GitHub avatar**, so the face is consistent across properties.
- **The thread's text reaches crawlers.** The raw HTML of `/` has all of it (924 words, every
  station), and Google's rendered HTML (Rich Results Test, smartphone) contains the H1 and every
  station's text.
- **Crawler access.** robots.txt allows all crawlers and names the AI crawlers explicitly.
  llms.txt has a factual summary. No third-party requests are made.
- **Speed.** Lighthouse mobile scored 100 in the fix pass (LCP 1.4 s). Live TTFB was 0.13–0.15 s
  from Munich. PageSpeed Insights wasn't re-run: the API quota was exhausted.

### Findings

Severity: **H** = hurts indexing or entity understanding now; **M** = clear gain; **L** = polish.

| #   | Sev     | Finding and evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Fix                                                                                                                                                                                                                                                                                                                                                               | Effort   |
| --- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| E1  | H       | **Not indexed, no webmaster properties.** `site:metz.uk` returns no documents on Google or DuckDuckGo.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Search Console + Bing Webmaster Tools + IndexNow (§5.3). The key file is a site change; see A2.                                                                                                                                                                                                                                                                   | —        |
| E2  | H       | **Host canonicalisation on the live server.** `https://www.metz.uk/` → 200 (a duplicate host); `http://metz.uk/` → **307** (temporary); `/work` → 200 instead of a redirect to `/work/`. `public/_headers` is Cloudflare syntax, and nginx doesn't apply it: no `Cache-Control` on `/_astro/*`, no CSP/HSTS. README/`wrangler.jsonc` describe Cloudflare, but the live server is nginx behind Coolify. Canonical tags limit the damage, but redirects are the stronger signal.                                                                                                                                                                                                                                                                                                                     | In Coolify/nginx (or the Caddy front): **301** www → apex, **301/308** http → https, **301** `/path` → `/path/`, and port `_headers` to the server config. Any Coolify-generated host (e.g. `*.sslip.io`) should redirect to metz.uk or send `X-Robots-Tag: noindex`. Re-run the curl checks from PRODUCTION-READINESS S3.                                        | S        |
| E3  | M       | **Google's renderer shows a blank first screen on `/`.** The Rich Results Test screenshot (Google Inspection Tool smartphone, 412×1744) is solid black except "DE". The rendered HTML ends as `<html class="js">`: the thread was switched on, then fell back. The H1 and all text are in the DOM, so they get indexed, but the visual render has no visible headline. Likely cause: the head script turns on `thread-on` whenever `WebGL2RenderingContext` exists (`src/components/home/Home.astro:31-40`); in Google's renderer the thread then starts, the name's opacity follows the timeline (`src/thread/main.ts:287`), and it falls back to the document layout (`src/thread/boot.ts:17-21`). The screenshot is taken in between. `?nothread` at the same viewport shows the name normally. | Keep the H1 and lede visible until the first frame has really drawn (`thread-ready`), or enter the thread layout only after `getContext("webgl2")` succeeds. **Don't** detect Googlebot and serve it something else: that edges towards cloaking. Verify with Search Console's URL Inspection live test.                                                          | S–M      |
| E4  | M       | **`sameAs` lists zenarios.com.** `src/data/person.ts:52` feeds into `src/lib/seo.ts:80`. `sameAs` means "the same entity". zenarios.com is a product and organisation, not him, so this blurs the two entities.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Remove it. Express the link as `MobileApplication.author` (already there) plus `founder`/`author` on zenarios.com's side (B6).                                                                                                                                                                                                                                    | XS       |
| E5  | M       | **`sameAs` and rel=me are incomplete.** Only GitHub, LinkedIn and GitLab are listed (`src/data/person.ts:41-50`; rel=me in `src/components/layout/SiteFooter.astro:35` and `AboutPage.astro:200`). Missing: the App Store developer page, Stack Overflow and npm.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Add them **after** each profile links back to metz.uk, so the links are reciprocal. Keep GitLab only once its website says metz.uk.                                                                                                                                                                                                                               | XS       |
| E6  | M       | **The about page's H1 is just "About" / "Über mich"** (`src/components/pages/AboutPage.astro:26`, `:39`). This is the entity home that AI engines and Google read as "the answer", but its H1 doesn't name him. The eyebrow already says "About".                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Make the H1 "Constantin Metz" (DE the same) and keep "About" as the eyebrow. The title is already good. The DE side needs his OK, though it's only the name.                                                                                                                                                                                                      | XS       |
| E7  | M       | **The three posts are `noindex` drafts** (`src/components/pages/PostPage.astro:41`, `src/layouts/Base.astro:74`), and both RSS feeds are empty. These are the most specific, quotable, bylined pages on the site (1,700–3,300 words each). Without them, AI engines have only short pages to cite.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | After his review (Appendix B corrections in PRODUCTION-READINESS), set `draft: false`, add `updated:` dates, and let them into the sitemap and RSS.                                                                                                                                                                                                               | His time |
| E8  | M       | **No accurate dates outside the posts.** The ProfilePage has no `dateCreated`/`dateModified`, which Google recommends (`src/lib/seo.ts:129-143`). The sitemap gets `lastmod` only from posts (`src/lib/pages.ts:166` → `src/pages/sitemap.xml.ts:27`), so **none of the 30 sitemap URLs has a lastmod**. Case-study WebPage nodes have no `dateModified`.                                                                                                                                                                                                                                                                                                                                                                                                                                          | Take the dates from `git log -1 --format=%cI` of each page's source files at build time. Keep them accurate: Google ignores a lastmod that always says "today".                                                                                                                                                                                                   | S        |
| E9  | L–M     | **Gaps in the Person node** (`src/lib/seo.ts:50-84`). No `givenName`/`familyName` (they help separate "Constantin" + "Metz" from "Konstantin Metz" and from the city). One 4:5 image, where Google recommends several, at 16:9, 4:3 and 1:1, each at least 50K pixels. No `identifier`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Add `givenName: "Constantin"` and `familyName: "Metz"`. Make `image` an array of three crops (extend `scripts/gen/portrait.mjs`). Add an optional `identifier` with a stable on-site ID.                                                                                                                                                                          | S        |
| E10 | L       | **No image-sitemap entry.** The portrait appears only on `/about/` and `/de/ueber-mich/`, and `sitemap.xml` has no `image:` namespace.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Add `<image:image><image:loc>https://metz.uk/constantin-metz.jpg</image:loc></image:image>` to both about URLs. Whether to show a small portrait on `/` is a design question for him (C5).                                                                                                                                                                        | XS       |
| E11 | L       | `og:type=profile` without `profile:first_name`, `profile:last_name` or `profile:username` (`src/layouts/Base.astro:92`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Add the three tags on profile pages                                                                                                                                                                                                                                                                                                                               | XS       |
| E12 | L       | App nodes have no `offers` (PRODUCTION-READINESS S4, still open). With 0 App Store ratings there's no software rich result either way.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Add `offers` (price 0, EUR) to Zenarios to quiet Search Console. Don't add ratings that don't exist.                                                                                                                                                                                                                                                              | XS       |
| E13 | L       | llms.txt is good but partial (`src/pages/llms.txt.ts:64-66`): no App Store developer page, no Stack Overflow, no date.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Add the full profile list and a "Last updated" line. Google says it doesn't use llms.txt, so treat it as a cheap extra, not a lever.                                                                                                                                                                                                                              | XS       |
| E14 | L (GEO) | **No question-shaped facts.** The about page has a strong lead and a facts list, but nothing in the form people ask AI engines.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | A short visible "In short" block on `/about/`: _Who is Constantin Metz? · What has he built? · Where is he based? · Is "Keimeno" the same person? · How to reach him._ Two sentences each, plain HTML. **No `FAQPage` markup**: Google limited FAQ rich results to government and health sites in 2023, and it adds nothing here. EN + DE; DE needs his approval. | S        |
| E15 | L       | Case-study page nodes (`WebPage`) have no `author`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Add `author: #person` on case-study pages                                                                                                                                                                                                                                                                                                                         | XS       |

**Checked, no action needed:**

- Canonicals, hreflang and x-default (verify-dist).
- Internal links: the nav reaches About, History, Work and Writing from every page.
- robots rules: no Cloudflare in front, so no "managed robots.txt" can override them. If a proxy
  or "bot protection" is added later, check it doesn't block GPTBot, ClaudeBot or PerplexityBot.
- The 404 status is correct, and the German 404 is served under `/de/`.
- Junk "backlinks" to metz.uk exist already: seo-checker and URL-shortener spam, the same set that
  points at every domain. Ignore them; **don't** use the disavow tool.

**Wikidata-style identifiers:** there's no QID, and none is recommended now (§5.4). The `sameAs`
list is the right place for identity links today.

---

## 5. Off-site plan (the bigger lever)

### 5.1 One identity, everywhere

Use the same block on every profile:

- **Name:** Constantin Metz. Never "Konstantin" or "C. Metz"; Keimeno only as the handle.
- **Photo:** the Roman-arch portrait (already the GitHub avatar).
- **Link:** `https://metz.uk/`, in the dedicated website field, not only in bio text.
- **One-liner (EN):** "Software engineer in Munich. I build products end to end; maker of
  Zenarios." This mirrors `PERSON.summary`. A German version needs his wording.

| Profile           | Change                                                                                                                                                                                                                                                                                                                                                      |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LinkedIn          | Website → `https://metz.uk/` (type "Personal" or "Portfolio"; replaces the GitHub link). Featured → metz.uk and the Zenarios case study. Keep the "Mercura (YC W25)" headline current.                                                                                                                                                                      |
| GitHub            | Website → metz.uk. Company → his current choice (it says Appfire; this is what Perplexity and getprog.ai repeat). Bio → the one-liner. Profile README → two lines with metz.uk above the metrics. Pin segno, word-growth-rate-analyzer and the Sequelize fork. On `zenariosapp`, add a description with "by Constantin Metz · metz.uk".                     |
| Stack Overflow    | Website keimeno.party → metz.uk. Display name "Constantin Metz" is his call: the profile is reasonably strong (2.6K) and SO profiles rank for names.                                                                                                                                                                                                        |
| GitLab            | Website → metz.uk; remove X `@_Keimeno`                                                                                                                                                                                                                                                                                                                     |
| npm               | `npm profile set fullname "Constantin Metz"` and `npm profile set homepage https://metz.uk`. Set `author` to "Constantin Metz (https://metz.uk)" on the next release of each package.                                                                                                                                                                       |
| App Store Connect | Developer name is right. Keep zenarios.com as the marketing URL, and link to metz.uk from zenarios.com.                                                                                                                                                                                                                                                     |
| Repos he controls | Add "by Constantin Metz · metz.uk" to the README of segno (also in the segno.js.org docs footer), word-growth-rate-analyzer and neojax. `personal-portfolio`: archive it, or set its homepage to metz.uk. When `Keimeno/metz.uk` goes public, set its homepage to metz.uk. (Clear the plain email in `src/data/{person,legal}.ts` first, as already noted.) |
| Optional: Bluesky | The handle **`@metz.uk`**, verified with a DNS TXT record, ties a social profile to the domain. Only worth it if he'll post. Mastodon would verify through the existing rel=me links.                                                                                                                                                                       |

### 5.2 Retire the old domains

- **monternos.net (his, IONOS):**
  - It still ranks #7 for his name with 2019–2020 content.
  - **301 every path to metz.uk:**
    - `/projects/oidc-server` and the LuminuNET panels → `/work/origins/`
    - `/projects/neojax` → `/work/`
    - everything else → `/`
  - Keep the domain at least a year so the redirect is processed, then let it lapse or keep it
    for redirects.
  - _Confirm it's his first._ The content and the copyright line say so.
- **keimeno.party:**
  - It has lapsed and **anyone can register it**, but GitLab, Stack Overflow and a GitHub repo
    still link to it.
  - Its real backlinks are worthless (spam directories), so re-registering it buys no ranking. The
    only argument for it is defensive: a squatter would inherit clicks from his profiles, and the
    name is one letter from a piracy site.
  - Primary fix: **remove every link to it** (§5.1).
  - Optional: register it for a year and 301 it to metz.uk. His decision and his money.
- **X `@_Keimeno`:** gone, so remove the links. Claim a new handle only if he wants X.

### 5.3 Search Console, Bing Webmaster Tools, IndexNow

1. **Google Search Console:**
   - Add a **domain property** with a DNS TXT record at Porkbun (metz.uk's nameservers).
   - Submit `https://metz.uk/sitemap.xml`.
   - URL Inspection → "Request indexing" for `/`, `/about/`, `/de/` and `/de/ueber-mich/`.
   - Check the Profile page and Breadcrumb reports, and run a live URL Inspection of `/` (E3).
2. **Bing Webmaster Tools:**
   - "Import from Google Search Console", then submit the sitemap.
   - Bing's index feeds DuckDuckGo, ChatGPT search and Copilot, which is where "Appfire" lingers.
3. **IndexNow:**
   - Generate a key and publish it as `public/<key>.txt` (site change A2).
   - After each deploy, POST the sitemap URLs to `https://api.indexnow.org/indexnow`.
   - It's a notification, not a guarantee, but Bing usually picks pages up within days.
4. **Cache warming:** once indexed, run LinkedIn Post Inspector on metz.uk (refreshes the share
   card) and Facebook's sharing debugger.

### 5.4 Wikidata and the knowledge panel

**Wikidata: don't create an item now.**

- The notability policy admits a person without a Wikipedia article only if they're "clearly
  identifiable" and "can be described using serious and publicly available references". His own
  site and profiles aren't independent, serious references.
- Items like that get nominated for deletion, and autobiographical creation is discouraged.
- An item is also a public, permanent, structured record of personal data that anyone can edit.
- **Revisit** once two or more independent sources describe him or Zenarios: press, a conference
  programme, a podcast page, a published review. The same applies to a Zenarios item.

**Knowledge panel.**

- Google builds person panels from its knowledge graph. The ingredients are:
  - a clear entity home (metz.uk, with Person markup and `sameAs`);
  - consistent profiles that link back;
  - mentions on independent sites.
- A panel might appear within months. It isn't guaranteed and can't be requested.
- If one appears: sign in, search his name, choose **"Claim this knowledge panel"** (Google's "Get
  verified on Google" page). Search Console ownership of metz.uk is one of the accepted ways to
  verify, which is one more reason to set it up now.

### 5.5 Backlinks and mentions that fit him

Each of these puts his name, a description and a link to metz.uk on an independent, indexed page.
Pages like that rank for the name and get cited by AI engines.

| Opportunity                                                                                                                                                                  | Why it fits                                                                                                                                                                             | Notes                                                                                                                       |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Show HN: the Thread** (e.g. "My personal site is one line of light, raw WebGL2, 27 KB"), then "How the Thread works" as a normal submission once published                 | A genuinely unusual, technically deep page. HN threads rank and get crawled by every AI engine.                                                                                         | One post, his own account, answer the comments. **No upvote requests** (voting rings get flagged and banned).               |
| **Web-design and WebGL galleries:** Awwwards, CSS Design Awards, The FWA, Godly, Siteinspire                                                                                 | Gallery entries are typically titled "metz.uk by Constantin Metz" and rank for the name; they also send real visitors and image results                                                 | Awwwards and CSSDA charge submission fees; check current terms. Links are often nofollow. The value is the indexed mention. |
| **Product Hunt launch of Zenarios** with his maker profile → metz.uk; an Indie Hackers product page                                                                          | Fresh app (released 14 Oct). Maker profiles rank for names, and launch pages rank for the product.                                                                                      | Don't recruit upvotes or reviews from friends (PH and App Store rules)                                                      |
| **Reddit:** r/webdev Showoff Saturday, r/GraphicsProgramming, r/webgl for the Thread; r/personalfinance-style subs only where self-promotion is allowed                      | Discussion threads get indexed and cited by Perplexity and ChatGPT                                                                                                                      | Follow each subreddit's self-promotion rules                                                                                |
| **Cross-posts** of the published posts on dev.to (`canonical_url` front matter), Hashnode ("originally published at") and Medium (import sets canonical)                     | Extra indexed author profiles; the canonical keeps metz.uk as the original                                                                                                              | Only **after** the posts are live on metz.uk. Without the canonical, the copy can outrank the original.                     |
| **A talk or podcast:** a Munich JS/React meetup talk on the Thread or the 1,000-futures engine; German dev podcasts (e.g. programmier.bar, Working Draft, Engineering Kiosk) | Speaker pages and episode notes are exactly the "serious, independent" references that later make Wikidata and a knowledge panel plausible                                              | Check which take guest pitches; don't name this list as fact                                                                |
| **Mercura**                                                                                                                                                                  | An engineering-blog post or team mention on mercura.ai would be strong. The YC company page lists founders only, and mercura.ai has no team page, so neither is a realistic link today. | Employer's call. Off-site, naming the employer is fine; the "employers only on /history" rule is for metz.uk.               |
| **Sequelize**                                                                                                                                                                | Already linked through the GitHub org's People page and AUTHORS                                                                                                                         | Nothing to ask for                                                                                                          |

### 5.6 Getting AI engines to know him (GEO)

- **Each engine retrieves from a different index:**
  - Bing: ChatGPT search, Copilot, DuckDuckGo.
  - Google: AI Overviews, AI Mode, Gemini.
  - Brave: used by Claude's search and others.
  - Perplexity: its own crawler plus others.

  Being indexed in Google **and** Bing covers most of it. Brave has no submission tool I could
  confirm; it finds sites through links, which is one more reason for §5.5.

- **The engines quote whatever is consistent across sources.** Today that's LinkedIn's job history
  and GitHub's "Appfire". Once LinkedIn, GitHub, metz.uk, zenarios.com and the App Store all say
  the same thing, the answers converge on it. For example: "Constantin Metz, self-taught software
  engineer in Munich, Mercura (YC W25), maker of Zenarios, handle Keimeno, metz.uk".
- **Quotable facts on his own pages** (E6, E7, E14): short declarative sentences with numbers and
  dates. The case studies already work this way ("38 countries' income tax", "1,000 market
  futures"). The posts would add depth.
- **Training data:** CCBot (Common Crawl) and the AI crawlers are allowed. Model knowledge lags
  6–18 months; retrieval-based answers update within weeks of indexing.
- **Aggregators:**
  - getprog.ai rebuilds from GitHub, so fixing GitHub fixes it.
  - RocketReach is a data broker. He can ask for erasure under GDPR Art. 17 (his choice; it also
    removes a stale "Appfire" source).
  - theorg.com lets people edit or remove their entry.

### 5.7 What to avoid

Each of these is spam, risks a penalty, or misrepresents him.

- **Buying links or trading them:** "SEO packages", PBNs, guest-post farms, mass directory
  submissions. All of it breaks Google's link-spam policy, and his link profile is so small that
  a few bad links would dominate it.
- **Keyword stuffing:** repeating "Constantin" or "Metz" in alt text or copy, or making doorway
  pages for "Constantin Metz Munich / Berlin / developer" variants.
- **Faking demand:** bot searches to seed autocomplete or "People also search for", click
  manipulation, upvote or review rings (HN, Reddit, Product Hunt, App Store).
- **Self-made Wikipedia or Wikidata entries** (§5.4).
- **Markup the page doesn't show:** FAQ or Q&A markup for invisible content, `aggregateRating`
  without real ratings, awards or affiliations that can't be verified.
- **Cloaking:** serving Googlebot a different version of the thread (E3). Fix the real page.
- **Misrepresentation:**
  - Say "maker" or "solo developer" of Zenarios.
  - Never imply he's a YC founder. He works at a YC W25 company; LinkedIn's "Mercura (YC W25)" is
    accurate.
  - Keep "Sequelize maintainers team, 2020–2021" exactly that.
  - The site's existing fact corrections (WGRA precision, review counts) are what lets "every
    claim survive an expert clicking through". The same goes for off-site bios.
- **Cross-posting without a canonical** (§5.5).

---

## 6. Prioritised action list

### A. Site changes (when he OKs a code pass)

| #   | Change                                                                                                                                                                                                                                                                | Findings             | Effort           |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | ---------------- |
| A1  | Server: 301 www → apex, 301 http → https, trailing-slash 301s, port `_headers` (immutable caching, CSP, HSTS), noindex or redirect any Coolify preview host; update the README "Deploy" section to match reality                                                      | E2                   | S                |
| A2  | IndexNow key file in `public/` + a post-deploy ping script                                                                                                                                                                                                            | E1                   | S                |
| A3  | JSON-LD: drop zenarios.com from `sameAs`; add App Store developer, Stack Overflow, npm (once they link back); `givenName`/`familyName`; three portrait crops as `image`; ProfilePage `dateCreated`/`dateModified`; `author` on case-study pages; `offers` on Zenarios | E4, E5, E9, E12, E15 | S                |
| A4  | About H1 → "Constantin Metz" (EN and DE)                                                                                                                                                                                                                              | E6                   | XS               |
| A5  | Accurate `lastmod` on every sitemap URL, from git; image entries for the portrait                                                                                                                                                                                     | E8, E10              | S                |
| A6  | Fix the blank first render in Google's renderer; verify with URL Inspection                                                                                                                                                                                           | E3                   | S–M              |
| A7  | "In short" Q&A block on `/about/` (EN + DE)                                                                                                                                                                                                                           | E14                  | S                |
| A8  | Publish the posts (`draft: false`) once he has reviewed them; RSS then fills itself                                                                                                                                                                                   | E7                   | XS once approved |
| A9  | `profile:*` OG tags; llms.txt profile list and date                                                                                                                                                                                                                   | E11, E13             | XS               |
| A10 | Optional: `scripts/seo/serp-log` helper, a CSV template for the weekly log in §7 (manual checks, no scraping)                                                                                                                                                         | §7                   | XS               |

### B. His off-site actions (in order)

| #   | Action                                                                                                                                                                                                                                                                                  | Time       |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| B1  | Search Console domain property (DNS TXT at Porkbun), submit sitemap, request indexing of the 4 profile pages                                                                                                                                                                            | 20 min     |
| B2  | Bing Webmaster Tools (import from Search Console) + IndexNow once A2 ships                                                                                                                                                                                                              | 15 min     |
| B3  | LinkedIn: website → metz.uk, Featured → metz.uk                                                                                                                                                                                                                                         | 10 min     |
| B4  | GitHub: website, bio, company, README lines, pins                                                                                                                                                                                                                                       | 15 min     |
| B5  | Stack Overflow, GitLab, npm: website/homepage → metz.uk; remove keimeno.party and `@_Keimeno` everywhere (incl. the `personal-portfolio` repo)                                                                                                                                          | 20 min     |
| B6  | zenarios.com: a "Made by Constantin Metz" footer link to `https://metz.uk/`, plus `founder` on the Organization and `author` on the MobileApplication as `{"@type":"Person","@id":"https://metz.uk/#person","name":"Constantin Metz","url":"https://metz.uk/"}` (zenarios-web `seo.ts`) | 30 min     |
| B7  | monternos.net → 301 to metz.uk (IONOS redirect or a small `.htaccess`)                                                                                                                                                                                                                  | 20 min     |
| B8  | Show HN for the Thread; gallery submissions                                                                                                                                                                                                                                             | 1–2 h      |
| B9  | Product Hunt launch for Zenarios with the maker profile → metz.uk                                                                                                                                                                                                                       | Half a day |
| B10 | Once posts are live: dev.to and Hashnode cross-posts with canonical links                                                                                                                                                                                                               | 1 h each   |
| B11 | Pitch one meetup talk or podcast                                                                                                                                                                                                                                                        | Ongoing    |
| B12 | Optional: GDPR erasure at RocketReach; update or remove theorg.com                                                                                                                                                                                                                      | 15 min     |

### C. Needs his input or decision

- **C1. monternos.net:** confirm it's his, and agree to redirect it.
- **C2. keimeno.party:** re-register defensively, or only remove the links?
- **C3. zenarios.com:** is he OK with the product site naming him (footer + JSON-LD)? It's
  already public on the App Store.
- **C4. The posts:** review and publish (E7). The Appendix B fact fixes are pending.
- **C5. The about page:** the H1 change and the German "In short" copy. Should a small portrait
  also appear on the home page? That's a design call.
- **C6. Stack Overflow:** display name "Keimeno" → "Constantin Metz"?
- **C7. GitHub:** what should the company field say?
- **C8. Social:** does he want Bluesky (`@metz.uk`), X or Mastodon at all? If not, drop them; no
  empty accounts.
- **C9. Outreach:** which of Show HN, galleries (paid or free), Product Hunt and podcasts is he
  comfortable with?
- **C10. Hosting:** confirm the target. The repo describes Cloudflare Workers; the live site is
  nginx behind Coolify. A1 depends on which one is final.

---

## 7. Measurement plan

**Weekly, Mondays, about 20 minutes. Log into a CSV (date, engine, query, position of each of his
properties, panel Y/N, AI answer notes).**

1. **Google Search Console → Performance → Search results**, last 7 days vs the previous 7:
   - Query filter (regex) `(?i)constantin|metz|keimeno|zenarios`.
   - Record clicks, impressions and average position per query.
   - Pages: `/` and `/about/`. Countries: DE, US, GB.
   - Also: Indexing → Pages (target: 30 of 30 indexed), Sitemaps (status, discovered count),
     Enhancements → Profile page and Breadcrumbs (valid items).
2. **Bing Webmaster Tools:** the same query report, plus IndexNow submissions accepted and pages
   crawled.
3. **A manual SERP snapshot** in a clean, logged-out browser profile (not automation: Bing serves
   junk to bots):
   - Google `hl=en&gl=de`, `hl=de&gl=de` and `hl=en&gl=us`; Bing; DuckDuckGo.
   - Queries: _Constantin Metz_, _Constantin Metz München_, _Constantin Metz software engineer_,
     _Constantin Metz Softwareentwickler_, _Constantin Metz Zenarios_, _Zenarios_, _Zenarios app_,
     _Keimeno_, _Keimeno GitHub_, _metz.uk_, _Constantin_, _Metz_.
   - Record the rank of metz.uk, LinkedIn and GitHub; how many of the top 10 are his; whether
     there's a knowledge panel; whether there's an AI Overview and whether it names him.
4. **AI answers.** The same six prompts in Perplexity, ChatGPT (search on), Google AI Mode,
   Gemini, Copilot and Claude (web search):
   - "Who is Constantin Metz?"
   - "Wer ist Constantin Metz?"
   - "Constantin Metz software engineer Munich"
   - "Who made the Zenarios app?"
   - "Who is Keimeno on GitHub?"
   - "What has Constantin Metz built?"

   Score each answer:
   - names him first (0/1);
   - cites metz.uk (0/1);
   - current facts right: Munich, current employer, Zenarios (0–3);
   - note any invention.

5. **Server logs (nginx in Coolify).** Weekly hit counts by user agent: Googlebot, bingbot,
   GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot,
   Perplexity-User, Applebot, CCBot.
   - User-triggered fetchers (ChatGPT-User, Perplexity-User, Claude-User) mean someone's AI answer
     just read his site.
   - Verify Googlebot and bingbot by reverse DNS; user agents are often spoofed.
   - The privacy page already says only the host's logs exist, so counting them is consistent with
     it.
6. **Monthly:**
   - The Search Console Links report (referring domains).
   - Google Alerts for "Constantin Metz" and "Zenarios" (free).
   - Whether the "Appfire" snippet has gone from DuckDuckGo and ChatGPT.
   - Re-run the Rich Results Test on `/` and `/about/`.

**Milestones to check against**

- **By 30 Oct 2026:** 30 of 30 pages indexed on Google; metz.uk on page 1 for "Constantin Metz".
- **By 27 Nov 2026:** metz.uk top 3 on Google (DE and US view) for "Constantin Metz", #1 for the
  city and role variants; metz.uk on page 1 on Bing and DuckDuckGo; Perplexity cites metz.uk.
- **By mid-January 2027:** metz.uk #1 or #2 for "Constantin Metz" with 5 or more of the top 10
  his; ChatGPT and DuckDuckGo no longer say "Appfire"; zenarios.com #1 for "Zenarios" on Google.
- **6–12 months:** possibly a knowledge panel, and models that know him without a search.

---

## 8. Honest expectations

- **The volume is tiny.** "Constantin Metz" gets fewer than about 10 searches a month. Winning it
  is about the right people (collaborators, recruiters, Zenarios users) finding the right page,
  not traffic. Most of them type something extra: "Munich", "Zenarios", "software". Those
  variants are the easiest wins.
- **Google often keeps LinkedIn at #1 for a person's name.** metz.uk at #1 or #2 with LinkedIn
  beside it is a good outcome. The point is that all of the top results are his and say the same
  thing.
- **Results differ by country.** In the US view, namesakes' Instagram and Facebook pages rank
  above him today. Signals that aren't tied to a place (links, consistent profiles) help
  everywhere; the German result is ahead.
- **Bing and DuckDuckGo move more slowly**, and they decide what ChatGPT says. Expect the
  "Appfire" description to linger for weeks after LinkedIn and GitHub are fixed.
- **"Constantin" and "Metz" on their own are out of reach** for an individual's site, now and for
  the foreseeable future. Plans that promise otherwise rely on tactics from §5.7.
- **A knowledge panel and a Wikidata item need independent coverage.** The talks, podcast and
  launch pages in §5.5 are the honest route to them, and they take months.
- **Some results he can't remove:** other people's profiles and newspaper pages stay. The aim is
  to outnumber and outrank them, not to erase them.

---

## 9. Status after the on-site pass (16 Oct 2026)

The site changes from §6A that needed no decision from him are in the repo:

| #       | What changed                                                                                                                                                                                                                                                                                                      |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A2      | IndexNow key file `public/18bf718c315c4196e00fdfdce6970e6e.txt`; `npm run indexnow` sends the live sitemap's URLs after a deploy (`-- --since 2026-10-16` for the changed ones only, `-- --dry-run` to look first). Not run yet: it needs the key file live.                                                      |
| A3      | Person: `givenName`/`familyName`; `image` is three crops (16:9, 4:3, 1:1, 1200 px wide, metadata stripped, from `scripts/gen/portrait.mjs`); zenarios.com is out of `sameAs`. Page nodes have `dateCreated`/`dateModified` from git; case studies name the Person as `author`; Zenarios has `offers` (free, EUR). |
| A4      | The about pages' H1 is "Constantin Metz"; "About"/"Über mich" stays as the eyebrow.                                                                                                                                                                                                                               |
| A5      | Every sitemap URL has a `<lastmod>`, from the git history of the files the page is made of (`src/lib/pages.ts`, `src/lib/dates.ts`); both about URLs list the portrait as an `image:image`.                                                                                                                       |
| A6      | E3 fixed; see below.                                                                                                                                                                                                                                                                                              |
| A7      | "In short" on `/about/` and `/de/ueber-mich/`: five questions, plain HTML, no FAQPage markup. The German needs his approval.                                                                                                                                                                                      |
| A9      | `profile:first_name`, `profile:last_name`, `profile:username` on the four profile pages; llms.txt lists all his profiles and has a "Last updated" line.                                                                                                                                                           |
| A1      | Not changed on the server: the config is ready in Appendix A.                                                                                                                                                                                                                                                     |
| A8, A10 | Not done (the posts wait for his review; the log helper is optional).                                                                                                                                                                                                                                             |

`npm run verify` now also checks the new parts: the Person's crops exist at their size, the
profile tags, the image sitemap, the IndexNow key, and, in a checkout with full history, a
`<lastmod>` on every URL.

**What the pass found that changes the plan**

- **E3 had a different cause.** Google's renderer grows the viewport once after load, to the
  page's height (up to about 12,140 px). The intro was `100lvh` tall with the name centred, so the
  name ended up about 5,000–6,000 px down. That happened in the thread layout and in the document
  fallback alike, and Google's screenshot shows only the top.
  - Reproduced in headless Chrome: 412×732, grown to 9,926 and 12,140 px, is black except "DE".
  - Keeping the H1 visible until the thread draws wouldn't have helped: the fallback was just as
    black.
  - The fix: the intro is at most 2.5 widths tall (`min(100lvh, 250vw)`). No real screen is that
    tall, so phones and monitors look the same as before. `verify-browser` checks it now.
  - After the deploy, confirm with Search Console's URL Inspection (live test).
- **The live 404 under `/de/` is the English one.** This corrects "Checked, no action needed" in
  §4: nginx serves `/404.html` for every miss. Appendix A fixes it.
- **Coolify deletes `.git` before every build** (`cleanup_git()` in its deployment job, and its
  "Clone depth" defaults to shallow as well). A build there has no history, so the pages ship
  without `lastmod` and without `dateCreated`/`dateModified`. The build log says
  `[dates] no git history`, and nothing is made up. Local builds have the dates. Two ways to ship
  them:
  - build where the history is, e.g. a CI job with full fetch depth that deploys `dist/`;
  - or commit a snapshot of the dates (a follow-up).
- **No new `sameAs` yet.** Checked on 16 Oct, none of the candidates links back to metz.uk:
  - the App Store developer page links to zenarios.com;
  - Stack Overflow links to keimeno.party;
  - npm's packages link to GitHub, and the profile itself is behind a bot check;
  - of the existing three, GitHub's website field is empty, LinkedIn's points to GitHub and
    GitLab's to keimeno.party (§2.7).

  The candidates are already listed in llms.txt and in `src/data/person.ts`, with
  `linksBack: false`. Set it to `true` once B4/B5 are done, and they join `sameAs`.

---

## Appendix A: nginx for Coolify (A1, ready to paste)

**Where it goes.** In Coolify, open the application, then Configuration → General → **Custom
Nginx Configuration**. Paste the config below, save, and **Redeploy**: Coolify copies the file into
the image at build time, so a restart keeps the old one. It replaces
`/etc/nginx/conf.d/default.conf` in Coolify's `nginx:alpine` image (inside the `http` block), which
today holds Coolify's default static config. That default is why `/work` answers 200 and every miss
gets the English 404.

**Two Coolify settings, so that nginx gets to answer.** Both of Coolify's own redirects are
temporary: the labels say `permanent=false`, and the live http → https answer today is a 302.

1. **Domains:** keep both `https://metz.uk` and `https://www.metz.uk`. Set the www **Direction** to
   _Allow www & non-www_, so www requests reach nginx, which answers with a 301.
2. **Advanced → Force Https: off.** Plain HTTP then reaches nginx too, which answers with one 301
   to `https://metz.uk`. HSTS keeps browsers on https afterwards.

If either stays on, the site still works; those redirects just stay temporary.

**Tested** in `nginx:alpine` (nginx 1.31.7, the version metz.uk runs) against this build, with the
Host and X-Forwarded-Proto that Coolify's proxy sends:

| Request                                                                            | Answer                                                                                       |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `http://www.metz.uk/about/`, `https://www.metz.uk/about/`, `http://metz.uk/about/` | 301 → `https://metz.uk/about/`, query string kept                                            |
| `/work`, `/de`, `/work/zenarios?x=1`                                               | 301 → `/work/`, `/de/`, `/work/zenarios/?x=1` (relative, so scheme and host stay)            |
| `/index.html`, `/de/index.html?a=1`                                                | 301 → `/`, `/de/?a=1`                                                                        |
| `/nope/`, `/_astro/missing.js`, `/_astro/`                                         | 404, English 404 page                                                                        |
| `/de/nope`, `/de/anything/`                                                        | 404, German 404 page                                                                         |
| `/_astro/*`                                                                        | `Cache-Control: public, max-age=31536000, immutable`                                         |
| `/og/*`, `/media/*`, portrait, favicons, icons, manifest                           | `public, max-age=86400, stale-while-revalidate=604800`                                       |
| Pages, sitemap, feeds, llms.txt, the IndexNow key, 404s, redirects                 | `public, max-age=0, must-revalidate` (Cloudflare's default; `_headers` had no rule for them) |
| Every response, 404s and 301s included                                             | CSP, HSTS, `nosniff`, Referrer-Policy, Permissions-Policy, COOP                              |
| Any host but metz.uk (the sslip.io address, a preview, the bare IP)                | `X-Robots-Tag: noindex`                                                                      |
| `site.webmanifest`                                                                 | `application/manifest+json` (nginx's table lacks it)                                         |

**Keep in mind**

- **The CSP pins the hashes of the three inline scripts in this build.** After a change to an
  inline script (the home page's head script, the `js` class, the email link), paste the CSP line
  from `dist/_headers` into the config again:
  `npm run build && grep Content-Security-Policy dist/_headers`. Otherwise the browser blocks that
  script.
- **Every `add_header` sits at server level on purpose.** nginx drops all inherited `add_header`
  lines in any block that has one of its own. A `location` that adds a single header would
  silently lose the CSP and HSTS. Vary headers through a `map`, as Cache-Control does here.
- **Logs and the privacy page.** The page says server logs are deleted after at most 7 days. With
  `access_log off` there is no access log on the application's side, so that holds. Two other
  places can hold visitors' IP addresses: Coolify's Traefik proxy writes an access log only if
  _Traffic analytics_ is switched on for the server (it is off by default; keep it off, or the
  proxy keeps up to six files of 20 MB, by size, not by time); and OVH's network. Check the first
  in Coolify under Servers → Proxy.
- **Compression stays with Coolify's proxy** (its gzip middleware), as today.
- **After deploying,** re-run the curl checks from PRODUCTION-READINESS S3 and the rows above
  against the live site, then `npm run indexnow`.
- **Moving back to Cloudflare** (C10) makes this appendix moot: `public/_headers` and
  `wrangler.jsonc` already cover the same ground there.

```nginx
# metz.uk on Coolify: paste into the application's Configuration → General → "Custom Nginx
# Configuration", save, then Redeploy (a restart keeps the old image; Coolify bakes this file in).
# It replaces /etc/nginx/conf.d/default.conf in Coolify's nginx:alpine image, inside the http block.
# TLS ends at Coolify's proxy, which passes the original Host and X-Forwarded-Proto along.

# Plain HTTP that reached nginx (Force HTTPS off in Coolify) gets one 301 to https://metz.uk.
map $http_x_forwarded_proto $metz_plain_http {
    default 0;
    http    1;
}

# Any host but metz.uk (Coolify's sslip.io address, a preview, the bare IP) stays out of search.
# www.metz.uk never gets this far: it is redirected below.
map $host $metz_robots {
    default "noindex";
    metz.uk "";
}

# The cache rules of public/_headers, by path. Everything else (pages, sitemap, feeds, llms.txt)
# is checked with the server on every request, as Cloudflare does by default.
map $uri $metz_cache {
    default         "public, max-age=0, must-revalidate";
    ~^/_astro/      "public, max-age=31536000, immutable";
    ~^/(og|media)/  "public, max-age=86400, stale-while-revalidate=604800";
    ~^/(constantin-metz\.jpg|favicon\.svg|favicon\.ico|apple-touch-icon\.png|icon-[^/]+\.png|site\.webmanifest)$
                    "public, max-age=86400, stale-while-revalidate=604800";
}

server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;
    charset utf-8;
    server_tokens off;
    # No access log, and the error log only for real failures. The privacy page promises that
    # server logs are kept at most 7 days; Docker's own log rotation (Coolify installs 10 MB x 3
    # files per container) is by size, not time, so on a quiet site it keeps lines for months.
    # nginx also logs every missing file at "error" level, with the visitor's IP, hence "crit".
    access_log off;
    error_log stderr crit;
    # nginx's own redirects (/work → /work/) keep the browser's scheme and host.
    absolute_redirect off;

    # One address per page: www → apex, http → https, /index.html → the folder. One 301 each.
    if ($host = "www.metz.uk") {
        return 301 https://metz.uk$request_uri;
    }
    if ($metz_plain_http) {
        return 301 https://metz.uk$request_uri;
    }
    if ($request_uri ~ "^([^?]*/)index\.html(\?.*)?$") {
        return 301 $1$2;
    }
    # Renamed projects (October 2026): the old case-study addresses move with them.
    location ~ ^/(work|de/projekte)/lexicon-bluff/?$ {
        return 301 /$1/stet/;
    }
    location ~ ^/(work|de/projekte)/carcost/?$ {
        return 301 /$1/unterm-strich/;
    }

    # Every header is set here, once, with "always" so 404s and redirects get them too. nginx drops
    # all inherited add_header lines in any block that has one of its own, so no location below
    # adds any: Cache-Control varies through the map above instead. An empty value sends nothing.
    # The CSP's hashes come from the build: after changing an inline script, paste the line from
    # dist/_headers again (npm run build && grep Content-Security-Policy dist/_headers).
    add_header Content-Security-Policy "default-src 'none'; script-src 'self' 'sha256-X6ipAfo8be306uNG8vVIuXCJnLUvN4P9klTuGBGbt4s=' 'sha256-ZnYJX5ypMaaAhxxWhSEjbMkhO2A9yPmbzEQH3LFaITA=' 'sha256-ziFtF+VTvOjGJn81xYTfZZUX4VD3p9j07rpUVHhNhsQ='; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'; upgrade-insecure-requests" always;
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" always;
    add_header Cross-Origin-Opener-Policy "same-origin" always;
    add_header Cache-Control $metz_cache always;
    add_header X-Robots-Tag $metz_robots always;

    # A file, or a folder's index.html. A folder asked for without its slash gets a 301 to it
    # (nginx does that for "$uri/"). Nothing falls back to the home page: a miss is a 404.
    location / {
        try_files $uri $uri/ =404;
    }

    # The 404 page in the visitor's language, with status 404; a folder without an index.html
    # (/_astro/) is a 404 too, not a 403.
    error_page 403 404 =404 /404.html;
    location /de/ {
        error_page 403 404 =404 /de/404.html;
        try_files $uri $uri/ =404;
    }
    location = /404.html {
        internal;
    }
    location = /de/404.html {
        internal;
    }

    # nginx's MIME table has no .webmanifest. (A "types" block here would replace the whole table.)
    location = /site.webmanifest {
        default_type application/manifest+json;
    }
}
```
