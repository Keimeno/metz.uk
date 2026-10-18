// Checks the built site in a real browser: headless Chrome over the DevTools protocol, against a
// small server on dist/ that behaves like Cloudflare (trailing-slash redirects, the nearest
// 404.html, the headers from _headers, so the CSP applies).
// - No page is wider than a 390 px phone, or a 320 px one.
// - The home page's name stays on its first screen when the viewport grows to the page's height,
//   as Google's renderer does before its screenshot.
// - The email address is never in a page's source or in what a script reads from it: before any
//   interaction the link goes to the imprint and holds only reversed halves; the first interaction
//   turns every address on the page into a mailto: link with the address in its text.
// - A tap reaches what is under the finger on a phone: the home page's language switch, every link
//   in the thread while its panel is showing (the scroll sections used to catch those taps), and
//   a hit area of 44 × 44 px around each standalone header, footer and text link.
// - With the thread running, the home page shows assistive technology the same headings as the
//   document version (`?nothread`), find-in-page reaches the station text, and Tab reaches every
//   link in the thread and brings its panel up.
// - The phone screenshot doesn't load with the page, and the loop slows down when nothing moves
//   and stops once the page below covers the canvas.
// - A lost WebGL context leaves the document version, complete, with the reader on the same text.
// - No console errors and no CSP violations anywhere.
//
// Usage: npm run build && node scripts/verify-browser.mjs   (CHROME=/path/to/chrome to choose)

import { spawn, spawnSync } from "node:child_process";
import {
  createReadStream,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, relative } from "node:path";

const DIST = process.env.DIST ?? new URL("../dist/", import.meta.url).pathname;
const PHONES = [
  { width: 390, height: 844, deviceScaleFactor: 3 },
  { width: 320, height: 568, deviceScaleFactor: 2 },
];
const DESKTOP = { width: 1440, height: 900, deviceScaleFactor: 1 };
/** Google's smartphone renderer, before it grows the viewport to the page. */
const GOOGLEBOT = { width: 412, height: 732, deviceScaleFactor: 1 };
const HOMES = ["/", "/de/"];

const problems = [];
const fail = (where, msg) => problems.push(`${where}: ${msg}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── A static server shaped like Cloudflare's asset handling ─────────────────────────────────
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".json": "application/json",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".webmanifest": "application/manifest+json",
};
/** The headers of the `/*` rule in _headers, minus the HTTPS upgrade (this server is plain HTTP). */
const siteHeaders = (() => {
  const file = join(DIST, "_headers");
  if (!existsSync(file)) return {};
  const block =
    readFileSync(file, "utf8")
      .split(/^\/\*\s*$/m)[1]
      ?.split(/^\S/m)[0] ?? "";
  return Object.fromEntries(
    [...block.matchAll(/^\s+([\w-]+):\s*(.+)$/gm)].map(([, k, v]) => [
      k,
      k === "Content-Security-Policy" ? v.replace(/;\s*upgrade-insecure-requests/, "") : v,
    ])
  );
})();
const isFile = (p) => existsSync(p) && statSync(p).isFile();
const server = createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  const path = decodeURIComponent(url.pathname);
  let file = join(DIST, path);
  if (!file.startsWith(DIST)) return res.writeHead(400).end();
  if (!path.endsWith("/") && !extname(path) && isFile(join(file, "index.html"))) {
    return res.writeHead(308, { location: `${path}/${url.search}` }).end();
  }
  if (path.endsWith("/")) file = join(file, "index.html");
  let status = 200;
  if (!isFile(file)) {
    status = 404;
    file = path.startsWith("/de/") ? join(DIST, "de/404.html") : join(DIST, "404.html");
  }
  res.writeHead(status, {
    "content-type": TYPES[extname(file)] ?? "application/octet-stream",
    ...siteHeaders,
  });
  createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const ORIGIN = `http://127.0.0.1:${server.address().port}`;

// ── Headless Chrome ─────────────────────────────────────────────────────────────────────────
const which = (cmd) => spawnSync("which", [cmd], { encoding: "utf8" }).stdout.trim();
const chromePath =
  process.env.CHROME ||
  [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ].find(existsSync) ||
  ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]
    .map(which)
    .find(Boolean);
