// Checks the built site in dist/: every page has a language, a self-canonical and reciprocal hreflang
// alternates (en, de, x-default), exactly one <h1>, and internal links that resolve. Also enforces
// two content rules: employers are named only on the history pages, and a few things never appear.
//
// SEO: every page's JSON-LD parses and each @id it points to is defined on the page; the Person has
// his given and family name and portrait crops that exist at their size (50,000 pixels or more);
// the sitemap lists exactly the indexable pages, with the same alternates as the pages, and the
// portrait for the about pages; every og:image exists at the size the page claims; profile pages
// carry the profile:* tags; titles fit in 65 characters and descriptions in 50–170 (errors on
// indexable pages, warnings on drafts); llms.txt links only indexable pages; the IndexNow key file
// is there. With the full git history, every sitemap URL has a <lastmod>, every profile page a
// dateCreated and dateModified, and llms.txt a "Last updated" line (src/lib/dates.ts).
//
// Privacy and security: the email address never appears in plain text in any file; no image
// carries GPS or XMP metadata; dist/_headers has a CSP whose hashes cover every inline script, and
// no page loads anything from another origin or uses inline event handlers. Internal links to pages
// end with a slash (trailingSlash: "always").
//
// Usage: npm run build && node scripts/verify-dist.mjs (`npm run verify` also runs the browser checks)

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

import { HASH_PLACEHOLDER, cspHash, inlineScripts } from "./lib/inline-scripts.mjs";
import { visibleText } from "./lib/visible-text.mjs";

const DIST = process.env.DIST ?? new URL("../dist/", import.meta.url).pathname;
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
/** His address in any spelling a scraper would match (Email.astro only ships it reversed). */
const EMAIL = /constantin(@|%40|&#0*64;|&#x0*40;)metz\.uk/i;
const TEXT_TYPES = new Set([
  ".html",
  ".xml",
  ".txt",
  ".json",
  ".js",
  ".mjs",
  ".css",
  ".svg",
  ".webmanifest",
  "",
]);
const IMAGE_TYPES = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".ico"]);
/** Google's minimum for structured-data images. */
const MIN_IMAGE_PIXELS = 50_000;
/** Whether this checkout has the history the build dates pages from (not a shallow clone). */
const gitHistory =
  spawnSync("git", ["rev-parse", "--is-shallow-repository"], {
    cwd: new URL("..", import.meta.url),
    encoding: "utf8",
  }).stdout?.trim() === "false";
/** "2026-10-16", optionally with a time and zone. */
const W3C_DATE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2}))?$/;

const all = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else all.push(path);
  }
};
walk(DIST);
const files = all.filter((f) => f.endsWith(".html"));
/** The two 404 pages (one per language): no canonical, no alternates, not in the sitemap. */
const is404 = (path) => /(^|\/)404$/.test(path);

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
/** A JPEG's size, from its first start-of-frame segment. */
const jpegSize = (file) => {
  const b = readFileSync(file);
  if (b[0] !== 0xff || b[1] !== 0xd8) return null;
  for (let i = 2; i + 9 < b.length; i += 2 + b.readUInt16BE(i + 2)) {
    if (b[i] !== 0xff) return null;
    const marker = b[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker))
      return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
  }
  return null;
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
  if (is404(path)) continue;
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
  checkPerson(path, defined.get(`${SITE}/#person`));
  for (const id of new Set(refs))
    if (!defined.has(id) && !SHARED_IDS.has(id))
      fail(path, `JSON-LD points at ${id}, which isn't defined`);
  if (is404(path)) return;

  const page = defined.get(`${SITE}${path}#webpage`);
  if (!page) fail(path, "JSON-LD has no node for the page itself");
  else {
    const want = PROFILE_PAGES.has(path) ? "ProfilePage" : null;
    if (want && page["@type"] !== want) fail(path, `page node is ${page["@type"]}, not ${want}`);
    if (page["@type"] === "ProfilePage" && page.mainEntity?.["@id"] !== `${SITE}/#person`)
      fail(path, "ProfilePage's mainEntity isn't the Person");
    if (page.inLanguage !== p.lang) fail(path, `page node's inLanguage is ${page.inLanguage}`);
  }
  if (page?.["@type"] === "ProfilePage" && gitHistory && !(page.dateCreated && page.dateModified))
    fail(path, "the ProfilePage has no dateCreated/dateModified (from git)");
  for (const key of ["dateCreated", "dateModified"])
    if (page?.[key] && !W3C_DATE.test(page[key])) fail(path, `page node's ${key} is ${page[key]}`);
  const hasCrumbs = data["@graph"].some((n) => n["@type"] === "BreadcrumbList");
  if (!HOME_PAGES.has(path) && !hasCrumbs) fail(path, "no BreadcrumbList");
  if (HISTORY_PAGES.has(path)) {
    const person = defined.get(`${SITE}/#person`);
    if (!person?.worksFor || !person?.alumniOf) fail(path, "the Person has no worksFor/alumniOf");
  } else if (EMPLOYERS.test(p.jsonLd[0]))
    fail(path, `JSON-LD names an employer: "${p.jsonLd[0].match(EMPLOYERS)[0]}"`);
  if (NEVER.test(p.jsonLd[0])) fail(path, `JSON-LD mentions "${p.jsonLd[0].match(NEVER)[0]}"`);
}

