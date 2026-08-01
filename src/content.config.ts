// Projects and posts, each as `<id>/en.mdx` + `<id>/de.mdx`. The pairing (and the build failing
// when a language is missing) is checked in `src/lib/content.ts`.

import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

/** "<id>/<lang>", from the file path (never from a `slug` field). */
const generateId = ({ entry }: { entry: string }) => entry.replace(/\.mdx$/, "");

const projects = defineCollection({
  loader: glob({ pattern: "*/{en,de}.mdx", base: "./src/content/projects", generateId }),
  schema: z.object({
    title: z.string(),
    headline: z.string().max(140),
    description: z.string().min(50).max(180),
    role: z.string().max(80),
    stack: z.array(z.string()).min(1).max(10),
    facts: z
      .array(z.object({ value: z.string(), label: z.string(), note: z.string().optional() }))
      .max(6)
      .default([]),
  }),
});

const posts = defineCollection({
  loader: glob({ pattern: "*/{en,de}.mdx", base: "./src/content/posts", generateId }),
  schema: z.object({
    title: z.string(),
    description: z.string().min(50).max(180),
    /** The URL segment in this language. */
    slug: z.string().regex(/^[a-z0-9-]+$/),
    published: z.coerce.date(),
    updated: z.coerce.date().optional(),
    /** Drafts are listed and readable, marked as drafts, and kept out of search and RSS. */
    draft: z.boolean().default(false),
  }),
});

export const collections = { projects, posts };
