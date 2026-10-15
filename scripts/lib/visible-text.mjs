// The text a reader can see on a built page: text nodes, the alt, title and aria-label attributes
// (and the email's reversed address, which CSS draws), and CSS `content` strings. Shared by the
// font subsetter (scripts/gen/fonts.mjs) and verify-dist's font coverage check.

/** The text a reader can see on one built page. */
export function visibleText(html) {
  const css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)]
    .flatMap(([, s]) => [...s.matchAll(/content:\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]))
    .join(" ");
  const attrs = [...html.matchAll(/\s(?:alt|title|aria-label|placeholder|data-addr)="([^"]*)"/g)]
    .map((m) => m[1])
    .join(" ");
  const text = html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ");
  return (text + " " + attrs + " " + css)
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(
      /&(quot|apos|lt|gt|amp);/g,
      (_, e) => ({ quot: '"', apos: "'", lt: "<", gt: ">", amp: "&" })[e]
    );
}
