// Checks the built site in dist/: every page has a language, a self-canonical and reciprocal hreflang
// alternates (en, de, x-default), exactly one <h1>, and internal links that resolve. Also enforces
// two content rules: employers are named only on the history pages, and a few things never appear.
//
// SEO: every page's JSON-LD parses and each @id it points to is defined on the page; the sitemap
// lists exactly the indexable pages, with the same alternates as the pages; every og:image exists at
// the size the page claims; titles fit in 65 characters and descriptions in 50–170 (errors on
// indexable pages, warnings on drafts); llms.txt links only indexable pages.
//
// Usage: npm run build && node scripts/verify-dist.mjs

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const DIST = new URL("../dist/", import.meta.url).pathname;
const SITE = "https://metz.uk";
const HISTORY_PAGES = new Set(["/history/", "/de/werdegang/"]);
const EMPLOYERS = /\b(adabay|DealerCenter|Appfire|Mercura|Hoffmann Eitle|Evolit|oliv newlab)\b/i;
const PROFILE_PAGES = new Set(["/", "/de/", "/about/", "/de/ueber-mich/"]);
const HOME_PAGES = new Set(["/", "/de/"]);
/** Defined on every page, so anything may point at them. */
const SHARED_IDS = new Set([`${SITE}/#person`, `${SITE}/#website`]);
const TITLE_MAX = 65;
const DESCRIPTION = [50, 170];
const NEVER = /\b(One Window|Reefster|psandro|dbackup|loveydovey|seminararbeit)\b/i;

const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (name.endsWith(".html")) files.push(path);
  }
};
walk(DIST);

/** "/work/zenarios/" for dist/work/zenarios/index.html. */
const urlPath = (file) =>
  "/" +
  relative(DIST, file)
    .replace(/index\.html$/, "")
    .replace(/\.html$/, "");
const exists = (path) => {
  const clean = decodeURI(path.split("#")[0].split("?")[0]);
  if (clean === "" || clean === "/") return existsSync(join(DIST, "index.html"));
  const p = join(DIST, clean);
  return existsSync(p) && statSync(p).isFile() ? true : existsSync(join(p, "index.html"));
};
const attr = (tag, name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
/** Undo the entity escaping Astro applies to attribute values and text. */
const unescape = (s) =>
  s
    ?.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
/** `<meta property|name="key" content="…">`. */
const meta = (html, key) => {
  const tag = [...html.matchAll(/<meta\b[^>]*>/g)]
    .map((m) => m[0])
    .find((t) => attr(t, "property") === key || attr(t, "name") === key);
  return tag ? unescape(attr(tag, "content")) : undefined;
};
/** A PNG's size, from its IHDR chunk. */
const pngSize = (file) => {
  const b = readFileSync(file);
  return b.toString("ascii", 1, 4) === "PNG"
    ? { width: b.readUInt32BE(16), height: b.readUInt32BE(20) }
    : null;
};

const pages = new Map();
for (const file of files) {
  const html = readFileSync(file, "utf8");
  const path = urlPath(file);
  const links = [...html.matchAll(/<link\b[^>]*>/g)].map((m) => m[0]);
  const alternates = Object.fromEntries(
    links
      .filter((l) => attr(l, "rel") === "alternate" && attr(l, "hreflang"))
      .map((l) => [attr(l, "hreflang"), attr(l, "href")])
  );
  pages.set(path, {
    html,
    lang: html.match(/<html[^>]*\blang="([^"]+)"/)?.[1],
    canonical: links
      .map((l) => (attr(l, "rel") === "canonical" ? attr(l, "href") : null))
      .find(Boolean),
    noindex: /<meta name="robots" content="noindex/.test(html),
    alternates,
    h1: (html.match(/<h1[\s>]/g) ?? []).length,
    title: unescape(html.match(/<title>([^<]*)<\/title>/)?.[1]),
    description: meta(html, "description"),
    jsonLd: [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
      (m) => m[1]
    ),
    hrefs: [...html.matchAll(/\bhref="(\/[^"]*)"/g)].map((m) => m[1]),
    text: html
      .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " ")
      .replace(/<[^>]+>/g, " "),
  });
}

const problems = [];
const warnings = [];
const fail = (path, msg) => problems.push(`${path}: ${msg}`);
const warn = (path, msg) => warnings.push(`${path}: ${msg}`);

