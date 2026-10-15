// @ts-check
import mdx from "@astrojs/mdx";
import { defineConfig } from "astro/config";

import postBuild from "./scripts/build/post-build.mjs";
import { SITE_URL } from "./src/site.mjs";

export default defineConfig({
  site: SITE_URL,
  // Cloudflare serves /work as a redirect to /work/; dev and preview should behave the same.
  trailingSlash: "always",
  devToolbar: { enabled: false },
  // A few KB of CSS per page, inline: no render-blocking request before the first paint.
  build: { inlineStylesheets: "always" },
  integrations: [mdx(), postBuild()],
});
