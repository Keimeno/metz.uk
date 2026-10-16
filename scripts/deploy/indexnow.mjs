// Tells the IndexNow search engines (Bing, and through it DuckDuckGo and ChatGPT search; Yandex,
// Seznam, Naver) which pages changed, instead of waiting for them to recrawl the sitemap. Run it
// after a deploy, never before: the engines check the key file on the live site first.
//
//   npm run indexnow                                every page in the live sitemap
//   npm run indexnow -- --since 2026-10-16          pages whose <lastmod> is that day or later
//   npm run indexnow -- /about/ /de/ueber-mich/     just these
//   npm run indexnow -- --dry-run …                 print the request, send nothing
//
// The key is the one `public/<key>.txt` (a file named after its own content, as the protocol wants).

import { readFileSync, readdirSync } from "node:fs";

import { SITE_URL } from "../../src/site.mjs";

const ENDPOINT = "https://api.indexnow.org/indexnow";
const PUBLIC = new URL("../../public/", import.meta.url);

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const sinceAt = args.indexOf("--since");
const since = sinceAt >= 0 ? args[sinceAt + 1] : null;
const paths = args.filter((a, i) => a.startsWith("/") && args[i - 1] !== "--since");
if (since !== null && !/^\d{4}-\d{2}-\d{2}$/.test(since ?? "")) {
  console.error("--since wants a day: --since 2026-10-16");
  process.exit(1);
}

const keys = readdirSync(PUBLIC).filter(
  (name) =>
    /^[a-f0-9]{32}\.txt$/.test(name) &&
    readFileSync(new URL(name, PUBLIC), "utf8").trim() === name.slice(0, -4)
);
if (keys.length !== 1) {
  console.error(`Want exactly one IndexNow key file in public/, found ${keys.length}.`);
  process.exit(1);
}
const key = keys[0].slice(0, -4);
const keyLocation = `${SITE_URL}/${key}.txt`;
const host = new URL(SITE_URL).host;

// The engines fetch this before they accept anything; a deploy without it gets a 403.
const live = await fetch(keyLocation).then(
  (r) => (r.ok ? r.text() : `HTTP ${r.status}`),
  (e) => e.message
);
if (live.trim() !== key) {
  console.error(`${keyLocation} doesn't serve the key (${live.trim().slice(0, 60)}). Deploy first.`);
  if (!dryRun) process.exit(1);
}

let urls;
if (paths.length) urls = paths.map((p) => new URL(p, SITE_URL).href);
else {
  const sitemap = await (await fetch(`${SITE_URL}/sitemap.xml`)).text();
  urls = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)]
    .map(([, block]) => ({
      loc: block.match(/<loc>([^<]+)<\/loc>/)?.[1],
      lastmod: block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1],
    }))
    .filter((u) => u.loc && (!since || (u.lastmod && u.lastmod.slice(0, 10) >= since)))
    .map((u) => u.loc.replace(/&amp;/g, "&"));
}
if (!urls.length) {
  console.log("Nothing to send.");
  process.exit(0);
}

const body = { host, key, keyLocation, urlList: urls };
if (dryRun) {
  console.log(`POST ${ENDPOINT}\n${JSON.stringify(body, null, 2)}`);
  process.exit(0);
}
const res = await fetch(ENDPOINT, {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify(body),
});
// 200: accepted. 202: accepted, key still being checked. 403: key not found or wrong.
// 422: a URL isn't on this host. 429: too many requests; try again later.
const meaning = {
  200: "accepted",
  202: "accepted; the key is still being checked",
  400: "bad request",
  403: "the key file wasn't found or doesn't match",
  422: "a URL doesn't belong to the host",
  429: "too many requests; try again later",
}[res.status];
console.log(`IndexNow: ${res.status} ${meaning ?? res.statusText}, ${urls.length} URL(s).`);
process.exit(res.ok ? 0 : 1);
