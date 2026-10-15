# metz.uk: production-readiness review

Review date: 16 October 2026. Scope: the build in `dist/` from `npx astro build` (37 pages), served by `astro preview` on port 4323. This is a read-only review: no site code or content was changed.

## Summary

The foundation is unusually good for a pre-launch site:

- Lighthouse scores 99–100 for performance on every page tested, with CLS 0.000.
- No page makes a third-party request.
- The email address never appears in plain text in `dist/`.
- Every image in `dist/` is free of personal metadata.
- `astro check` and `npm run verify` pass.
- Even at 6× CPU throttling, the thread's JavaScript costs under 6 ms per frame (p90).

What stands between this and launch is mostly a handful of real bugs, plus decisions only Constantin can make.

**Launch-blockers (9)**

| # | Area | Problem |
|---|---|---|
| 1 | Layout | 14 of 36 pages scroll sideways on phones. Every case study and post with a code block is affected, Zenarios included (E4). |
| 2 | Accessibility | With the thread on, screen readers, the Tab key and find-in-page can't reach any station text or link (A1). |
| 3 | Robustness | A lost WebGL context, which iOS Safari causes in background tabs, leaves the home page blank (R1). |
| 4 | Legal | The legal pages show TODO placeholders (C1). |
| 5 | Content | All three posts are drafts, yet they are linked everywhere and the RSS feeds are empty (C2). |
| 6 | Content | Several claims are false or overstated today: "PaperScores is offline", "a replay" on the home page, the CONSORT mapping, and "one sign-in for … the game" (C3). |
| 7 | Privacy | The GPS-tagged portrait original isn't git-ignored, and the repo is planned to be public (X1). |
| 8 | Engineering | There is no git repository (E1). |
| 9 | Security | There are no security or cache headers and no Cloudflare deploy configuration (X2). |

**Should-fix items (about 35, plus the copy fixes in the appendices).** Main themes:

- Phones: landscape layout, rotation and very narrow screens.
- The canvas keeps rendering after it is scrolled out of view.
- Fonts aren't subset and the hero image isn't optimised.
- The favicon set, a German 404 and print styles are missing.
- There are no tests and no CI.
- German copy polish.
- Thin case studies with no screenshots.

**Needs Constantin's input:**

- the c/o address
- host, data processing agreement and log-retention details
- publish or hide the posts
- approval of the German copy
- the PaperScores link
- which OIDC clients really existed
- whether the LiveTranslate caption is real output
- a WGRA export, if the home page should show a real cascade
- the `key-redeem-feedback` SQL dump
- the licence
- whether sound ships at launch

Findings are numbered by area: P performance, R robustness, A accessibility, C content, S SEO and sharing, X security and privacy, E engineering, L polish. Each has a severity (**launch-blocker**, **should** or **nice**) and an effort (S = under 2 h, M = up to a day, L = more).

### How this was measured

- **Lighthouse 12.8.2** with its standard mobile (simulated slow 4G, 4× CPU) and desktop presets, against `astro preview`. The preview server compresses, but it has no CDN and no TLS.
- **Headless Chrome over CDP** with Metal GPU, using throwaway scripts that are not in the repo:
  - CPU throttling via `Emulation.setCPUThrottlingRate`
  - a scripted 12 s scroll through the whole thread
  - draw-call counters wrapped around `WebGL2RenderingContext`
  - Event Timing for taps
  - `Accessibility.getFullAXTree` for the screen-reader view
  - `WEBGL_lose_context` to simulate context loss
- **Screenshots** of every path, at viewports from 280 to 3440 px.
- **fontTools** for a real subsetting measurement.
- **Three read-only fact-check passes** over the source repos plus `gh api`, and a content review of every EN/DE file. Details are in Appendices A and B.
- **What this can't tell you:** CPU throttling doesn't slow the GPU, so none of this proves frame rates on an iPhone 11 or SE. A real-device pass is still needed (item P7).

---

## 1. Performance

### Measurements

**Lighthouse** (simulated mobile and desktop presets). On `/writing/how-the-thread-works/`, SEO is 66 only because the draft is `noindex`, and accessibility is 96 because of the code colours (A5). Every other category scores 100.

| Page | Mobile perf | Mobile LCP | TBT | CLS | Transfer | Desktop perf | Desktop LCP |
|---|---|---|---|---|---|---|---|
| `/` | 99 | 2.10 s | 16 ms | 0 | 228 KB | 100 | 0.44 s |
| `/de/` | 99 | 1.80 s | 8 ms | 0 | 228 KB | 100 | 0.40 s |
| `/work/zenarios/` | 100 | 1.80 s | 0 | 0 | 143 KB | 100 | 0.41 s |
| `/writing/how-the-thread-works/` | 100 | 1.21 s | 0 | 0 | 69 KB | 100 | 0.29 s |
| `/about/` | 100 | 1.35 s | 0 | 0 | 95 KB | 100 | 0.33 s |

What `/` transfers (gzip):

| Resource | Size |
|---|---|
| HTML | 7.5 KB |
| CSS (two files) | 7.7 KB |
| Fonts (two files) | 53 KB |
| Boot script | 1.6 KB |
| Thread chunk | 28 KB |
| Zenarios JSON | 54 KB |
| `zenarios-overview.jpg` | 80 KB |

That is within the plan's 300 KB budget. The mobile LCP of 2.10 s misses the plan's 2.0 s target. The LCP element is the `<h1>`; 79 % of its time is render delay behind two blocking stylesheets.

**The thread**

The "Ready" column is the time from navigation to the first thread frame on the local server. "Init task" is the longest task during start-up. Frame times are uncapped (`--disable-frame-rate-limit`), so they measure the work per frame rather than vsync.

| Viewport | CPU | Tier | Ready | Init task | Scroll frame p50 / p90 / p99 | Draws per frame |
|---|---|---|---|---|---|---|
| 1440×900 @2 | 1× (cold profile) | high | – | 230 ms | 1.6 / 2.7 / 3.3 ms | 13 |
| 1440×900 @2 | 4× | high | 425 ms | 142 ms | 1.9 / 4.0 / 5.5 ms | 13 |
| 1440×900 @1 | 6× | low (forced) | 781 ms | 220 ms | 2.0 / 4.8 / 6.7 ms | 6 |
| 390×844 @3 | 4× | mid (auto) | 440 ms | 163 ms | 1.3 / 3.0 / 4.4 ms | 6 |
| 390×844 @3 | 6× | mid (auto) | 570 ms | 199 ms | 2.6 / 5.4 / 7.3 ms | 6 |
| 390×844 @3 | 6× | low (forced) | 551 ms | 189 ms | 2.5 / 5.5 / 8.8 ms | 6 |

A CPU profile of start-up at 6× shows nothing dominant:

| Function | Self time |
|---|---|
| shader compile | 21 ms |
| scene build | 12 ms |
| per-frame `render` | 74 ms over 5 s |
| `FrameMonitor.percentile` | 18 ms |
| garbage collection | 19 ms |

Taps that land during the init task:

| CPU | Event duration | Of which input delay |
|---|---|---|
| 4× | 88–144 ms | 46–99 ms |
| 6× | 104–160 ms | 69–114 ms |

These are inside "good" INP (under 200 ms), but not by much. The plan's Gate 1 budget for init was 300 ms or less, so it passes.

### P1. The home page loads an 80 KB JPEG at high priority that nobody sees for three screens
**should** · effort S
- **Evidence:**
  - In Lighthouse's network list for `/`, `/media/zenarios-overview.jpg` has priority High and starts at 36 ms.
  - The phone `<img>` has `loading="lazy"` (`src/components/home/Thread.astro:110`). With the thread on, though, the plane sits in a `position: fixed` layer inside the viewport, so lazy-loading never defers it.
  - Lighthouse estimates 49 KiB saved with a modern format.
  - On `/work/zenarios/` the same 480×1020 JPEG is the LCP element (1.8 s) and looks soft at 300 CSS px on 3× screens.
- **Fix:**
  - Encode AVIF and WebP with a 2× source, using `astro:assets` `<Picture>` or the sharp script pattern already used in `scripts/gen/portrait.mjs`.
  - On the home page, give the `<img>` a `data-src` and set `src` when the `zen.title` cue starts (`sync.ts` already knows), or at least `fetchpriority="low"`.

### P2. Two render-blocking stylesheets on every page; the mobile LCP on `/` is 2.10 s
**should** · effort S
- **Evidence:**
  - Lighthouse `render-blocking-resources` flags `Base.*.css` (9.8 KB raw) and `Home.*.css` (21 KB raw), with an estimated 450 ms saving on mobile. On a case study it is `Base` plus `CaseStudy`, 420 ms.
  - The cause is `build.inlineStylesheets: "auto"` in `astro.config.mjs:10`.