/** The Person: his name in parts, and portrait crops that exist at the size claimed, big enough. */
function checkPerson(path, person) {
  if (!person) return;
  if (person.givenName !== "Constantin" || person.familyName !== "Metz")
    fail(path, "the Person has no givenName/familyName");
  const images = [person.image ?? []].flat();
  if (!images.length) fail(path, "the Person has no image");
  for (const img of images) {
    const file = typeof img.url === "string" && join(DIST, img.url.replace(SITE, ""));
    const size = file && existsSync(file) ? jpegSize(file) : null;
    if (!size) fail(path, `the Person's image ${img.url} isn't a JPEG in dist`);
    else if (size.width !== img.width || size.height !== img.height)
      fail(path, `the Person's image ${img.url} is ${size.width}×${size.height}, not ${img.width}×${img.height}`);
    else if (size.width * size.height < MIN_IMAGE_PIXELS)
      fail(path, `the Person's image ${img.url} has fewer than ${MIN_IMAGE_PIXELS} pixels`);
  }
}

/** og:image and twitter:image: present, the file exists, at the size the tags say. */
function checkSocial(path, p) {
  if (meta(p.html, "og:type") === "profile")
    for (const key of ["profile:first_name", "profile:last_name", "profile:username"])
      if (!meta(p.html, key)) fail(path, `og:type is profile, but there's no ${key}`);
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
  [...pages].filter(([path, p]) => !is404(path) && !p.noindex).map(([path]) => path)
);
const sitemapFile = join(DIST, "sitemap.xml");
let sitemapCount = 0;
let sitemapImages = 0;
let withoutLastmod = 0;
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
    const lastmod = block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1];
    if (lastmod && (!W3C_DATE.test(lastmod) || new Date(lastmod) > new Date()))
      fail("sitemap.xml", `${loc}: <lastmod>${lastmod}</lastmod> isn't a date up to today`);
    if (!lastmod) {
      if (gitHistory) fail("sitemap.xml", `${loc} has no <lastmod>`);
      else withoutLastmod++;
    }
    for (const [, image] of block.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)) {
      sitemapImages++;
      if (!image.startsWith(`${SITE}/`) || !existsSync(join(DIST, image.slice(SITE.length))))
        fail("sitemap.xml", `${loc}: image ${image} isn't in dist`);
    }
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
  if (gitHistory && !/^Last updated: \d{4}-\d{2}-\d{2}$/m.test(llms))
    fail("llms.txt", "no \"Last updated\" line");
  if (NEVER.test(llms)) fail("llms.txt", `mentions "${llms.match(NEVER)[0]}"`);
}

// IndexNow (scripts/deploy/indexnow.mjs): one key file at the root, named after its content.
const indexNowKeys = readdirSync(DIST).filter((name) => /^[a-f0-9]{32}\.txt$/.test(name));
if (indexNowKeys.length !== 1)
  problems.push(`IndexNow: want one <key>.txt at the root, found ${indexNowKeys.length}`);
else if (readFileSync(join(DIST, indexNowKeys[0]), "utf8").trim() !== indexNowKeys[0].slice(0, -4))
  problems.push(`IndexNow: ${indexNowKeys[0]} doesn't contain its own name`);

// No plain email anywhere: pages, feeds, sitemap, llms.txt, scripts, styles, _headers.
for (const file of all) {
  if (!TEXT_TYPES.has(extname(file))) continue;
  if (EMAIL.test(readFileSync(file, "utf8")))
    fail(relative(DIST, file), "contains the email address in plain text");
}

// No location or editing metadata in any image (the portrait original carries GPS).
for (const file of all) {
  if (!IMAGE_TYPES.has(extname(file).toLowerCase())) continue;
  const problem = imageMetadata(readFileSync(file));
  if (problem) fail(relative(DIST, file), problem);
}