for (const [path, p] of pages) {
  if (path === "/404") continue;
  if (p.lang !== "en" && p.lang !== "de") fail(path, `lang="${p.lang}"`);
  if (p.h1 !== 1) fail(path, `${p.h1} <h1> elements`);
  if (p.canonical !== SITE + path) fail(path, `canonical is ${p.canonical}`);
  for (const l of ["en", "de", "x-default"]) if (!p.alternates[l]) fail(path, `no hreflang="${l}"`);
  if (p.alternates["x-default"] !== p.alternates.en)
    fail(path, "x-default is not the English page");
  if (p.alternates[p.lang] !== SITE + path)
    fail(path, `hreflang="${p.lang}" doesn't point to itself`);
  for (const l of ["en", "de"]) {
    const target = p.alternates[l]?.replace(SITE, "");
    const other = target && pages.get(target);
    if (!other) fail(path, `hreflang="${l}" → ${target}: no such page`);
    else if (other.alternates[p.lang] !== SITE + path)
      fail(path, `hreflang="${l}" → ${target} doesn't link back`);
  }
  for (const href of p.hrefs) if (!exists(href)) fail(path, `broken link ${href}`);
  if (!HISTORY_PAGES.has(path) && EMPLOYERS.test(p.text))
    fail(path, `names an employer: "${p.text.match(EMPLOYERS)[0]}"`);
  const metaText = [...p.html.matchAll(/<meta\b[^>]*\bcontent="([^"]*)"/g)]
    .map((m) => unescape(m[1]))
    .join(" ");
  if (!HISTORY_PAGES.has(path) && EMPLOYERS.test(metaText))
    fail(path, `meta tags name an employer: "${metaText.match(EMPLOYERS)[0]}"`);
  if (NEVER.test(p.text)) fail(path, `mentions "${p.text.match(NEVER)[0]}"`);

  // Search-result snippets: reported, never cut down in code. Drafts only warn until they're published.
  const report = p.noindex ? warn : fail;
  if (!p.title) fail(path, "no <title>");
  else if (p.title.length > TITLE_MAX)
    report(path, `title is ${p.title.length} characters (max ${TITLE_MAX}): "${p.title}"`);
  const d = p.description?.length ?? 0;
  if (d < DESCRIPTION[0] || d > DESCRIPTION[1])
    report(path, `description is ${d} characters (want ${DESCRIPTION.join("–")})`);

  checkJsonLd(path, p);
  checkSocial(path, p);
}

/** One JSON-LD graph that parses, with every @id it points to defined on the page. */
function checkJsonLd(path, p) {
  if (p.jsonLd.length !== 1) return fail(path, `${p.jsonLd.length} JSON-LD blocks`);
  let data;
  try {
    data = JSON.parse(p.jsonLd[0]);
  } catch (e) {
    return fail(path, `JSON-LD doesn't parse: ${e.message}`);
  }
  if (data["@context"] !== "https://schema.org" || !Array.isArray(data["@graph"]))
    return fail(path, "JSON-LD isn't one schema.org @graph");

  const defined = new Map();
  const refs = [];
  const walk = (node) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== "object") return;
    const keys = Object.keys(node);
    if (node["@id"] && keys.length === 1) refs.push(node["@id"]);
    else if (node["@id"]) {
      if (defined.has(node["@id"])) fail(path, `JSON-LD defines ${node["@id"]} twice`);
      defined.set(node["@id"], node);
    }
    for (const key of keys) if (key !== "@id") walk(node[key]);
  };
  walk(data["@graph"]);

  for (const id of SHARED_IDS) if (!defined.has(id)) fail(path, `JSON-LD has no ${id}`);
  for (const id of new Set(refs))
    if (!defined.has(id) && !SHARED_IDS.has(id))
      fail(path, `JSON-LD points at ${id}, which isn't defined`);
  if (path === "/404") return;

  const page = defined.get(`${SITE}${path}#webpage`);
  if (!page) fail(path, "JSON-LD has no node for the page itself");
  else {
    const want = PROFILE_PAGES.has(path) ? "ProfilePage" : null;
    if (want && page["@type"] !== want) fail(path, `page node is ${page["@type"]}, not ${want}`);
    if (page["@type"] === "ProfilePage" && page.mainEntity?.["@id"] !== `${SITE}/#person`)
      fail(path, "ProfilePage's mainEntity isn't the Person");
    if (page.inLanguage !== p.lang) fail(path, `page node's inLanguage is ${page.inLanguage}`);
  }
  const hasCrumbs = data["@graph"].some((n) => n["@type"] === "BreadcrumbList");
  if (!HOME_PAGES.has(path) && !hasCrumbs) fail(path, "no BreadcrumbList");
  if (HISTORY_PAGES.has(path)) {
    const person = defined.get(`${SITE}/#person`);
    if (!person?.worksFor || !person?.alumniOf) fail(path, "the Person has no worksFor/alumniOf");
  } else if (EMPLOYERS.test(p.jsonLd[0]))
    fail(path, `JSON-LD names an employer: "${p.jsonLd[0].match(EMPLOYERS)[0]}"`);
  if (NEVER.test(p.jsonLd[0])) fail(path, `JSON-LD mentions "${p.jsonLd[0].match(NEVER)[0]}"`);
}