- **Fix:**
  - Set `inlineStylesheets: "always"`. That costs about 8 KB gzip per page and saves one round trip.
  - Re-run Lighthouse; the `<h1>` LCP should drop under 2.0 s.
  - Cross-page CSS caching is worth little on a site this size.

### P3. Fonts aren't subset, and the arrows fall back to a system font
**should** · effort S
- **Evidence:**
  - Every page preloads `geist-latin-wght-normal.woff2` (29,400 B) and fetches `geist-mono-latin` (23,128 B).
  - The site uses 132 distinct glyphs, counted over all of `dist/`. Subsetting both files to those with `pyftsubset` (keeping kern, liga, calt, tnum and case) gives **19,264 B and 14,440 B**, a saving of **19 KB (−36 %)** on every first visit.
  - The plan asked for "subset to Latin plus äöüß„"–—€", and that wasn't done.
  - Neither shipped file contains → (U+2192) or ↗ (U+2197), which every CTA and external link uses. They render from Apple Symbols or Segoe UI, at a different weight and baseline from Geist.
- **Fix:**
  - Add a `scripts/gen/fonts.mjs` step that subsets the full Geist and Geist Mono variable fonts to the glyphs found in `dist/`, plus A–Z, the digits and the scramble glyphs.
  - Include the arrows if Geist has them; if not, draw the arrows as a 1 em inline SVG.
  - Self-host the result with a hashed name and preload both files, since the mono kicker is above the fold.

### P4. The thread renders every frame even when nothing can be seen
**should** · effort S–M
- **Evidence:**
  - Scrolled to the footer, with the curtain covering the canvas: **8,600 draw calls per second** (uncapped). Idle at a station: the same.
  - On a real device that means every vsync (60 or 120 Hz), at 2880×1800 with bloom on a laptop.
  - In `main.ts`, `tick()` always schedules the next frame (`main.ts:216-218`). Only `visibilitychange` pauses it (`:311-319`).
- **Fix:**
  - Stop the loop while `thread-past` is set. `Home.astro:60-68` already has the IntersectionObserver for this.
  - When the timeline, pointer, write-on and glint have all been still for about 1.5 s, either stop rendering or drop to about 20 fps for the drift and dust.
  - Restart on `scroll` or `pointermove`. This is the "doesn't drain my battery" polish reviewers notice in Activity Monitor.

### P5. One 130–230 ms task at start-up
**nice** · effort S
- **Evidence:** the long tasks in the thread table above, and the tap delays listed with it.
- **Fix:**
  - Use `KHR_parallel_shader_compile` when it is available, and poll `COMPLETION_STATUS_KHR` instead of blocking on `LINK_STATUS`.
  - Yield (`await new Promise(requestAnimationFrame)` or `scheduler.yield()`) between compiling, building the scene and the first frame.

### P6. The frame watchdog sorts an array every frame
**nice** · effort S
- **Evidence:** once warmed up, `FrameMonitor.struggling()` → `percentile(0.9)` (`src/thread/quality.ts:54-65`) runs `Array.from` plus `sort` over 120 floats on every frame: 17.6 ms self time and GC churn in 5 s at 6×.
- **Fix:** keep a running count of frames over 18 ms in the ring buffer instead.