if (!chromePath) {
  console.error("✗ verify-browser: no Chrome found; set CHROME=/path/to/chrome");
  process.exit(1);
}
const profile = mkdtempSync(join(tmpdir(), "metz-verify-"));
const chrome = spawn(
  chromePath,
  [
    "--headless=new",
    "--remote-debugging-port=0",
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--hide-scrollbars",
    // A real GPU on macOS; elsewhere (CI) a software WebGL2.
    ...(process.platform === "darwin"
      ? ["--use-angle=metal"]
      : ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"]),
    "about:blank",
  ],
  { stdio: ["ignore", "ignore", "pipe"] }
);
process.on("exit", () => {
  chrome.kill();
  try {
    rmSync(profile, { recursive: true, force: true, maxRetries: 3 });
  } catch {}
});
const wsUrl = await new Promise((resolve, reject) => {
  let err = "";
  chrome.stderr.on("data", (d) => {
    err += d;
    const m = err.match(/DevTools listening on (ws:\/\/\S+)/);
    if (m) resolve(m[1]);
  });
  chrome.on("exit", () => reject(new Error(`Chrome exited: ${err.slice(0, 400)}`)));
});
const port = new URL(wsUrl).port;
const target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(
  (t) => t.type === "page"
);
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));

let nextId = 0;
const pending = new Map();
const listeners = new Set();
ws.addEventListener("message", (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(`${msg.error.message} (${msg.error.data ?? ""})`));
    else resolve(msg.result);
  } else if (msg.method) for (const fn of listeners) fn(msg);
});
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
const waitFor = (method, timeout = 15000) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      listeners.delete(on);
      reject(new Error(`timed out waiting for ${method}`));
    }, timeout);
    const on = (msg) => {
      if (msg.method !== method) return;
      clearTimeout(timer);
      listeners.delete(on);
      resolve(msg.params);
    };
    listeners.add(on);
  });
/** Evaluates `expression` in the page (awaiting promises) and returns its value. */
const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails)
    throw new Error(`${r.exceptionDetails.exception?.description ?? r.exceptionDetails.text}`);
  return r.result.value;
};
/** Polls `expression` until it is truthy. */
const until = async (expression, timeout = 10000) => {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await evaluate(expression)) return true;
    await sleep(100);
  }
  return false;
};

// Console errors, exceptions and CSP violations, tagged with the page they happened on.
let here = "";
const errors = [];
listeners.add(({ method, params }) => {
  if (method === "Runtime.exceptionThrown")
    errors.push(
      `${here}: ${params.exceptionDetails.exception?.description ?? params.exceptionDetails.text}`
    );
  if (method === "Log.entryAdded" && params.entry.level === "error")
    errors.push(`${here}: ${params.entry.text}`);
  if (method === "Runtime.consoleAPICalled" && params.type === "error")
    errors.push(`${here}: ${params.args.map((a) => a.value ?? a.description).join(" ")}`);
});
const requests = [];
listeners.add(({ method, params }) => {
  if (method === "Network.requestWillBeSent") requests.push(params.request.url);
});

await send("Page.enable");
await send("Runtime.enable");
await send("Log.enable");
await send("Network.enable");
await send("Accessibility.enable");
// Counts animation frames the page asks for, for the idle checks.
await send("Page.addScriptToEvaluateOnNewDocument", {
  source: `{ const raf = window.requestAnimationFrame.bind(window); window.__frames = 0;
    window.requestAnimationFrame = (cb) => raf((t) => { window.__frames++; cb(t); }); }`,
});

const viewport = (v, mobile) =>
  send("Emulation.setDeviceMetricsOverride", { ...v, mobile }).then(() =>
    send(
      "Emulation.setTouchEmulationEnabled",
      mobile ? { enabled: true, maxTouchPoints: 5 } : { enabled: false }
    )
  );
const log = process.env.VERBOSE ? (...a) => console.error("·", ...a) : () => {};
const open = async (path) => {
  log("open", path);
  here = path;
  requests.length = 0;
  const loaded = waitFor("Page.loadEventFired");
  await send("Page.navigate", { url: ORIGIN + path });
  await loaded;
  await evaluate("document.fonts.ready.then(() => true)");
};
const threadReady = () =>
  until("document.documentElement.classList.contains('thread-ready')", 10000);
