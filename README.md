# metz.uk

The personal site of Constantin Metz. Static [Astro](https://astro.build) site in English and German;
the home page is "The Thread", one line of light that the scroll drives through every project.

## Run it

Needs Node 22.12 or newer.

```bash
npm install
npm run dev       # http://localhost:4321
npm run check     # type-check .astro and .ts files
npm run build     # static site in dist/ (plus the CSP hashes in dist/_headers)
npm run verify    # checks dist/, then the built site in headless Chrome (see below)
```

`npm run verify` runs two scripts. `verify:dist` reads the files: hreflang, canonicals, one h1,
links, content rules, SEO, no plain email, no GPS in images, a CSP covering every inline script,
and font coverage. `verify:browser` loads every page in headless Chrome (Google Chrome, or
`CHROME=/path`), served the way Cloudflare will serve it. It checks that no page is wider than a
390 or 320 px phone, that the home page's name stays on its first screen when a crawler grows the
viewport to the page's height, that the thread exposes the same headings as `?nothread`, find and
Tab, and that a lost WebGL context leaves the full document.

## Deploy

Cloudflare Workers, static assets only: `wrangler.jsonc` serves `dist/`, `public/_headers` holds the
security and cache headers. Nothing here deploys by itself.

After a deploy, `npm run indexnow` tells Bing and the other IndexNow engines what changed
(`-- --since 2026-10-16` for pages changed since then, `-- --dry-run` to see the request first).
Its key is `public/<key>.txt`.

The sitemap's `<lastmod>` and the pages' `dateModified` come from the git history of each page's
files (`src/lib/pages.ts`). A build without the history (no `.git`, or a shallow clone) leaves them
out and says so in the log.

## Languages

Every page exists twice: English at `/`, German at `/de/` with German slugs.

- `src/i18n/routes.ts`: the route map (`work` → `/work/` and `/de/projekte/`, …). Canonicals,
  hreflang (en, de, x-default = en) and the language switch all come from it.
- `src/i18n/ui.ts`: interface strings. The German table must have exactly the English keys
  (a type error otherwise). `src/i18n/home.ts`: the home page's panel copy, same rule.
- `src/content/{projects,posts}/<id>/{en,de}.mdx`: case studies and posts. `src/lib/content.ts`
  pairs them and fails the build if a language is missing or a project isn't in
  `src/data/projects.ts` (years, links, colour, station).
- `src/data/history.ts`: the history timeline (the only place employers are named; `npm run verify`
  fails if one shows up anywhere else).

## The home page

`src/components/home/Thread.astro` is all real HTML. With the thread running (`html.thread-on`) the
sections only provide scroll length and the text sits in fixed layers over the canvas. Without it
(no JS, reduced motion, Save-Data, no WebGL2, or before it has loaded) the same markup reads as an
ordinary document; the intro is identical in both, so nothing moves when the thread starts.

| URL parameter on `/` or `/de/` | What it does |
| --- | --- |
| `?nothread` / `?thread` | Turns the thread off / on even with reduced motion |
| `?debug` | Timeline scrubber, frame-time graph, quality tier |
| `?t=2.4` | Scrolls to that point of the timeline (in beats) |
| `?hold=2.4` | Holds the timeline there without scrolling (design review, headless renders) |
| `?freeze` | No clock-driven motion: for screenshots |
| `?tier=high\|mid\|low` | Forces a quality tier |
| `?skip=dust,fan,thread,sparks,nib` | Leaves layers out, for debugging |

Headless renders (work even when no browser window is visible):

```bash
OUT=/tmp/shots BASE=http://localhost:4321/ node scripts/dev/cdp-shots.mjs 1440 900 1 0 desk 2.85 9.5
OUT=/tmp/shots BASE=http://localhost:4321/de/ node scripts/dev/cdp-shots.mjs 390 844 2 1 phone 2.85
```

## How the thread is built

- `src/thread/beats.ts` + `timeline.ts`: every cue, in beats (one beat = one viewport of scrolling);
  each station module in `src/thread/stations/` states its own cues and figure.
- `src/thread/scene.ts`: the whole thread in world space, rebuilt each frame from the timeline.
- `src/thread/camera.ts`: hold poses fitted to a screen frame, eased between with a Hermite spline.
- `src/thread/renderer.ts` and `gl/`: raw WebGL2, one screen-space ribbon shader for every line,
  glow in the fragment shader, an instanced draw for the 1,000 futures, bloom on strong GPUs.
- `src/thread/sync.ts`: panels, labels and the app screenshot kept in step with the picture.
- `src/thread/boot.ts`: loads the thread after the page has painted, and not at all with reduced
  motion, Save-Data or no WebGL2.

## Data and generated files

- `src/generated/zenarios*.json`: real Zenarios engine output for the app's example household
  (`scripts/gen/zenarios.mjs`, needs the app repo).
- `data/sources/paperscores/scorecard.json`: a real, anonymised PaperScores scorecard.
- `public/media/thread/*.webp`: stills of each station, rendered from the thread itself
  (`npm run gen:stills` with the dev server running). Used on the case studies and the work page.
- `src/assets/fonts/`: Geist and Geist Mono cut down to the characters the site uses, from the
  upstream variable fonts in `data/sources/fonts/` (OFL-1.1). After adding text with new
  characters, `npm run verify` says so: `npm run build && node scripts/gen/fonts.mjs` (needs `uv`).
- The favicon set (`npm run gen:icons`) and the Zenarios phone picture in AVIF and WebP
  (`node scripts/gen/phone.mjs [source]`; a source 960 px or wider adds 2× files).
- `data/sources/portrait/`: the portrait original. It carries GPS, so it is git-ignored; it never
  ships (`node scripts/gen/portrait.mjs` makes the stripped copies).

## Still to drop in

- `public/constantin-metz.jpg`: the portrait (about 4:5; set its size in `src/data/person.ts`).
- The c/o address and the host details in `src/data/legal.ts` (marked TODO on the pages).
- `public/media/keimeno-party-2020.webp` (1600 × 1000): a screenshot of the 2020 site, for /history/.
- Posts are drafts (`draft: true`): shown with a banner, `noindex`, and left out of RSS.