### P7. No measurement on real phones yet
**should** · effort M (mostly Constantin's time with devices)
- **Evidence:**
  - Gate 1 asked for at least 50 fps on an iPhone 13 and at least 30 fps on an iPhone SE or 11.
  - Everything above runs on an M-series GPU. CPU throttling shows the JavaScript is cheap, but not that an A13 GPU can fill 780×1688 with the 512-line fan.
- **Fix:**
  - Use Safari Web Inspector, Timelines → Rendering Frames, on an iPhone 11 or SE (2nd gen) and on a mid-range Android in Chrome, with `?debug` on (it shows tier, render scale and p90).
  - Check that the watchdog steps down rather than flapping.

### P8. No caching strategy yet
**should** · effort S (part of X2)
- **Evidence:** there is no `public/_headers`. The proposed rules are below.
- **Fix:**
  - `/_astro/*` (hashed): `public, max-age=31536000, immutable`
  - HTML: Cloudflare's default revalidation (`max-age=0, must-revalidate` with an ETag)
  - `/og/*`, `/media/*`, `/constantin-metz.jpg` (stable names): `public, max-age=86400, stale-while-revalidate=604800`
  - Because OG and still filenames never change, add `?v=<content hash>` to `og:image`, so LinkedIn and Slack refetch after an edit (see S7).

---

## 2. Robustness

**Checked and working:**
- **No JS:** the whole document renders and reads well on desktop and phone.
- **`?nothread` and reduced motion:** they produce the same complete document (12 panels, 14 headings).
- **Back/forward cache:** the page is restored, a JavaScript marker survived, and Chrome reported no blocking reasons.
- **Keyboard scrolling:** Space, PageDown and End drive the thread correctly.
- **Short desktop windows:** 1280×520 composes fine.

### R1. A lost WebGL context leaves the home page blank and drops the reader somewhere else
**launch-blocker** · effort S (fallback) / M (real restore)
- **Evidence:** I lost the context with `WEBGL_lose_context` while at Signals. `stop()` (`src/thread/main.ts:321-337`) removes `thread-on`, but:
  - 11 of 12 panels keep the inline `visibility: hidden; --v: 0` that `sync.ts:126` wrote, so the document version is empty except one panel. Labels keep `opacity: 0`.
  - The PaperScores score shows "0", because the counter text was overwritten (`sync.ts:131-137`).
  - The page height drops from 17,395 to 8,041 px, and the reader lands at y = 4,878, an unrelated place. From Origins it lands next to the footer (screenshot `ctx-after.png`).
  - `thread-past` stays set.
  - iOS Safari reclaims WebGL contexts in background tabs under memory pressure, so "come back to the tab" is a realistic way to trigger this.
- **Fix:**
  - In `stop()`, clear every inline style that `DomSync` and `Chrome` set (`visibility`, `opacity`, `--v`, `transform`), restore the counters' server-rendered text, and remove `thread-past`.
  - Then scroll the current station's `<section>` into view, the reverse of `readingPlace()`.
  - Better still: because `preventDefault()` is already called, listen for `webglcontextrestored` and rebuild the renderer's GL resources so the thread just continues.
  - Add an e2e test for both cases (see E3).

### R2. Rotating a phone loses the reader's place
**should** · effort S
- **Evidence:** in portrait at y = 2,701 (the fan panel), then landscape (the station is kept), then portrait again: y = 1,247, which is t ≈ 1.5 between the intro and Zenarios, with no panel showing (`rot-back.png`). `resize()` (`main.ts:148-164`) re-measures sections but keeps the pixel scroll position, not the timeline position.
- **Fix:** read `timeline.value` before re-measuring, then `scrollTo({ top: timeline.scrollFor(t), behavior: "instant" })` and `timeline.snap()` afterwards.

### R3. Direct anchors land on an empty frame, and chapter links never change the URL
**should** · effort S
- **Evidence:**
  - `/#signals` lands exactly at the start of the station, y = 4,320, with 0 of 12 panels visible: a dark screen with a line (`anchor-signals.png`).
  - Chapter clicks call `preventDefault()` (`src/thread/chrome.ts:25-28`), so there is no shareable deep link to a station.
- **Fix:**
  - On start, if `location.hash` names a station, call `jumpTo(stationStart(id) + 0.62)`.
  - On a chapter click, `history.replaceState(null, "", "#" + id)`.
  - Handle `hashchange`.

### R4. No print styles; the home page prints 20 blank pages
**should** · effort S
- **Evidence:**
  - There is no `@media print` anywhere in `src/`.
  - Printing `/` with the thread on gives 20 PDF pages of dark background with all 12 panels hidden.
  - Case studies print as 7 pages. Their light-on-dark colours are left to the browser: Chrome darkened some text in my PDF, and with "background graphics" on they print dark.
- **Fix:**
  - In `global.css`, add an `@media print` block: white background, ink text, hide the canvas, header, progress bar and curtain gradient, and print external link URLs after links.
  - For the home page, force the document layout under print, for example `@media print { html.thread-on .station__layer { position: static … } }`, or toggle the layout on `beforeprint`/`afterprint`.
  - About, History and the case studies are the pages most likely to be printed.

### R5. Landscape phones and short windows: a panel collides with the chapter list
**should** · effort S
- **Evidence:**
  - At 844×390 the chapter list shows (width over 760 and landscape), and the vertically centred panel is taller than the room it has.
  - The kicker "1,000 FUTURES" overlaps "03 PaperScores 04 Origins" (`rot-landscape.png`).
- **Fix:**
  - `@media (max-height: 520px)`: hide `.chapters`, shrink the panel's `h2` and body, and anchor the panel below the header instead of `top: 50%; translate: 0 -50%`.

### R6. Very narrow screens: the `<h1>` is wider than the screen
**should** · effort S
- **Evidence:**
  - `.intro__name` is `white-space: nowrap` with `font-size: clamp(44px, 9.2vw, 156px)` (`Thread.astro:437-443`).
  - At 280 px (a folded Galaxy Fold) the `<h1>` and the lede reach 296 px.
  - At 320 px the drawn name touches the right edge (`vp-se1-0.01.png`).
- **Fix:** `font-size: clamp(34px, 12vw, 156px)`, or allow it to wrap below 340 px. The thread measures the real `<h1>`, so it follows.

### R7. On a stalled network, the stations stay invisible for up to 10 s
**should** · effort S
- **Evidence:**
  - `thread-on` is decided before first paint. Until `thread-ready`, every non-intro station is `visibility: hidden` (`Thread.astro:415-417`).
  - `GIVE_UP_MS` is 10,000 (`boot.ts:9`). On a slow connection, a reader who starts scrolling sees about 15 empty screens.
- **Fix:**
  - Shorten the timeout to about 4 s.
  - Or, if the reader scrolls past the intro before `thread-ready`, fall back to the document layout at once; `main.ts` already knows how to resume the thread from a reading position.

### R8. Very wide and tablet-portrait screens leave the composition empty
**nice** · effort M
- **Evidence:**
  - At 3440×1440 the panel stays 440 px wide at the far right, with type capped at 42 px, while the figure sits on the left (`vp-ultrawide-2.85.png`).
  - An iPad Pro in portrait (1024×1366) gets the phone layout, with a large empty band between figure and text (`vp-ipadpro-portrait-2.85.png`).
- **Fix:**
  - Cap the off-axis frame at about 1920 px, centred, and scale the panel type with `vw` above 1920.
  - For tablets in portrait, place the panel at about 60 % height instead of the bottom.

### R9. Reduced motion is read once, and there is no in-page way to turn motion off
**nice** · effort S (see L6)
- **Evidence:** the head script in `Home.astro:31-41` reads `prefers-reduced-motion` once. Changing the setting mid-visit does nothing, and visitors who get motion-sick but haven't set the OS preference have no switch.
- **Fix:** listen for `matchMedia(...).addEventListener("change")` and call `stop()` (once R1 makes `stop()` clean). Add the "Plain version" toggle (L6).

---

## 3. Accessibility

**Checked and working:**
- **Contrast:**

  | Colour | On `--ink` | On `--ink-3` |
  |---|---|---|
  | text | 16.5:1 | – |
  | text-2 | 11.4:1 | – |
  | muted `#8C8A85` | 5.70:1 | 4.98:1 |
  | station tints | ≥ 9.5:1 | – |

- **Focus and skip link:** `:focus-visible` gives a 2 px ring, and the skip link works.
- **Structure:** every page has exactly one `<h1>` (checked by `verify`).
- **Lighthouse accessibility:** 100 on home, About and a case study.
- **Canvas:** it is `aria-hidden`, and keyboard scrolling works.

### A1. With the thread on, assistive technology, Tab and find-in-page can't reach the stations
**launch-blocker** · effort M
- **Evidence:** at page load, the accessibility tree compares like this:

  | | Thread on | `?nothread` |
  |---|---|---|
  | Headings | 3 | 14 |
  | Links | 31 | 39 |

  - **Missing with the thread on:** "View on the App Store", all four "Case study" links, "The full history", and the end panel's email, "All work" and "About me".
  - **Tab order:** Tab goes from "Deutsch" in the header straight to "Lexicon Bluff" at y = 15,163.
  - **Find-in-page:** `window.find()` for "Deepgram" and "CONSORT" returns false with the thread on and true with `?nothread`. Cmd+F behaves the same.
  - **Cause:** `DomSync` sets `visibility: hidden` on every panel, label and plane outside its cue (`src/thread/sync.ts:126, 166, 179`), and `visibility: hidden` removes content from the accessibility tree, the focus order and find.
  - **Who is affected:** screen-reader users rarely set reduced motion, so they get the thread and a home page that is just the name, then "More things I've built". Crawlers that render WebGL also see the station copy hidden.
- **Fix:**
  - Hide inactive panels with `opacity: 0` (they already ignore pointer events) instead of `visibility`, so their text stays in the tree and in find.
  - Add a `focusin` listener on the panels that scrolls the timeline to that panel's cue: `scrollToT(cueMid)`, reusing `Chrome`'s `scrollTo`.
  - For find-in-page, where supported, mark the panels `hidden="until-found"` and handle `beforematch` with the same scroll.
  - Test with VoiceOver on iOS and macOS. The rotor's Headings list should show all 14.

### A2. Word splitting, scrambled kickers and counters change what assistive technology reads
**should** · effort S
- **Evidence:**
  - `splitWords` (`sync.ts:53-67`) turns every word of each `<h2>` into `inline-block` spans (`Thread.astro:576-585`). VoiceOver on iOS tends to stop at each inline-block, so headings get read one word per swipe.
  - The kickers' scramble writes random glyphs into `textContent` for 700 ms (`sync.ts:212-228`).
  - Counters overwrite the server text with "0" until their cue (`sync.ts:131-137`). At load the DOM says "0" futures and a score of "0", so find "1,000" fails and screen readers hear 0.
- **Fix:** keep the real text in the DOM and animate an `aria-hidden` copy. For example `<h2><span class="visually-hidden">…</span><span aria-hidden="true" data-words>…</span></h2>`; do the same for counters and scramble kickers.

### A3. The email link's accessible name doesn't match its visible text, and screen-reader activation goes to the imprint
**should** · effort S
- **Evidence:**
  - Lighthouse fails `label-content-name-mismatch` on every page. The visible text is "constantin@metz.uk" but the name is "Email Constantin Metz" (`src/components/ui/Email.astro:26`). This is WCAG 2.5.3, level A: a voice-control user saying "click constantin@metz.uk" gets nothing.
  - The upgrade waits for `pointermove`, `pointerdown`, `touchstart`, `keydown` or `focusin` (`:45`). NVDA in browse mode activates links with a plain `click`, which fires none of these, so the user lands on /imprint.
  - Before the upgrade, Safari Reader and copy-paste give `ku.ztem@nitnatsnoc`.
- **Fix:**
  - Add a capturing `click` listener: if the link still has `data-email`, upgrade it, `preventDefault()`, and set `location.href = "mailto:…"`.
  - Make the label contain the visible pattern, or drop the `aria-label` once A2's approach makes the visually hidden text read correctly.
  - On the Impressum only, consider plain text (see C1). Constantin decides the trade-off.

### A4. The home header has no way to Work, About or Writing, and phones get only the name and "DE"
**should** · effort S
- **Evidence:**
  - The home header (`Thread.astro:46-60`) holds the mark, five chapter links and the language switch.
  - Below 760 px the chapters are hidden (`:1049-1054`), so a phone visitor who wants About scrolls about 16 screens or uses the footer.
  - The mark "Constantin Metz" (`href="#main"`) can be focused at the top while it is `opacity: 0`, so the focus ring draws around nothing.
- **Fix:**
  - Add a compact "Work · About · Writing" item, or an "Index" disclosure, to the home header.
  - Add a second skip link, "Skip the thread", that jumps to "More things I've built".
  - Make the mark `inert` (or `tabindex="-1"`) until it is visible.

### A5. Code comments in the posts fail contrast
**should** · effort S
- **Evidence:** Lighthouse `color-contrast` on the posts. Shiki's default `github-dark` comment colour `#6A737D` measures 3.82:1 on the forced `pre` background (`--ink-2`, `global.css:270-278`), and 3.05:1 on Shiki's own background.
- **Fix:** use a custom Shiki theme, or override `.astro-code` comment tokens to `#8C8A85` (5.33:1 on `--ink-2`).

### A6. No forced-colours mode
**nice** · effort S
- **Evidence:** in Windows High Contrast (`forced-colors: active`) the canvas still draws, and the panel text is forced to system colours over it.
- **Fix:** add `(forced-colors: active)` to the head script's gates, so those visitors get the document layout.

---

## 4. Content completeness and claims

The full content review, with all 33 German suggestions and the per-project fact-checks, is condensed into Appendices A and B.

### C1. Visible placeholders on the legal pages
**launch-blocker** · effort S · **needs Constantin**
- **Evidence:**
  - `src/data/legal.ts:3,11`: `"c/o [address service — TODO]"`, `"[Street and number — TODO]"`, `"[Postcode] München — TODO"`.
  - `LegalPage.astro:110-126` (DE) and `:191-207` (EN): the host, retention period and data processing agreement are shown to visitors as TODOs.
- **Fix:** Constantin supplies:
  - The c/o address. Pick a service that explicitly accepts Impressum use; whether a c/o address counts as a *ladungsfähige Anschrift* is disputed in German courts.
  - The Cloudflare contracting entity and data processing agreement (Cloudflare's DPA is part of the self-serve terms).
  - The actual log retention period.
  - The structure is already right: § 5 DDG, § 18 (2) MStV (needed because of the Writing section), Art. 6 (1)(f), the DPF transfer, Art. 15–21 and 77, and BayLDA.
  - Two small additions: give the Art. 21 objection right its own heading, and write the hoster's retention as a number of days.

### C2. All three posts are drafts, yet they are linked from everywhere, and the RSS feeds are empty
**launch-blocker** · effort M · **needs Constantin**
- **Evidence:**
  - `draft: true` in all six post files.
  - "Draft" badges show in the home teaser (`HomeAfter.astro:66`) and on /writing.
  - Inbound links from the Zenarios and Origins case studies and from About.
  - The RSS feeds filter drafts out (`src/lib/rss.ts:13`), but the footer links "RSS" on every page.
- **Fix:** either review the posts and publish them (German approval first), or hide drafts from all lists, remove the inbound links, and hide the RSS link until the first post is out. "How the Thread works" is also the planned Hacker News and backlink piece, so publishing it matters for SEO (see section 9).

### C3. Claims that are false or overstated today
**launch-blocker** · effort S · **some need Constantin**
- **Evidence and fixes:**
  - **PaperScores is not offline.** `paperscores/en.mdx:59` and DE say "The public site is offline for now", but `paperscores-web.vercel.app` returns 200 with the live app; only paperscores.com returns 503. Constantin chooses: link the Vercel deployment, or take it down.
  - **The home Signals note says "A replay with a planted trend · the subreddits are its real configuration"** (`src/i18n/home.ts:131`, DE `:240`). The cascade drawn is hand-coded edges (`src/thread/stations/signals.ts:57-75`), not WGRA replay output; only the subreddit list is real.
    - Reword to "An illustration on WGRA's real 37-subreddit configuration".
    - Or use a real WGRA edge export once live edges exist (from about 15 Nov 2026), if Constantin provides one.
  - **Home PaperScores** (`home.ts:144`, DE `:253`) says "six dimensions mapped to CONSORT and Cochrane's risk-of-bias tool, every finding citing the page it came from".
    - The six subscores aren't mapped to CONSORT; only the RCT checklist module is CONSORT-aligned, which the case study states correctly.
    - `Check.evidence` is nullable, and about half the checks in the real scorecard have no page.
    - The example paper is from *Psyke & Logos*, a psychology journal, while the H2 says "medical research".
    - Reword to "Checklists aligned with CONSORT and related standards; findings point to the passage where one exists".
  - **The home Origins H2 says "One sign-in for the forum, the website and the game"** (`home.ts:162`, DE `:271`; also `history.ts:61`).
    - The forum is the identity *source*. No LuminuNET repo references the provider as a client.
    - Constantin should confirm which clients really used it. Otherwise: "Single sign-on for the network's web apps, on the forum's accounts".
  - The precision fixes are in Appendix B: Signals 54 % (30–77 %, not 27–80 %); CarCost EV cap 100,000 € since July 2025; "1.03 billion daily rows"; LiveTranslate "word by word"; OIDC "back to the consent page"; and others.

### C4. Thin case studies with no product images
**should** · effort M
- **Evidence** (thinnest first):

  | Project | Problem |
  |---|---|
  | Travel cost calculator | 626 words, no link, no repo, no image |
  | CarCost | 686 words, no link (no deployment found), no image |
  | segno | 492 words; it has links |
  | Lexicon Bluff | live, but no picture |
  | Origins | only a thread still |
  | PaperScores | only a still, private repo, no link |
  | Signals | only a still |
  | Zenarios | one soft phone JPEG |

  The heroes of the four index projects are a generic glow SVG.
- **Assets that exist:**
  - Zenarios: `zenarios-app/store-screenshots/iphone-6.3/01…10` (1206×2622), the showreel MP4 and its stills h1–h7.
  - LiveTranslate: `app.png` (2682×1646).
  - PaperScores: `data/sources/paperscores/scorecard.json`, which can be rendered as an HTML scorecard figure.
- **Fix:**
  - Give each study at least one real artefact with a `<figcaption>`.
  - Deploy CarCost, a static Vite PWA, so "trust me" becomes a demo.
  - Constantin may consider leaving the travel calculator out of the launch.

### C5. German copy reads as translated in about 33 places
**should** · effort S · **needs Constantin's approval**
- **Evidence:** typography and number formats are correct throughout („…“, 1.000, 90,6 %, 0,099, 1-%-Regel). The real problems:
  - One mistranslation: `history.ts:62` „die Webseite des Minecraft-Netzwerks" for "the web side".
  - Calques: „umzog / nach TypeScript brachte / TypeScript-Nutzer brechen", „Erwachsen geworden würde er…", and „Eine Reise hat Daten".
  - A broken sentence in `lexicon-bluff/de.mdx:24`.
  - Inconsistent terms: Marktszenarien / Marktverläufe / Zukünfte; Relevanz / Bedeutung; Origins / „Anfänge".
- **Fix:** Appendix A has a concrete rewording for each.

### C6. Tone breaks against the "optimistic retrospective" rule
**should** · effort S
- **Evidence:**
  - The /writing OG card subtitle reads "How they work, and what I got wrong." / „…was ich falsch gemacht habe." (`src/lib/pages.ts:76, 81`; already rendered into `dist/og/writing.png` and `dist/og/de/texte.png`).
  - The travel calculator's "Status" section is a list of defects (`travel-cost-calculator/en.mdx:34-36`).
  - The old-site paragraph on /history reads "no story… showed nothing" (`HistoryPage.astro:26-27, 40-41`).
- **Fix:** Appendix A, last table.

### C7. Other gaps
**should** · effort S each
- The /history screenshot of keimeno.party is missing ("Screenshot to come"). Capture 1600×1000 from the Wayback snapshot.
- Dates that read as "finished" or will go stale:
  - Zenarios "Mar 2025 – Oct 2026" → "since March 2025".
  - Signals "from November 2026".
  - Add `updated:` to case studies with live numbers.
- Numbers in the Thread post have drifted from the code:
  - The snippet labelled `src/thread/boot.ts` actually lives in `Home.astro`.
  - "just under 3,800 lines" is really 3,819.
  - The chunk is 73,093 B / 27.7 KB gz.
  - Better: emit a `build-stats.json` at build and import the numbers into the MDX, so they can't drift.
- `LuminuNET/key-redeem-feedback`, linked from `history.ts:78`, contains `sqldump/production.sql.zip` (1.8 KB, added 2020-01-03). Its contents weren't checked. **Constantin** should make sure it is schema-only before a site that invites experts to click through links to it.
- **Needs Constantin:** is the LiveTranslate caption "Schön, dass ihr da seid." (`Thread.astro:171-173`) real output? If not, label it as an example.

---

## 5. SEO and sharing

**Checked and working:**
- OG cards render well; I looked at the home and German OIDC cards. They are 1200×630 palette PNGs of 40–131 KB, and `twitter:image` equals `og:image`.
- `verify` checks canonical, hreflang (including x-default), the sitemap and the JSON-LD `@id` graph.
- `Person.image` now resolves to the stripped portrait.
- robots.txt allows the AI crawlers and lists the sitemap.
- llms.txt names no employers and no email.

### S1. Incomplete favicon set and no web manifest
**should** · effort S
- **Evidence:** only `/favicon.svg` exists (`Base.astro:109`). These all return 404: `/favicon.ico` (still requested by RSS readers, some crawlers and older browsers), `/apple-touch-icon.png` (iOS home screen and Safari bookmarks) and `/manifest.webmanifest`.
- **Fix:**
  - Generate from the existing "M" mark: `favicon.ico` (16 + 32 px), a 180×180 `apple-touch-icon.png` on an opaque `#0B0B0C` background, and 192/512 PNG icons.
  - Add a `site.webmanifest`: name, `short_name` "Metz", `theme_color` and `background_color` `#0B0B0C`, `display: browser`.
  - Link them all in `Base.astro`. `theme-color` is already set.

### S2. The 404 is English-first, even under /de/
**should** · effort S
- **Evidence:** `/de/gibts-nicht/` returns 404 with the English page: English nav, "Not found" first, and no language switch (`src/pages/404.astro`).
- **Fix:** add `src/pages/de/404.astro`. With `not_found_handling: "404-page"`, Cloudflare serves the nearest `404.html` up the path, so `/de/*` misses get the German one. See also L1.

### S3. Trailing slashes and duplicate URLs
**should** · effort S
- **Evidence:**
  - Locally, `/work` and `/work/` both return 200, as does `/index.html` (`trailingSlash: "ignore"`, `astro.config.mjs:8`). Canonicals point at the slash version, so this is safe, but dev and prod differ.
  - On Cloudflare, `html_handling: "auto-trailing-slash"` (the default) answers `/work` with a 307 to `/work/`.
- **Fix:**
  - Set `trailingSlash: "always"` to match prod.
  - After deploy, curl-check: `/work` → `/work/`, `/index.html` → `/`, `www` → apex 301, and http → https.

### S4. Structured data: app nodes will show as invalid in Search Console
**should** · effort S
- **Evidence:** the project nodes typed `MobileApplication`/`WebApplication` have no `offers` or `aggregateRating`, so Search Console's "Software apps" report will list them as invalid items (Phase 5 hand-over). The App Store listing confirms Zenarios is free.
- **Fix:**
  - Add `offers: { "@type": "Offer", "price": 0, "priceCurrency": "EUR" }` to Zenarios.
  - Type the projects without a store presence as `CreativeWork` or `SoftwareSourceCode`.
  - Run the Rich Results Test and validator.schema.org on `/about/` and `/work/zenarios/` once the site is live.

### S5. The sitemap has no `<lastmod>`
**nice** · effort S
- **Fix:** take it from a content `updated:` field (C7). Bing uses it, and Google does when it is accurate.

### S6. The home OG card is text-only
**nice** · effort S
- **Fix:** shared links should look like the site. Render the end constellation or the name write-on with `scripts/gen/stills.mjs` and use it as the home card's background.

### S7. OG image URLs never change
**nice** · effort S
- **Fix:** add `?v=<hash>` to `og:image`, so link previews refresh after an edit (see P8).

---

## 6. Security and privacy

**Checked and working:**
- **No third-party requests.** Every request in Lighthouse's network list is same-origin, and outbound URLs exist only as links.
- **No cookies or storage.** There is no `localStorage`, `sessionStorage` or `document.cookie` code.
- **No plain email in `dist/`.**
  - Searches for the plain, URL-encoded and base64 forms all return 0 hits.
  - The reversed form appears once per page (37).
  - JSON-LD, llms.txt, RSS and the sitemap are all clean.
  - The only other address in `dist/` is `foo@example.org`, in a code sample.
- **No personal metadata in `dist/` images.**
  - I parsed the JPEG/PNG/WebP segments of all 47 images.
  - 38 have no metadata at all.
  - The 4 thread stills carry only ICC profiles.
  - `zenarios-overview.jpg` has a 76-byte EXIF block (ColorSpace and pixel size only).
  - The portrait files are stripped, and the OG PNGs have no text chunks.

### X1. The GPS-tagged portrait original isn't git-ignored, and the repo is planned to be public
**launch-blocker** · effort S
- **Evidence:** `data/sources/portrait/constantin-portrait.jpeg` (512 KB) has a 10 KB EXIF block (iPhone 12 Pro, 2024-02-17, GPS per the hand-over). `.gitignore` lists only `node_modules dist .astro .cache .DS_Store`.
- **Fix:**
  - Add `data/sources/portrait/` to `.gitignore` before `git init`; better, move the original out of the repo.
  - Add a `verify-dist` check that fails on EXIF GPS or XMP in any image under `public/` or `dist/`, using the segment parser from this review.
  - `verify-dist` currently doesn't check for the email either. Add a regex check for `@metz\.uk` and `%40metz` across all text files in `dist/`.

### X2. No security headers or CSP for the Cloudflare deploy
**launch-blocker** · effort S–M
- **Evidence:**
  - There is no `public/_headers` and no `wrangler.jsonc`.
  - Each page has three inline executable scripts: the `js` class script (57 B, `Base.astro:110-112`), the home pre-paint gate (479 B, `Home.astro:31-41`) and the Email upgrade module, which Astro inlines (492 B).
  - JSON-LD is a data block, so CSP doesn't apply to it.
  - Inline `style=""` attributes are used for `--beats` and `--tint` (15 on `/`) and for Shiki's token colours on the posts.
- **Fix:** a `public/_headers` along these lines, with the script hashes generated at build by a small post-build step that scans `dist/`:

  ```
  /*
    Content-Security-Policy: default-src 'none'; script-src 'self' 'sha256-<js-class>' 'sha256-<home-gate>' 'sha256-<email>'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'; upgrade-insecure-requests
    Strict-Transport-Security: max-age=63072000
    X-Content-Type-Options: nosniff
    Referrer-Policy: strict-origin-when-cross-origin
    Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()
    Cross-Origin-Opener-Policy: same-origin
  /_astro/*
    Cache-Control: public, max-age=31536000, immutable
  /og/*
    Cache-Control: public, max-age=86400, stale-while-revalidate=604800
  /media/*
    Cache-Control: public, max-age=86400, stale-while-revalidate=604800
  ```

  - HSTS has no `includeSubDomains` and no `preload`, as the plan decided, because of `loveydovey.metz.uk`.
  - **Pitfall:** Astro 7 has a built-in `security.csp` that emits a `<meta>` CSP with hashes. If it hashes styles, browsers ignore `'unsafe-inline'`, and the `--beats` and `--tint` attributes stop applying, which breaks the thread layout. Either move those values into classes or data attributes, or keep CSP in the header.
  - Verify with a Playwright `securitypolicyviolation` listener (E3).
  - Phase 6 sound synthesises in code, so it needs no `media-src`. An AudioWorklet would need `script-src 'self'`, which is already allowed.

### X3. Cloudflare features that would break "no third parties, no cookies"
**should** · effort S (checklist)
- **Evidence:** the privacy page promises no cookies, and `connect-src` and `script-src` above are `'self'` only.
- **Fix:** in the zone, keep these off:
  - Web Analytics (injects a beacon from `static.cloudflareinsights.com`)
  - Rocket Loader
  - Email Address Obfuscation (injects `/cdn-cgi/…/email-decode.min.js`)
  - Bot Fight Mode and JS challenges (set `__cf_bm` and `cf_clearance`)
  - "Managed robots.txt" and AI-crawler blocking (they would contradict robots.txt and llms.txt)

  After launch, open DevTools → Application → Cookies on metz.uk and confirm it is empty.

### X4. Preview deploys must not be indexed
**should** · effort S
- **Evidence:** a `*.workers.dev` preview would serve the same `Allow: /` robots.txt, and its canonicals point at metz.uk. Drafts and unfinished work become crawlable.
- **Fix:** for non-production builds (an env var), emit `X-Robots-Tag: noindex` plus `Disallow: /`, or put previews behind Cloudflare Access.

### X5. security.txt
**nice** · effort S
- **Fix:** add `/.well-known/security.txt` with `Contact: https://metz.uk/imprint/` (RFC 9116 allows an https URI, so the address stays out of plain text) and an `Expires` date.

---

## 7. Engineering hygiene

### E1. Not a git repository
**launch-blocker** · effort S
- **Evidence:** `git status` fails with "not a git repository". Nothing is versioned, including the generated data and the hand-tuned shaders.
- **Fix:**
  1. Fix `.gitignore` first (X1), and add `.env*`, `.wrangler/`, `test-results/`, `playwright-report/` and `.lighthouseci/`.
  2. `git init`, then run `gitleaks detect` or a similar secret/PII scan.
  3. Make the first commit and push to `Keimeno/metz.uk`.
  4. Commit as `constantin@metz.uk`, as he already does elsewhere.

### E2. No licence chosen for the public repo
**should** · effort S · **needs Constantin**
- **Fix:**
  - Suggested: MIT for the code (segno already uses MIT).
  - For text, case studies, the portrait, the OG cards and the generated data: "All rights reserved", or CC BY-NC-ND 4.0. Put it in a separate `LICENSE-content` and state it in the README.
  - Geist is OFL-1.1 and arrives via npm, which is fine.

### E3. No tests
**should** · effort M
- **Evidence:** there are no Vitest or Playwright configs, although the plan specified both. `verify-dist.mjs` is good but static.
- **Fix:**
  - **Vitest:**
    - timeline cues are monotonic
    - `scrollFor(read())` round-trips, and scroll → T is continuous
    - `FrameMonitor`
    - email reversal
    - `pageGraph` `@id` resolution
  - **Playwright** (Chromium and WebKit), each test catching a bug from this review:
    - no horizontal overflow at 320 and 390 px on every page (catches the bug below)
    - no-JS, `?nothread` and reduced motion all show 12 panels
    - after context loss, all panels are visible and the station is kept
    - Tab reaches every "Case study" link on the home page
    - a chapter link sets the hash, and `/#signals` shows a panel
    - the language switch lands on the alternate page
    - no console errors
    - no CSP violations
    - no requests to other origins
    - screenshot diffs at holds (the logic from `cdp-shots.mjs`)

### E4. 14 of 36 pages scroll sideways on phones
**launch-blocker** · effort S
I filed this under engineering because a test would have caught it, but it is a layout bug.
- **Evidence:**
  - At 390 px, the page width is 591–700 px on 14 pages:
    - `/work/` zenarios, signals, lexicon-bluff, segno
    - all three posts
    - each of those in German
  - Paragraphs run off the screen and need sideways panning (`overflow-de-signals.png`).
  - **Cause:** `.case__body { display: grid; grid-template-columns: minmax(0, 1fr); justify-items: start }` (`CaseStudy.astro:327-331`) sizes `.prose` to its content, and the `<pre>`'s min-content (one long code line) pushes it to its 680 px `max-width`.
  - `.post` (`PostPage.astro:88-95`) is a grid with an implicit `auto` track, which has the same effect.
  - The `<pre>`'s own `overflow-x: auto` never gets a chance.
- **Fix:**
  - Give `.case__body .prose` a `width: 100%` and `min-width: 0` (or drop `justify-items: start`).
  - Give `.post` a `grid-template-columns: minmax(0, 1fr)`.
  - Add the overflow test from E3.

### E5. No CI
**should** · effort M
- **Fix:**
  - GitHub Actions: `npm ci` → `prettier --check` → `astro check` → `astro build` → `npm run verify` → Playwright → Lighthouse CI.
  - `prettier --check` currently fails on 49 files; run `npm run format` once, in its own commit.
  - Lighthouse CI (`lighthouserc.json` from the plan) with assertions: performance ≥ 95 on mobile; accessibility, best practices and SEO at 100 (drafts excluded); LCP ≤ 2.0 s; CLS ≤ 0.02; `/` ≤ 300 KB.
  - Pin Node with `.nvmrc` (24.21.0 locally; `engines` says ≥ 22.12).
  - Keep `scripts/gen/zenarios.mjs` out of CI, since it needs the app repo; CI uses the committed outputs, as the plan said.

### E6. No deploy pipeline or preview deploys
**should** · effort M
- **Fix:**
  - A `wrangler.jsonc` with `assets.directory: "./dist"`, `not_found_handling: "404-page"` and `html_handling: "auto-trailing-slash"`.
  - Cloudflare Workers Builds (Git integration) or `cloudflare/wrangler-action`: production on `main`, plus a preview URL per pull request.
  - Previews are noindex (X4). Comment the preview URL on the PR and run Lighthouse CI against it.

### E7. Dependency pinning
**should** · effort S
- **Evidence:**
  - Caret ranges on `astro` (^7.4.0), `@astrojs/mdx`, `@astrojs/rss`, the variable fonts and the dev tools.
  - satori, resvg and sharp are pinned exactly, which is good.
  - The lockfile makes `npm ci` reproducible, but `npm install` will move Astro minors, which change build output and CSP behaviour.
- **Fix:** pin exactly, and add Renovate: weekly, grouped, with automerge for dev-dependency patches only after CI passes.

### E8. Dead code and loose ends
**nice** · effort S
- **Evidence:**
  - Nine `ui.ts` keys are unused, in both languages: `site.description`, `lang.label`, `footer.contact`, `footer.note`, `writing.read`, `writing.published`, `home.chapters`, `home.toTop`, `date.present`.
    - `footer.note`'s "Built by hand in Munich" also contradicts the agent-workflow framing.
  - `about.portraitPending` is no longer rendered.
  - `ctx` is unused at `src/thread/stations/origins.ts:38` (the `astro check` hint).
  - `scripts/dev/*.mjs` hard-code the Chrome path; they become redundant once Playwright exists.
- **Fix:** delete them. Extend the README with deploy, tests, licence and "regenerating data".

---

## 8. Polish ideas specific to this site

### L1. A 404 that belongs to the thread
**nice** · effort S
- A short SVG thread that frays and snaps. It is static, so it works without JavaScript and with reduced motion.
- "This page doesn't exist" in the visitor's language (S2).
- Three ways on: Zenarios, About, Writing.
- Optionally "Did you mean …" for known old keimeno.party paths.

### L2. Case studies that open out of the thread
**should** · effort M
- **What:** the plan's View Transition, which isn't built (no `@view-transition` or `transition:name` anywhere in `src/`).
- **How:**
  - Add `@view-transition { navigation: auto; }` to both page types.
  - On a "Case study" click, give the canvas `view-transition-name: hero`, and give the case study's hero still the same name.
  - Supporting browsers (Chrome, and Safari 18.2+) morph the live figure into the header; Firefox simply navigates.
  - Add Speculation Rules (`prerender`, `moderate`) for `/work/*` links, so the transition is instant. That needs `'inline-speculation-rules'` or a hash in the CSP.

### L3. The end of the thread
**should** · effort M
- **What:** the storyboard says it "pulls back to show every station as a constellation, then winds back into the name; contact appears". Today it stops on an unlabelled overview (`end-16.9.png`).
- **How:**
  - Label the five figures in the overview (01 Zenarios … 05 History) as hotspots that jump back via the chapter logic.
  - Play the final rewind into the signature.
  - Add a "How this page was made →" link to the Thread post, the natural next click after the "holy shit".

### L4. "More things I've built"
**should** · effort S–M
- **What:** the rows are text only, there are no status markers, and the plan's "scan to play" QR for Lexicon Bluff is missing.
- **How:**
  - Add a small screenshot per row: revealed on hover on desktop, inline on phones.
  - Add a chip per row: Live, Open source or Prototype.
  - Show the QR on the Lexicon Bluff row on desktop; a phone visitor doesn't need it.

### L5. The Writing teaser
**should** · effort S (after C2)
- **What:** today it shows three "DRAFT" rows with no dates.
- **How:**
  - Once posts are published, show the date and reading time.
  - Lead with "How the Thread works", since it explains what the visitor just scrolled through.
  - With a single post, render it as one large card instead of a list.

### L6. A "Plain version" switch
**should** · effort S
- **What:** a small text button in the home header or the scroll hint ("Read without the animation"), or "Motion off" next to the sound toggle in Phase 6.
- **How:** it sets `?nothread`, or a remembered preference in `localStorage`. Storing a setting the visitor asked for is strictly necessary under § 25 (2) TDDDG, so it needs no consent, but the privacy page's "no cookies" section should mention it in one line. The switch serves people with motion sensitivity who haven't set the OS preference, readers in a hurry, and people with weak GPUs, and it costs almost nothing.

### L7. Other polish
- **Station stills at 2×** (nice, S): case-study heroes on 3× phones should be crisp, and `stills.mjs` can render at DPR 2.
- **"More" navigation on the home header** (should, S): see A4.
- **Copy numbers generated from code** (nice, S): see C7. The Thread post can quote `build-stats.json`, so "27.7 KB gz" is always true.

---

## 9. Launch: what's left of Phases 6–7, and the off-site steps

**Phase 6, sound** (plan: 2 days; gate: zero audio bytes before opt-in)
- Not started: there is no `audio/` in `src/thread/`.
- Sound isn't needed for SEO or for the first impression, and it adds risk on iOS. **Recommendation:** launch without it and add it in a later release. **Constantin decides.**
- If it ships, the toggle should also respect reduced motion. CSP needs no change (it is synthesised).

**Phase 7, hardening and launch.** Ordered checklist:

1. **Decisions from Constantin:**
   - the c/o address (C1)
   - Cloudflare entity, data processing agreement and retention (C1)
   - publish or hide the posts, and approve the German (C2, C5)
   - the PaperScores link (C3)
   - the OIDC clients and the LiveTranslate caption (C3, C7)
   - the key-redeem SQL dump (C7)
   - the licence (E2)
   - sound now or later
2. **Fix the launch-blockers in code:** E4 overflow, A1 thread accessibility, R1 context loss, the C3 copy, X1 `.gitignore` and checks.
3. **Repo:** `git init`, secret scan, first commit, push to `Keimeno/metz.uk` (E1), README and licence (E2, E8).
4. **Tests and CI:** E3 and E5, with Lighthouse CI budgets.
5. **Cloudflare project:** `wrangler.jsonc`, `_headers` with CSP and caching (X2, P8), and noindex previews (X4).
6. **Real devices** on a preview URL:
   - iPhone 11 or SE (2nd gen) in Safari
   - a recent iPhone in Safari
   - macOS Safari and Chrome
   - Firefox
   - a mid-range Android in Chrome
   - Check P7, R2, R5 and VoiceOver (A1).
7. **DNS runbook** (from the plan):
   1. Export the Porkbun records and lower TTLs a day ahead.
   2. Recreate them in Cloudflare, with `loveydovey` set to DNS-only.
   3. `dig` to compare answers.
   4. DNSSEC: off → switch nameservers → on.
   5. Attach `metz.uk`, with `www` → apex 301 and Always Use HTTPS.
   6. Re-check `loveydovey`.
8. **After deploy:**
   - Check headers with curl or securityheaders.com.
   - Check redirects (S3) and that 404s return status 404 in both languages.
   - Confirm the cookie jar is empty (X3).
   - Run the Rich Results Test and validator.schema.org (S4).
   - Check link previews in LinkedIn Post Inspector, Slack, WhatsApp and X.
   - Run Lighthouse against production.
9. **Off-site SEO** (the bigger lever, per the plan):
   - Google Search Console: a domain property via DNS TXT, then submit `https://metz.uk/sitemap.xml`.
   - Bing Webmaster Tools: import from Search Console.
   - Profiles:
     - GitHub: website field, and remove "Appfire" from the company field
     - GitLab: website field, which still points to keimeno.party
     - LinkedIn: website field and Featured
     - npm
     - the App Store marketing URL
   - zenarios.com: `founder → https://metz.uk/#person` and a footer link (`zenarios-web/src/lib/seo.ts`, with his OK).
   - Add "by Constantin Metz — metz.uk" to the READMEs of the public repos.
10. **Backlinks, once the posts are live:**
    - Awwwards, CSS Design Awards and Codrops submissions. They credit "Constantin Metz" on high-authority domains.
    - Hacker News: "How the Thread works".
11. **After launch:**
    - Track the position for "Constantin Metz" weekly.
    - Check Search Console coverage and hreflang reports.
    - Refresh the Signals numbers once live lead–lag edges exist (from about 15 Nov 2026).

---

## 10. Recommended order of work

1. **Constantin's decisions** (C1, C2, C3, C5, C7, E2, sound). Ask in one message, since they block different steps. *About 1 h of his time.*
2. **E4 phone overflow:** two CSS lines plus the overflow test. *S*
3. **R1 context-loss fallback** (clean `stop()`), then **A1** (opacity instead of visibility, focus drives the timeline, `until-found`), then **A2 and A3**. *M*
4. **C3 copy corrections** on the home page and in the case studies, **C6 tone**, and the **Appendix B** precision fixes. *S–M*
5. **X1 `.gitignore`** → **E1** `git init` and first commit → **E2** licence. *S*
6. **X2 headers, CSP and caching**, **S1 favicons**, **S2 German 404**, **S3** trailing slash. *S–M*
7. **E3 tests** and **E5 CI** with Lighthouse budgets; **E6** Cloudflare preview deploys. *M*
8. **Performance:** **P1** image, **P2** inline CSS, **P3** font subset, **P4** idle and hidden pausing. *S each*
9. **Robustness polish:** **R2–R7**, **A4–A6**. *S each*
10. **Real-device pass** (P7) on the preview URL, and fix what it finds.
11. **Content depth:** C4 screenshots and figures; publish the posts after German approval (C2, C5).
12. **Launch:** the DNS runbook and post-deploy checks (section 9, steps 7–8). Then off-site SEO (step 9).
13. **After launch:**
    - L2 view transitions, L3 the end of the thread, L4 and L5 the index and teaser, L1 the 404, L6 the plain-version switch
    - Phase 6 sound, if deferred
    - S5–S7

---

## Appendix A: German copy fixes (all need Constantin's approval)

The verdict: better than most translations. Quotes, number formats (1.000; 90,6 %; 0,099; 70.000 €), % spacing and compound hyphenation are correct throughout, and the register is consistent (impersonal everywhere; *Sie* only on the privacy page).

| # | Sev | Where | Current | Better |
|---|---|---|---|---|
| 1 | should | `src/data/history.ts:62` | „habe ich die **Webseite** des Minecraft-Netzwerks LuminuNET gebaut" (EN: "the web *side*") | „habe ich **die Webdienste** des Minecraft-Netzwerks LuminuNET gebaut" (mistranslation) |
| 2 | should | `home.ts:275, 277`; `history.ts:111`; `AboutPage.astro:150` | „als das Projekt auf TypeScript **umzog**"; „die Fehlerklassen … **nach TypeScript brachte**" | „während der **Umstellung auf TypeScript**"; „das die Fehlerklassen **auf TypeScript umstellte**" |
| 3 | should | `origins/de.mdx:56` | „**Erwachsen geworden würde er heute** den Authorization Code Flow … nutzen" | „**Heute würde ich ihn** mit dem Authorization Code Flow und PKCE bauen …" (the EN "Grown up today, it would…" also dangles) |
| 4 | should | `origins/de.mdx:50` | „konnte also **TypeScript-Nutzer brechen** … statt **die API zu brechen**" | „riskierte also **Build-Fehler bei TypeScript-Nutzern** … statt **die API inkompatibel zu ändern**" |
| 5 | should | `lexicon-bluff/de.mdx:24` | „wenn man **sich ansieht statt aufs Display**" (broken) | „wenn man sich gegenseitig ansieht statt aufs Display zu schauen" |
| 6 | should | `lexicon-bluff/de.mdx:47` | „**Das Handy deaktiviert ihn**" (unclear antecedent) | „Die App sperrt die Taste für den eigenen Bluff" |
| 7 | should | `travel-cost-calculator/de.mdx:20` | „Eine Reise hat **Daten**, Reisende und Kostenpunkte" (reads as "data") | „Eine Reise hat einen **Zeitraum**, Reisende und Kostenpunkte" |
| 8 | should | `signals/de.mdx:10, 56` | „1,03 Milliarden **Tageszeilen**" | „1,03 Milliarden Zeilen **mit Tageswerten**, ein synthetisches Jahr" |
| 9 | should | `AboutPage.astro:161` | „Zenarios, ein Finanzplaner … **Es ist** im App Store." | „**Zenarios gibt es** im App Store." |
| 10 | should | `AboutPage.astro:164` | „**Am liebsten mag ich** Probleme, bei denen …" | „**Mich reizen** Probleme, bei denen Engine und Oberfläche gleichermaßen schwierig sind" |
| 11 | should | `paperscores/de.mdx:47` | „Output-Tokens **sind die Rechnung**." | „Output-Tokens **bestimmen die Rechnung**." |
| 12 | should | `paperscores/de.mdx:18` | „**einen ersten Durchgang** … **woher im Paper es stammt**" | „**eine erste Einschätzung** … **aus welcher Stelle des Papers** es stammt" |
| 13 | should | `carcost/de.mdx:16` | „eine **Weggabelung**" | „eine **Besonderheit**" |
| 14 | should | `signals/de.mdx:58` | „**Große Geschichten** erreichen viele Subreddits, also treten beliebige zwei gemeinsam auf." | „**Große Themen** erreichen viele Subreddits, deshalb tauchen beliebige zwei **oft gemeinsam** auf." |
| 15 | should | `zenarios/de.mdx:39`; futures post | „**Goldene Zusammenfassungen**", „**goldene Werte**" | „**Referenzwerte** (Golden Snapshots)" |
| 16 | should | `oidc-at-18/de.mdx:17` | „**die Quelle der Wahrheit**" | „**die maßgebliche Quelle**" |
| 17 | should | `oidc-at-18/de.mdx:144` | „sind **ein großer Teil davon, warum** ich sie heute so gut verstehe" | „haben **viel dazu beigetragen, dass** ich sie heute so gut verstehe" |
| 18 | nice | `oidc-at-18/de.mdx:20` | „**zwischen zwei Schulhalbjahren**" | „**Weihnachtsferien**" |
| 19 | nice | `home.ts:202`; `ui.ts:93`; `AboutPage.astro:43` | „den Film, **mit dem sie starten**" | „und den Film **zum Launch**" |
| 20 | nice | `home.ts:285`; `HistoryPage.astro:38`; `pages.ts:69` | „**mit Software in Produktion seit der Schulzeit**" | „Autodidakt, **der schon als Schüler Software ausgeliefert hat**" |
| 21 | nice | `zenarios/de.mdx:9, 25` | „Marktszenarien pro Lauf, **höchstens**"; „**Dreizehn Stück**" | „… (**max.**)"; „**Dreizehn Szenarien**" |
| 22 | nice | `origins/de.mdx:26, 32`; `oidc-at-18/de.mdx:26` | „**ID und Access Tokens**", „**Kurzschreib-Typ**" | „**ID- und Access-Tokens**", „**Hilfstyp in Kurzform**" |
| 23 | nice | `lexicon-bluff/de.mdx:22` | „Wer richtig **tippt**" | „Wer richtig **rät**" |
| 24 | nice | several | „große **Ernte**"; „**datierte Daten**"; „Lücke … **gefüllt**"; „ist **nullable**" | „Harvest-Lauf"; „Tabellen mit Gültigkeitsdatum"; „Lücke … **geschlossen**"; „darf null sein" |
| 25 | nice | `history.ts:168`; `HistoryPage.astro:39, 47` | „Zenarios, **allein**"; „Die **Seite** vor dieser"; „**Dazu**" | „**als Solo-Projekt**"; „Die **Website** vor dieser"; „**Mehr dazu**" |
| 26 | nice | `home.ts:234` | „**Es merkt**, worüber Reddit …" (no antecedent) | „**Signals merkt**, worüber Reddit zu reden beginnt …" |
| 27 | nice | `home.ts:254` | „ein **narratives Review**" | „eine **narrative Übersichtsarbeit**" |
| 28 | nice | `signals/de.mdx:54-58` | „Theil–Sen", „Mann–Kendall-p" (EN en dash) | „Theil-Sen-Schätzer", „Mann-Kendall-Test" |

**Terminology to unify**
- „Marktszenarien" (Zenarios, the futures post) vs „Marktverläufe" (About, the Thread post) vs „Zukünfte" (home kicker). Pick **Marktszenarien**.
- PaperScores' "Significance": „Relevanz" (home) vs „Bedeutung" (case study). Subscores: „Teilnoten" vs „Teilscores".
- „Agenten-Workflow" (`zenarios/de.mdx:22`) vs „Agent-Workflow" elsewhere.
- „Designsystem" vs „Design-System".
- „XenForo-Accounts" vs „XenForo-Konten".
- „Onset / Leader / Follower" (`signals/de.mdx`) vs „Beginn / Vorreiter / Nachzügler" (home).
- The DE Thread post links „Origins", but the DE case study is titled „Anfänge".
- „aus München" vs „in München".
- „Thread" in German copy („Das war der Thread") is fine as a brand name; otherwise use „Faden".

**Tone fixes (C6)**
- `/writing` OG card (`src/lib/pages.ts:76, 81`): "How they work, and how I'd build them today." / „Wie sie funktionieren und wie ich sie heute bauen würde."
- Travel calculator: rename "Status" to "What's next", and lead with "A working prototype from February 2026 that runs locally".
- /history, old site: "keimeno.party, 2020: Vue 2, neo-brutalist, bright green, a showcase for what I was building then. This site keeps the spirit, adds the story and works without JavaScript."
- `zenarios/en.mdx:80`: drop "the design guide still describes the old palette".
- `segno/en.mdx:43`: lead with "still works as published, docs at segno.js.org".
- "the piece I got most right at 18" → "the piece that has aged best".

## Appendix B: Fact-check details (read-only passes over the source repos and `gh api`)

**Verified and solid.** Expert click-throughs will land well on:
- **Zenarios:**
  - 38 tax systems (12 detailed, 26 simpler); the OECD test snippet is verbatim; 3,377+ test cases.
  - 90.55 % line coverage (lcov from 2026-10-13); 13 stress tests; 54 Ask intents; 7 languages; free with no in-app purchases.
  - ENGINE_VERSION 4.3.0 = the generated data, and "997 of 1,000".
- **WGRA:** the scoring snippet, 262 s on 4 CPUs, Brier 0.099/0.330 and 0.249/0.276, 14 edges, the 48 h TTL; the `wgra-v2` branch and its architecture doc are pushed.
- **Sequelize #13710:** +731 −616, 41 files, merged on 5 Dec 2021, shipped in 6.12.0.
- **segno:** 73 validators, 155 tests, 194 commits in 6 weeks.
- **Lexicon Bluff:** 52,218 words, 34 tests.
- **CarCost:** 79 presets, 83 tests.
- **OIDC:** RS256 since 31 Dec 2019; 10-minute tokens; 5 attempts in 5 minutes.
- **Code snippets:** every snippet in the futures post and the Thread post is verbatim.

**To correct** (should, effort S each, unless marked):
- **Signals:**
  - `signals/en.mdx:60` and DE: "54 % (27–80 %)" → **30–77 %**, the configured 80 % interval.
  - `signals/en.mdx:64`: Deepgram interims aren't rendered; only final lines show, typed character by character. The same applies to home.ts:135, "captions build word by word".
  - `signals/en.mdx:36`: "3.2×" recomputes to 3.15×.
  - `signals/en.mdx:24`: feeds are batches of up to 25 subreddits, not one per group.
- **CarCost:**
  - `carcost/en.mdx:37` and DE: the 0.25 % EV cap is **100,000 €** for cars bought after 30 Jun 2025 (the repo uses 70,000). In English, write "€70,000".
  - "Live fuel prices from Tankerkönig": the shipped demo key returns test data.
- **Travel calculator** (`travel-cost-calculator/en.mdx:36`): "the cost formula exists twice" → three times.
- **Lexicon Bluff:**
  - `lexicon-bluff/en.mdx:47`, "in read-aloud mode nobody sees the texts", contradicts `:24` (the reader does see them).
  - `projects.ts:114`: "2026" vs a 2024 sketch; write "2024–2026" or "built in 2026".
- **segno** (`segno/en.mdx:29`): MIT "with validator.js's copyright kept next to mine". That is true in the README only; the LICENSE file lists just Constantin.
- **OIDC post:**
  - "TypeScript 3.6" → **3.7** (the lockfile and the optional chaining).
  - "three weeks" vs "three and a half weeks" in the same post.
  - "Anything more went back to the consent page": with `prompt=none` it returned HTTP 400 and the UI showed an error.
  - The ID token already carried `aud`, `iss` and `nonce`; only the access token lacked `aud`.
  - "128 commits" counts non-merge commits only (GitHub shows 147).
  - The commit title is "[updated] accidently set algorithms…".
- **History:**
  - `history.ts:110`: "28 reviews" is 28 PRs reviewed, all in 2021, while "2020–2021" is the team span. Align with Origins' wording.
  - `home.ts:181`, the 2020 step: client architectures and SSR came with the 2021 senior role.
- **Zenarios:**
  - `zenarios/en.mdx:60`, tolerances: Switzerland (one of the 12 detailed systems) is allowed 4–5.25 points, and the Netherlands and New Zealand are wider too. Only Chile and Colombia are named.
  - `zenarios/en.mdx:72`: "anonymous usage statistics" → **pseudonymous**. It is Amplitude, on by default, with a device ID.
  - `zenarios/en.mdx:41`: "per-layer coverage gates" covers engine, domain and data, not features.
  - "Mac" availability is an App Store Connect setting that can't be verified from the repos; the listing says "Designed for iPhone".
- **Thread post:** the boot snippet's file, the line count (3,819) and the chunk sizes (C7). `Scene.update(t)` is really `update(t, write)`.

## Appendix C: Artefacts from this review

The scratchpad below is session-specific. The content review is also copied to the shared notes folder.

- **Screenshots** (`…/scratchpad/shots/`):
  - `nojs-desk-full`, `anchor-signals`, `ctx-before`, `ctx-after`
  - `rot-portrait`, `rot-landscape`, `rot-back`
  - `vp-{ultrawide,short,se1,ipadpro-portrait}-*`
  - `end-16.9`, `endphone-16.9`, `overflow-de-signals`
  - `pg-1440-*` (404, case studies, About, History)
  - `print-home-thread.pdf`, `print-zenarios.pdf`
- **Lighthouse JSON:** `…/scratchpad/lh/`
- **Measurement scripts:**
  - `perf.mjs` (throttled init and scroll frame times, draw counts)
  - `profile.mjs` (CPU profile of init)
  - `robust1/2.mjs` (no-JS, reduced motion, anchors, find, context loss, rotation, viewports, bfcache, print)
  - `kbd*.mjs` (Tab order and key scrolling)
  - `ax.mjs` (accessibility tree)
  - `inp.mjs` (tap latency during init)
  - `meta.mjs` (image metadata)
  - `overflow*.mjs` (horizontal overflow)
  - `chars.mjs` (glyph coverage)
- **Full content review:** `content-review.md`, in the scratchpad and in the shared notes folder.
