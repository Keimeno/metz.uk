// @ts-check
import mdx from "@astrojs/mdx";
import { defineConfig } from "astro/config";

import { SITE_URL } from "./src/site.mjs";

export default defineConfig({
  site: SITE_URL,
  trailingSlash: "ignore",
  devToolbar: { enabled: false },
  build: { inlineStylesheets: "auto" },
  integrations: [mdx()],
});