/** The headings a screen reader lists, in reading order (a depth-first walk of the AX tree). */
const headings = async () => {
  const { nodes } = await send("Accessibility.getFullAXTree");
  const byId = new Map(nodes.map((n) => [n.nodeId, n]));
  const out = [];
  const visit = (n) => {
    if (!n) return;
    if (!n.ignored && n.role?.value === "heading") {
      const level = n.properties?.find((p) => p.name === "level")?.value.value ?? "?";
      out.push(`h${level} ${n.name?.value ?? ""}`.trim());
    }
    for (const id of n.childIds ?? []) visit(byId.get(id));
  };
  visit(nodes.find((n) => !n.parentId));
  return out;
};
const key = async (k, code = k, vk = 9) => {
  await send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: k,
    code,
    windowsVirtualKeyCode: vk,
  });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code, windowsVirtualKeyCode: vk });
};

// ── 1. No page wider than the phone ─────────────────────────────────────────────────────────
const pagePaths = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (name.endsWith(".html"))
      pagePaths.push("/" + relative(DIST, p).replace(/index\.html$/, ""));
  }
};
walk(DIST);
pagePaths.sort();
const OVERFLOW = `(() => {
  const w = document.documentElement.clientWidth;
  const sw = document.documentElement.scrollWidth;
  if (sw <= w) return null;
  const clipped = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement)
      if (getComputedStyle(p).overflowX !== "visible") return true;
    return false;
  };
  const name = (el) => el.tagName.toLowerCase() + (typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\\s+/).join(".") : "");
  const culprits = [];
  for (const el of document.body.querySelectorAll("*")) {
    const r = el.getBoundingClientRect();
    if (!r.width || r.right <= w + 0.5 || el.parentElement.getBoundingClientRect().right > w + 0.5 || clipped(el)) continue;
    culprits.push(name(el) + " (" + Math.round(r.right) + " px)");
    if (culprits.length === 3) break;
  }
  return { width: sw, culprits };
})()`;
let overflowChecks = 0;
for (const phone of PHONES) {
  await viewport(phone, true);
  for (const path of [...pagePaths, ...HOMES.map((h) => `${h}?nothread`)]) {
    await open(path);
    if (HOMES.includes(path)) await threadReady();
    const o = await evaluate(OVERFLOW);
    overflowChecks++;
    if (o)
      fail(
        `${path} @${phone.width}`,
        `page is ${o.width} px wide; ${o.culprits.join(", ") || "cause not found"}`
      );
  }
}

// ── 2. A crawler's tall viewport ───────────────────────────────────────────────────────────
// Google's renderer loads a page at phone size, then grows the viewport once to the page's height
// (up to about 12,000 px) and screenshots the top. The name has to stay on the first screen.
const tallViewport = [];
for (const home of HOMES) {
  await viewport(GOOGLEBOT, true);
  await open(home);
  const grown = Math.min(await evaluate("document.documentElement.scrollHeight"), 12140);
  await viewport({ ...GOOGLEBOT, height: grown }, true);
  await sleep(1000);
  const bottom = await evaluate(
    `Math.round(document.querySelector("[data-name]").getBoundingClientRect().bottom)`
  );
  if (bottom > GOOGLEBOT.height)
    fail(`${home} @412×${grown}`, `the name ends ${bottom} px down, below the first screen`);
  else tallViewport.push(`${home} ${grown} px`);
}

// ── 2b. The email address ──────────────────────────────────────────────────────────────────
// Before anyone interacts, a link holds no "@" and no mailto:, CSS draws the address, and the link
// goes to the imprint; the first interaction makes it a real mailto: link, everywhere on the page.
const ADDRESS = ["constantin", "metz.uk"].join("@");
const reversedAddress = [...ADDRESS].reverse().join("");
let emailLinks = 0;
await viewport(DESKTOP, false);
for (const path of ["/", "/de/", "/about/", "/imprint/", "/de/impressum/", "/privacy/"]) {
  await open(path);
  const links = await evaluate(`[...document.querySelectorAll("a[data-email]")].map((a) => {
    const css = getComputedStyle(a.querySelector("[data-u]"), "::before");
    return { href: a.getAttribute("href"), html: a.outerHTML, shown: css.content, dir: css.direction };
  })`);
  if (!links.length && path !== "/privacy/") fail(path, "no email link on the page");
  for (const l of links) {
    emailLinks++;
    if (/@|mailto:/i.test(l.html))
      fail(path, "an email link holds an @ or a mailto: before any interaction");
    if (l.shown !== `"${reversedAddress}"` || l.dir !== "rtl")
      fail(path, `the address isn't drawn right to left (${l.shown}, ${l.dir})`);
    if (l.href.includes("mailto:"))
      fail(path, "an email link is a mailto: link before any interaction");
  }
  await evaluate(`window.dispatchEvent(new PointerEvent("pointermove"))`);
  const after = await evaluate(`[...document.querySelectorAll("a.email")].map((a) => ({
    href: a.getAttribute("href"), text: a.textContent.trim(), open: a.hasAttribute("data-email") }))`);
  for (const l of after)
    if (l.open || l.href !== `mailto:${ADDRESS}` || !l.text.endsWith(ADDRESS))
      fail(path, `an email link wasn't upgraded on the first interaction (${l.href}, "${l.text}")`);
}

