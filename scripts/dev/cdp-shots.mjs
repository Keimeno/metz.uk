// Headless Chrome renders of the thread at timeline holds (usage: OUT=dir BASE=url node cdp-shots.mjs w h dpr mobile prefix t...).
// Headless Chrome over the DevTools protocol: emulates a device and screenshots the lab at
// several timeline holds. Usage: node cdp-shots.mjs <w> <h> <dpr> <mobile 0|1> <prefix> <t...>
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";

const [w, h, dpr, mobile, prefix, ...times] = process.argv.slice(2);
const DIR = process.env.OUT ?? "/tmp/metz-shots"; await import("node:fs").then((fs) => fs.mkdirSync(DIR, { recursive: true }));
const CH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const port = 9333;
mkdirSync(`${DIR}/cdp-profile`, { recursive: true });
const chrome = spawn(CH, [
  "--headless=new",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${DIR}/cdp-profile`,
  "--use-angle=metal",
  "--hide-scrollbars",
  "--window-size=1440,900",
  "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 50 && !target; i++) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    target = list.find((t) => t.type === "page");
  } catch {}
  if (!target) await sleep(200);
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let id = 0;
const pending = new Map();
ws.addEventListener("message", (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
});
const send = (method, params = {}) =>
  new Promise((r) => {
    const i = ++id;
    pending.set(i, r);
    ws.send(JSON.stringify({ id: i, method, params }));
  });

await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: Number(w),
  height: Number(h),
  deviceScaleFactor: Number(dpr),
  mobile: mobile === "1",
});
if (mobile === "1") {
  await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await send("Emulation.setEmitTouchEventsForMouse", { enabled: true, configuration: "mobile" });
}
for (const t of times) {
  const extra = process.env.EXTRA ?? "";
  const url = t.startsWith("live") ? `${process.env.BASE ?? "http://localhost:4322/"}?x=${t}` : `${process.env.BASE ?? "http://localhost:4322/"}?hold=${t}&freeze${extra}`;
  await send("Page.navigate", { url });
  await sleep(Number(process.env.WAIT ?? 3500));
  const shot = await send("Page.captureScreenshot", { format: "png" });
  const file = `${DIR}/${prefix}-${t}.png`;
  writeFileSync(file, Buffer.from(shot.result.data, "base64"));
  console.log(file.split("/").pop());
}
ws.close();
chrome.kill();