/** What personal metadata an image carries, or null. */
function imageMetadata(b) {
  for (const tiff of exifBlocks(b)) if (tiffHasGps(tiff)) return "carries GPS EXIF data";
  if (b.includes("http://ns.adobe.com/xap/1.0/") || b.includes("<x:xmpmeta"))
    return "carries XMP metadata";
  return null;
}
/** The TIFF structure of every EXIF block: JPEG APP1 and AVIF ("Exif\0\0"), PNG eXIf, WebP EXIF. */
function exifBlocks(b) {
  const out = [];
  for (let i = b.indexOf("Exif\0\0"); i >= 0; i = b.indexOf("Exif\0\0", i + 6))
    out.push(b.subarray(i + 6));
  const png = b.indexOf("eXIf");
  if (png >= 4) out.push(b.subarray(png + 4, png + 4 + b.readUInt32BE(png - 4)));
  const webp = b.indexOf("EXIF");
  if (webp >= 0) out.push(b.subarray(webp + 8));
  return out;
}
/** Whether IFD0 of a TIFF structure points to a GPS IFD (tag 0x8825). */
function tiffHasGps(t) {
  const order = t.toString("latin1", 0, 2);
  if (t.length < 8 || (order !== "II" && order !== "MM")) return false;
  const le = order === "II";
  const u16 = (o) => (le ? t.readUInt16LE(o) : t.readUInt16BE(o));
  const ifd = le ? t.readUInt32LE(4) : t.readUInt32BE(4);
  if (ifd + 2 > t.length) return false;
  for (let k = 0, n = u16(ifd); k < n && ifd + 14 + k * 12 <= t.length; k++)
    if (u16(ifd + 2 + k * 12) === 0x8825) return true;
  return false;
}

// Security headers: one CSP whose script hashes cover every inline script on every page; no page
// pulls anything from another origin or carries inline event handlers or javascript: URLs.
const headersFile = join(DIST, "_headers");
const headers = existsSync(headersFile) ? readFileSync(headersFile, "utf8") : "";
const csp = headers.match(/^\s+Content-Security-Policy:\s*(.+)$/m)?.[1] ?? "";
if (!csp) problems.push("_headers: missing, or no Content-Security-Policy");
else if (csp.includes(HASH_PLACEHOLDER))
  problems.push("_headers: the CSP still has the hash placeholder");
for (const name of [
  "Strict-Transport-Security",
  "X-Content-Type-Options",
  "Referrer-Policy",
  "Permissions-Policy",
])
  if (!headers.includes(`${name}:`)) problems.push(`_headers: no ${name}`);
const allowed = new Set(csp.match(/'sha256-[^']+'/g) ?? []);
const RESOURCE =
  /<(script|link|img|source|iframe|video|audio)\b[^>]*?\b(?:src|srcset|href)="(?:https?:)?\/\/([^"/]+)/gi;
for (const [path, p] of pages) {
  for (const script of inlineScripts(p.html))
    if (!allowed.has(cspHash(script)))
      fail(path, `inline script not allowed by the CSP: ${script.trim().slice(0, 50)}…`);
  if (/<[a-z][^>]*\son[a-z]+\s*=/i.test(p.html)) fail(path, "inline event handler attribute");
  if (/\bhref="javascript:/i.test(p.html)) fail(path, "javascript: URL");
  for (const [, tag, host] of p.html.matchAll(RESOURCE))
    if (host !== "metz.uk") fail(path, `<${tag}> loads from ${host}`);
  for (const href of p.hrefs) {
    const clean = href.split(/[?#]/)[0];
    if (clean && !clean.endsWith("/") && !extname(clean))
      fail(path, `link without a trailing slash: ${href}`);
  }
}

// Fonts: every character a page shows is in the subset fonts, or known to be missing from Geist
// altogether (it falls back to the system font). Otherwise: node scripts/gen/fonts.mjs.
const fontsManifest = new URL("../src/assets/fonts/fonts.json", import.meta.url);
const fonts = existsSync(fontsManifest)
  ? JSON.parse(readFileSync(fontsManifest, "utf8")).fonts
  : null;
if (!fonts) problems.push("src/assets/fonts/fonts.json: missing (node scripts/gen/fonts.mjs)");
else {
  const known = new Set(Object.values(fonts).flatMap((f) => [...f.covered, ...f.missing]));
  const unknown = new Map();
  for (const [path, p] of pages)
    for (const ch of visibleText(p.html)) {
      const cp = ch.codePointAt(0);
      if (cp >= 0x20 && !known.has(cp) && !unknown.has(ch)) unknown.set(ch, path);
    }
  for (const [ch, path] of unknown)
    fail(
      path,
      `shows "${ch}" (U+${ch.codePointAt(0).toString(16).toUpperCase()}), which the subset fonts don't cover: run node scripts/gen/fonts.mjs`
    );
}

const count = pages.size;
if (withoutLastmod)
  console.warn(
    `! sitemap.xml: ${withoutLastmod} URLs without <lastmod>; this checkout has no git history to date them.`
  );
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
    `sitemap lists the ${sitemapCount} indexable pages${gitHistory ? ", each with a lastmod" : ""}, ` +
    `and ${sitemapImages} image(s); robots.txt, llms.txt and the IndexNow key check out.`
);
console.log(
  `✓ Privacy and security: no plain email in ${all.length} files, no GPS/XMP in images, the CSP allows ` +
    `exactly the ${allowed.size} inline scripts, nothing loads from another origin.`
);