/** og:image and twitter:image: present, the file exists, at the size the tags say. */
function checkSocial(path, p) {
  const image = meta(p.html, "og:image");
  if (!image) return fail(path, "no og:image");
  if (!image.startsWith(`${SITE}/`)) return fail(path, `og:image is off-site: ${image}`);
  if (meta(p.html, "twitter:image") !== image) fail(path, "twitter:image differs from og:image");
  if (!meta(p.html, "og:image:alt")) fail(path, "no og:image:alt");
  const file = join(DIST, image.slice(SITE.length));
  if (!existsSync(file)) return fail(path, `og:image ${image.slice(SITE.length)} isn't in dist`);
  const size = pngSize(file);
  const claimed = {
    width: Number(meta(p.html, "og:image:width")),
    height: Number(meta(p.html, "og:image:height")),
  };
  if (!size) fail(path, `og:image ${image.slice(SITE.length)} isn't a PNG`);
  else if (size.width !== claimed.width || size.height !== claimed.height) {
    fail(
      path,
      `og:image is ${size.width}×${size.height}, tags say ${claimed.width}×${claimed.height}`
    );
  }
}

// The sitemap: exactly the indexable pages, each with the alternates the page itself declares.
const indexable = new Set(
  [...pages].filter(([path, p]) => path !== "/404" && !p.noindex).map(([path]) => path)
);
const sitemapFile = join(DIST, "sitemap.xml");
let sitemapCount = 0;
if (!existsSync(sitemapFile)) problems.push("sitemap.xml: missing");
else {
  const listed = new Set();
  for (const [, block] of readFileSync(sitemapFile, "utf8").matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1] ?? "";
    const path = loc.replace(SITE, "");
    sitemapCount++;
    if (listed.has(path)) fail("sitemap.xml", `${loc} is listed twice`);
    listed.add(path);
    const page = pages.get(path);
    if (!loc.startsWith(`${SITE}/`) || !page) {
      fail("sitemap.xml", `${loc}: no such page in dist`);
      continue;
    }
    if (!indexable.has(path)) fail("sitemap.xml", `${loc} is noindex (or the 404)`);
    const links = Object.fromEntries(
      [...block.matchAll(/<xhtml:link\b[^>]*>/g)].map((m) => [
        attr(m[0], "hreflang"),
        attr(m[0], "href"),
      ])
    );
    for (const l of ["en", "de", "x-default"]) {
      const want = page.alternates[l];
      const wantListed = want && indexable.has(want.replace(SITE, ""));
      if (wantListed && links[l] !== want)
        fail("sitemap.xml", `${loc}: hreflang="${l}" is ${links[l]}, the page says ${want}`);
      if (!wantListed && links[l])
        fail("sitemap.xml", `${loc}: hreflang="${l}" → ${links[l]}, which isn't indexable`);
    }
  }
  for (const path of indexable)
    if (!listed.has(path)) fail("sitemap.xml", `${SITE}${path} is missing`);
}

// robots.txt points at the sitemap; llms.txt links only real, indexable pages and names no employers.
const robots = existsSync(join(DIST, "robots.txt"))
  ? readFileSync(join(DIST, "robots.txt"), "utf8")
  : "";
if (!robots.includes(`Sitemap: ${SITE}/sitemap.xml`))
  problems.push("robots.txt: missing, or no Sitemap line");
if (/^Disallow:\s*\/\s*$/m.test(robots))
  problems.push("robots.txt: disallows everything for someone");
const llms = existsSync(join(DIST, "llms.txt"))
  ? readFileSync(join(DIST, "llms.txt"), "utf8")
  : null;
if (llms === null) problems.push("llms.txt: missing");
else {
  for (const [url] of llms.matchAll(/https:\/\/metz\.uk\/[^\s)]*/g)) {
    const path = url.replace(SITE, "");
    if (!indexable.has(path)) fail("llms.txt", `links ${url}, which isn't an indexable page`);
  }
  if (EMPLOYERS.test(llms)) fail("llms.txt", `names an employer: "${llms.match(EMPLOYERS)[0]}"`);
  if (NEVER.test(llms)) fail("llms.txt", `mentions "${llms.match(NEVER)[0]}"`);
}

const count = pages.size;
if (warnings.length)
  console.warn(`! ${warnings.length} warning(s), on noindex pages:\n  ` + warnings.join("\n  "));
if (problems.length) {
  console.error(`✗ ${problems.length} problem(s) in ${count} pages:\n  ` + problems.join("\n  "));
  process.exit(1);
}
const drafts = [...pages.values()].filter((p) => p.noindex).length;
console.log(
  `✓ ${count} pages: languages, canonicals, reciprocal hreflang, one h1 each, internal links (${drafts} noindex).`
);
console.log(
  `✓ SEO: JSON-LD @ids resolve, og:images exist at their size, titles ≤ ${TITLE_MAX}, descriptions ${DESCRIPTION.join("–")}; ` +
    `sitemap lists the ${sitemapCount} indexable pages; robots.txt and llms.txt check out.`
);
