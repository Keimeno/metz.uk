// One social card per page and language, at the path og.ts derives from the page's own.
import type { APIRoute, GetStaticPaths, InferGetStaticPropsType } from "astro";

import { ogSlug } from "../../lib/og";
import { renderOgCard } from "../../lib/og-render";
import { getSitePages } from "../../lib/pages";

export const getStaticPaths = (async () => {
  const pages = await getSitePages();
  return pages.map((page) => ({ params: { slug: ogSlug(page.path) }, props: { card: page.card } }));
}) satisfies GetStaticPaths;

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export const GET: APIRoute<Props> = async ({ props }) =>
  new Response(await renderOgCard(props.card), { headers: { "Content-Type": "image/png" } });
