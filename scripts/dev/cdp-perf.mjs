// Measures frame times of the lab at a few timeline holds in headless Chrome (GPU via Metal).
import { spawn } from "node:child_process";
const [w, h, dpr, mobile, ...times] = process.argv.slice(2);
const DIR = process.env.OUT ?? "/tmp/metz-shots"; await import("node:fs").then((fs) => fs.mkdirSync(DIR, { recursive: true }));
const CH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const port = 9334;
const chrome = spawn(CH, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${DIR}/cdp-profile2`,
  "--use-angle=metal", "--disable-gpu-vsync", "--disable-frame-rate-limit", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 50 && !target; i++) {
  try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === "page"); } catch {}
  if (!target) await sleep(200);
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0; const pending = new Map();
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: +w, height: +h, deviceScaleFactor: +dpr, mobile: mobile === "1" });
for (const t of times) {
  await send("Page.navigate", { url: `${process.env.BASE ?? "http://localhost:4322/"}?hold=${t}` });
  await sleep(4000);
  const r = await send("Runtime.evaluate", { awaitPromise: true, returnByValue: true, expression: `new Promise(res => {
    const ts = []; let last = performance.now();
    const f = (n) => { ts.push(n - last); last = n; if (ts.length < 240) requestAnimationFrame(f); else {
      ts.sort((a,b)=>a-b); res({ p50: ts[120].toFixed(2), p90: ts[216].toFixed(2), max: ts[239].toFixed(2) }); } };
    requestAnimationFrame(f); })` });
  console.log(`t=${t}`, JSON.stringify(r.result.result.value));
}
ws.close(); chrome.kill();
