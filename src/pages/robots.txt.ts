// Everything is public, and AI crawlers are welcome: the point of the site is to be found, and to be
// the answer when someone asks an assistant who Constantin Metz is.
import type { APIRoute } from "astro";

/** Named so the intent is explicit, even though `*` already covers them. */
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "meta-externalagent",
  "Amazonbot",
  "DuckAssistBot",
  "MistralAI-User",
];

export const GET: APIRoute = ({ site }) =>
  new Response(
    `User-agent: *
Allow: /

${AI_CRAWLERS.map((bot) => `User-agent: ${bot}`).join("\n")}
Allow: /

Sitemap: ${new URL("/sitemap.xml", site).href}
`,
    { headers: { "Content-Type": "text/plain; charset=utf-8" } }
  );