// ── 2c. Pressing things on a phone ─────────────────────────────────────────────────────────
// A tap has to land on the link under the finger. The home page's language switch sits in a header
// that ignores pointer events except for its links; the thread's links sit in fixed layers beneath
// the scroll sections, which used to catch their taps; and standalone links need a 44 px target.
const PRESSABLE =
  ".site-header__mark, .site-header__nav a, .lang-switch, .site-footer__cols a, .site-footer__legal a, .site-footer__email, .text-link, .more";
const PRESS_PAGES = ["/", "/de/", "/about/", "/work/", "/work/stet/", "/writing/", "/imprint/"];
let pressed = 0;
let sweeps = 0;
await viewport(PHONES[0], true);
for (const home of HOMES) {
  await open(home);
  await threadReady();
  const height = await evaluate("document.documentElement.scrollHeight");
  for (let y = 0; y < height; y += 600) {
    await evaluate(`window.scrollTo(0, ${y})`);
    await sleep(450);
    sweeps++;
    const bad = await evaluate(`(() => {
      const bad = [];
      const hitAt = (el, dy = 0) => {
        const r = el.getBoundingClientRect();
        return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2 + dy);
      };
      const lang = document.querySelector(".site-head .lang-switch");
      if (lang && !document.documentElement.classList.contains("thread-past"))
        for (const dy of [-18, 0, 18]) {
          const hit = hitAt(lang, dy);
          if (!(hit && lang.contains(hit))) bad.push("language switch, " + dy + " px: " + hit?.tagName + "." + hit?.className);
        }
      for (const a of document.querySelectorAll(".station__layer a")) {
        const panel = a.closest("[data-cue]");
        if (!panel || panel.hasAttribute("data-off")) continue;
        const r = a.getBoundingClientRect();
        if (r.top < 0 || r.bottom > innerHeight) continue;
        const hit = hitAt(a);
        if (hit && (a.contains(hit) || hit.closest(".curtain"))) continue;
        bad.push('"' + a.textContent.trim().slice(0, 24) + '": ' + hit?.tagName + "." + hit?.className);
      }
      return bad;
    })()`);
    for (const b of new Set(bad))
      fail(`${home} scrolled to ${y}`, `a tap doesn't reach its link: ${b}`);
  }
}
for (const path of PRESS_PAGES) {
  await open(path);
  await threadReady().catch(() => {});
  const count = await evaluate(`document.querySelectorAll(${JSON.stringify(PRESSABLE)}).length`);
  for (let i = 0; i < count; i++) {
    const r = await evaluate(`(() => {
      const el = document.querySelectorAll(${JSON.stringify(PRESSABLE)})[${i}];
      if (getComputedStyle(el).visibility === "hidden" || !el.getClientRects().length) return null;
      el.scrollIntoView({ block: "center" });
      const b = el.getBoundingClientRect();
      const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
      const miss = [];
      for (const [dx, dy] of [[0, 0], [0, -20], [0, 20], [-20, 0], [20, 0]]) {
        const x = cx + dx, y = cy + dy;
        if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) continue;
        const hit = document.elementFromPoint(x, y);
        if (!(hit && el.contains(hit))) miss.push(dx + "," + dy + ":" + hit?.tagName + "." + String(hit?.className).slice(0, 24));
      }
      return { name: (el.textContent || el.getAttribute("aria-label") || el.className).trim().slice(0, 24), miss };
    })()`);
    if (!r) continue;
    pressed++;
    if (r.miss.length) fail(path, `"${r.name}" has no 44 px target (${r.miss.join(" ")})`);
  }
}

