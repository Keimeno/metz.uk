// Renders a still of each station's figure from the real thread (headless Chrome over the DevTools
// protocol, the timeline held at a moment, the HTML hidden) into public/media/thread/<station>.webp.
// The case studies and the work page use them as pictures.
//
// Needs a running dev server: BASE=http://localhost:4321/ node scripts/gen/stills.mjs

import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.env.BASE ?? "http://localhost:4321/";
const OUT = new URL("../../public/media/thread/", import.meta.url);
const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

// Where to hold the timeline, and which part of a 1440 × 900 view holds the figure.
const STILLS = [
  { station: "zenarios", t: 2.85, clip: { x: 40, y: 150, width: 900, height: 563 } },
  { station: "signals", t: 6.5, clip: { x: 30, y: 160, width: 900, height: 563 } },
  { station: "paperscores", t: 9.5, clip: { x: 40, y: 160, width: 900, height: 563 } },
  { station: "origins", t: 12.1, clip: { x: 20, y: 170, width: 900, height: 563 } },
];

// Labels set their own visibility inline, so hide every descendant too: the stills are pure light,
// with no words (they serve both languages).
const HIDE_HTML = `.station__layer, .station__layer *, .site-head, .progress, .curtain { visibility: hidden !important; }`;

const profile = mkdtempSync(join(tmpdir(), "metz-stills-"));
const port = 9400 + Math.floor(Math.random() * 300);
const chrome = spawn(
  CHROME,
  ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--use-angle=metal", "--hide-scrollbars", "about:blank"],
  { stdio: "ignore" }
);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  let target;
  for (let i = 0; i < 50 && !target; i++) {
    try {
      target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === "page");
    } catch {}
    if (!target) await sleep(200);
  }
  if (!target) throw new Error("Chrome did not start");
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) (pending.get(m.id)(m), pending.delete(m.id));
  });
  const send = (method, params = {}) =>
    new Promise((r) => {
      const i = ++id;
      pending.set(i, r);
      ws.send(JSON.stringify({ id: i, method, params }));
    });

  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false });
  mkdirSync(OUT, { recursive: true });

  for (const s of STILLS) {
    await send("Page.navigate", { url: `${BASE}?hold=${s.t}&freeze&tier=high` });
    await sleep(Number(process.env.WAIT ?? 4000));
    await send("Runtime.evaluate", {
      expression: `document.head.insertAdjacentHTML("beforeend", ${JSON.stringify(`<style>${HIDE_HTML}</style>`)})`,
    });
    await sleep(400);
    const shot = await send("Page.captureScreenshot", { format: "webp", quality: 82, clip: { ...s.clip, scale: 1 } });
    if (!shot.result) throw new Error(`No screenshot for ${s.station}: ${JSON.stringify(shot.error)}`);
    const file = new URL(`${s.station}.webp`, OUT);
    writeFileSync(file, Buffer.from(shot.result.data, "base64"));
    console.log(`${s.station}.webp  ${(statSync(file).size / 1024).toFixed(0)} KB`);
  }
  ws.close();
} finally {
  chrome.kill();
  rmSync(profile, { recursive: true, force: true });
}