// ── 3. The thread, for assistive technology, the keyboard and find-in-page ─────────────────
await viewport(DESKTOP, false);
const summary = [];
for (const home of HOMES) {
  await open(`${home}?nothread`);
  const doc = await headings();
  const docHeight = await evaluate("document.documentElement.scrollHeight");

  await open(home);
  if (!(await threadReady())) {
    fail(home, "the thread never started (no WebGL2 in this browser?)");
    continue;
  }
  await sleep(300);
  // The phone screenshot waits for its cue (find-in-page below may scroll to it, so check first).
  if (requests.some((u) => /zenarios-(overview|phone)/.test(u)))
    fail(home, "the Zenarios phone image loads with the page, before its cue");
  log("headings");
  const live = await headings();
  if (JSON.stringify(live) !== JSON.stringify(doc))
    fail(
      home,
      `headings differ with the thread on and off:\n    on:  ${live.join(" | ")}\n    off: ${doc.join(" | ")}`
    );
  for (const word of ["Deepgram", "CONSORT", "Sequelize"])
    if (
      !(await evaluate(`(getSelection().removeAllRanges(), window.find(${JSON.stringify(word)}))`))
    )
      fail(home, `find-in-page doesn't reach "${word}" with the thread on`);
  await evaluate(
    "getSelection().removeAllRanges(), document.activeElement?.blur(), scrollTo(0, 0)"
  );

  log("tab");
  // Tab through the thread: every link in it gets focus, and its panel comes up.
  const linksInThread = await evaluate(
    `[...document.querySelectorAll(".thread-page a[href]")].length`
  );
  await sleep(2600);
  const reached = new Set();
  for (let i = 0; i < 40 && reached.size < linksInThread; i++) {
    await key("Tab");
    const inThread = await evaluate(`(() => {
      const a = document.activeElement;
      if (!a || !a.closest(".thread-page")) return a?.closest("[data-curtain]") ? "after" : null;
      return [...document.querySelectorAll(".thread-page a[href]")].indexOf(a);
    })()`);
    if (inThread === "after") break;
    if (inThread === null) continue;
    reached.add(inThread);
    const shown = await until(
      `(() => {
      const p = document.activeElement.closest("[data-cue]");
      return p && !p.hasAttribute("data-off") && Number(p.style.getPropertyValue("--v")) > 0.95;
    })()`,
      4000
    );
    if (!shown) {
      const label = await evaluate("document.activeElement.textContent.trim().slice(0, 40)");
      fail(home, `Tab focused "${label}" but its panel didn't come up`);
    }
  }
  if (reached.size !== linksInThread)
    fail(home, `Tab reached ${reached.size} of the ${linksInThread} links in the thread`);

  log("idle");
  // The loop: slow when idle at a station, stopped below the thread.
  await evaluate(`document.querySelector('[data-chapter="paperscores"]').click()`);
  await sleep(3500);
  const idleFps = await evaluate(
    "(async () => { const a = __frames; await new Promise(r => setTimeout(r, 2000)); return (__frames - a) / 2; })()"
  );
  await evaluate("scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })");
  await sleep(1200);
  const pastFps = await evaluate(
    "(async () => { const a = __frames; await new Promise(r => setTimeout(r, 2000)); return (__frames - a) / 2; })()"
  );
  if (idleFps > 25)
    fail(home, `the thread draws ${idleFps} frames/s while nothing moves (want ≤ 25)`);
  if (pastFps > 1) fail(home, `the thread draws ${pastFps} frames/s under the page below (want 0)`);

  // ── 4. A lost WebGL context, at a station and below the thread ──────────────────────────
  const loseAt = async (setup) => {
    await open(home);
    await threadReady();
    await evaluate(setup);
    await sleep(2200);
    const before = await evaluate(`(() => {
      const curtain = document.querySelector("[data-curtain]").getBoundingClientRect().top;
      let best = null, v = 0;
      for (const p of document.querySelectorAll(".panel[data-cue]")) {
        const pv = Number(p.style.getPropertyValue("--v")) || 0;
        if (pv > v) { v = pv; best = p; }
      }
      return { curtain, text: best?.querySelector("h2, .end__title")?.textContent.trim() ?? null };
    })()`);
    await evaluate(
      `document.querySelector("canvas.thread-canvas").getContext("webgl2").getExtension("WEBGL_lose_context").loseContext()`
    );
    await sleep(600);
    return before;
  };
  const DOCUMENT_STATE = `(() => {
    const root = document.documentElement;
    const leftovers = [...document.querySelectorAll(".thread-page [style], .thread-page [data-off]")]
      .filter((el) => el.hasAttribute("data-off") || /visibility|opacity|transform|--v/.test(el.getAttribute("style")) && !/^--(beats|level)/.test(el.getAttribute("style")));
    const hidden = [...document.querySelectorAll(".panel")].filter((p) => getComputedStyle(p).opacity !== "1" || getComputedStyle(p).visibility !== "visible");
    return {
      classes: ["thread-on", "thread-ready", "thread-past"].filter((c) => root.classList.contains(c)),
      canvas: !!document.querySelector("canvas.thread-canvas"),
      leftovers: leftovers.length,
      hidden: hidden.length,
      counters: [...document.querySelectorAll("[data-count]")]
        .map((c) => [c.querySelector(".visually-hidden")?.textContent, c.querySelector("[data-copy]")?.textContent])
        .filter(([real, copy]) => copy !== undefined && copy !== real)
        .map(([real, copy]) => copy + " instead of " + real),
      height: root.scrollHeight,
    };
  })()`;
  const checkDocument = async (where) => {
    const s = await evaluate(DOCUMENT_STATE);
    if (s.classes.length) fail(where, `still has ${s.classes.join(", ")}`);
    if (s.canvas) fail(where, "the canvas is still there");
    if (s.leftovers)
      fail(where, `${s.leftovers} element(s) keep the thread's inline styles or data-off`);
    if (s.hidden) fail(where, `${s.hidden} panel(s) not visible`);
    if (s.counters.length) fail(where, `a counter shows ${s.counters.join(", ")}`);
    if (Math.abs(s.height - docHeight) > docHeight * 0.02)
      fail(where, `page is ${s.height} px tall, the document version ${docHeight} px`);
    const after = await headings();
    if (after.length !== doc.length)
      fail(where, `${after.length} headings, the document version has ${doc.length}`);
  };

  const station = await loseAt(`document.querySelector('[data-chapter="signals"]').click()`);
  await checkDocument(`${home} context lost at Signals`);
  const onScreen = await evaluate(`(() => {
    const h = [...document.querySelectorAll(".panel h2")].find((h) => h.textContent.trim() === ${JSON.stringify(station.text)});
    if (!h) return false;
    const r = h.getBoundingClientRect();
    return r.top >= 0 && r.top < innerHeight;
  })()`);
  if (!onScreen)
    fail(`${home} context lost at Signals`, `the reader isn't at "${station.text}" any more`);

  const below = await loseAt(
    `scrollTo({ top: document.querySelector("[data-curtain]").offsetTop + 400, behavior: "instant" })`
  );
  await checkDocument(`${home} context lost below the thread`);
  const curtain = await evaluate(
    `document.querySelector("[data-curtain]").getBoundingClientRect().top`
  );
  if (Math.abs(curtain - below.curtain) > 2)
    fail(
      `${home} context lost below the thread`,
      `the page below moved by ${Math.round(curtain - below.curtain)} px`
    );

  summary.push(
    `${home}: ${live.length} headings with the thread on and off, Tab reached ${reached.size} links, ${idleFps} fps idle, ${pastFps} under the page below`
  );
}

ws.close();
server.close();

for (const e of errors) problems.push(`console: ${e}`);
if (problems.length) {
  console.error(`✗ ${problems.length} problem(s) in the browser:\n  ` + problems.join("\n  "));
  process.exit(1);
}
console.log(`✓ ${overflowChecks} page loads at 390 and 320 px: none wider than the screen.`);
console.log(
  `✓ Grown to the page's height like Google's renderer (${tallViewport.join(", ")}), the name stays on the first 732 px.`
);
for (const line of summary)
  console.log(`✓ ${line}; a lost WebGL context leaves the full document, reader in place.`);
console.log(
  `✓ ${emailLinks} email links: no @ or mailto: in the source, drawn by CSS, mailto: after the first interaction.`
);
console.log(
  `✓ Taps reach their links on a phone: the language switch and every showing link of the thread at ${sweeps} scroll positions, and a 44 px target around ${pressed} header, footer and text links.`
);
console.log("✓ No console errors, no CSP violations.");
process.exit(0);
