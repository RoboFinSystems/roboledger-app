// Docs catalog access. The catalog is built by the robosystems repo's Publish Docs workflow
// (robosystems/scripts/publish_docs.py) from two sources, the GitHub wiki (technical docs)
// and docs/product/{site}/ (product pages), and served from the content CDN as one
// index.json plus a markdown body per page. Fetched server-side with ISR, like the blog,
// so every docs page is real HTML for crawlers.
//
// The catalog is shared with robosystems-app: each page carries a `site` and a `layer`,
// and each app renders its own. This app renders roboledger.ai's product pages.

import GithubSlugger from 'github-slugger'

export const DOCS_CATALOG_URL =
  process.env.NEXT_PUBLIC_DOCS_CATALOG_URL ||
  'https://assets.robosystems.ai/docs/index.json'

export const DOCS_REVALIDATE_SECONDS = 300

export const DOCS_SITE = 'roboledger'

export type DocsLayer = 'technical' | 'product'

export interface DocsPage {
  site: string
  layer: DocsLayer
  slug: string
  path: string
  title: string
  description: string
  section: string | null
  order: number
  updated: string | null
  body: string
  source_url: string
}

export interface DocsSection {
  title: string | null
  slugs: string[]
}

export interface DocsCollection {
  site: string
  layer: DocsLayer
  base_path: string
  sections: DocsSection[]
}

export interface DocsCatalog {
  schema_version: number
  digest: string
  collections: DocsCollection[]
  pages: DocsPage[]
}

/** A collection's pages grouped the way its sidebar shows them, index page first. */
export interface DocsNav {
  collection: DocsCollection
  index: DocsPage | undefined
  sections: { title: string | null; pages: DocsPage[] }[]
  ordered: DocsPage[]
}

export interface TocHeading {
  depth: number
  text: string
  id: string
}

export async function getDocsCatalog(): Promise<DocsCatalog | null> {
  try {
    const res = await fetch(DOCS_CATALOG_URL, {
      next: { revalidate: DOCS_REVALIDATE_SECONDS },
    })
    if (!res.ok) throw new Error(`Docs catalog fetch failed: ${res.status}`)
    return (await res.json()) as DocsCatalog
  } catch (error) {
    console.error('Error loading docs catalog:', error)
    return null
  }
}

export function getDocsNav(
  catalog: DocsCatalog,
  site: string,
  layer: DocsLayer
): DocsNav | null {
  const collection = catalog.collections.find(
    (c) => c.site === site && c.layer === layer
  )
  if (!collection) return null
  const pages = new Map(
    catalog.pages
      .filter((p) => p.site === site && p.layer === layer)
      .map((p) => [p.slug, p])
  )
  const sections = collection.sections
    .map((s) => ({
      title: s.title,
      pages: s.slugs
        .filter((slug) => slug !== 'index')
        .map((slug) => pages.get(slug))
        .filter((p): p is DocsPage => !!p),
    }))
    .filter((s) => s.pages.length > 0)
  const index = pages.get('index')
  const ordered = [
    ...(index ? [index] : []),
    ...sections.flatMap((s) => s.pages),
  ]
  return { collection, index, sections, ordered }
}

export function findDocsPage(nav: DocsNav, slug: string): DocsPage | undefined {
  return nav.ordered.find((p) => p.slug === slug)
}

/** The pages before and after one, in sidebar order. */
export function docsNeighbors(
  nav: DocsNav,
  slug: string
): { previous?: DocsPage; next?: DocsPage } {
  const i = nav.ordered.findIndex((p) => p.slug === slug)
  if (i === -1) return {}
  return { previous: nav.ordered[i - 1], next: nav.ordered[i + 1] }
}

/** A page's markdown body. Body keys are relative to the catalog's own URL. */
export async function getDocsBody(page: DocsPage): Promise<string | null> {
  try {
    const res = await fetch(new URL(page.body, DOCS_CATALOG_URL), {
      next: { revalidate: DOCS_REVALIDATE_SECONDS },
    })
    if (!res.ok) throw new Error(`Docs body fetch failed: ${res.status}`)
    return await res.text()
  } catch (error) {
    console.error(`Error loading docs page ${page.path}:`, error)
    return null
  }
}

/** The newest `updated` date across pages, or none. */
export function latestUpdate(pages: DocsPage[]): Date | undefined {
  const times = pages
    .map((p) => (p.updated ? new Date(p.updated).getTime() : NaN))
    .filter((t) => !Number.isNaN(t))
  return times.length ? new Date(Math.max(...times)) : undefined
}

/** Heading text as a reader sees it: inline code, emphasis and link syntax removed. */
function headingText(markdown: string): string {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/(\*\*|__)(.+?)\1/g, '$2')
    .replace(/(^|\W)[*_](\S.*?\S|\S)[*_](?=\W|$)/g, '$1$2')
    .trim()
}

/**
 * Whether a description only restates the body's opening. The publisher derives a
 * description from the first paragraph when a page has none, so showing it above the
 * body would print the same sentence twice.
 */
export function descriptionRepeatsBody(
  description: string,
  body: string
): boolean {
  const plain = (text: string) =>
    headingText(text.replace(/…$/, '')).replace(/\s+/g, ' ').trim()
  const opening = plain(description).slice(0, 60)
  return opening.length > 0 && plain(body.trimStart()).startsWith(opening)
}

/**
 * The page's H2 and H3 headings with the ids rehype-slug gives them. Every heading is
 * slugged in document order, so repeated titles get the same `-1` suffixes the rendered
 * page does; fenced code is skipped.
 */
export function tableOfContents(markdown: string): TocHeading[] {
  const slugger = new GithubSlugger()
  const headings: TocHeading[] = []
  let fence: string | null = null
  for (const line of markdown.split('\n')) {
    const marker = /^\s*(```|~~~)/.exec(line)?.[1]
    if (marker) {
      fence = fence === null ? marker : fence === marker ? null : fence
      continue
    }
    if (fence) continue
    const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line)
    if (!match) continue
    const text = headingText(match[2])
    const id = slugger.slug(text)
    const depth = match[1].length
    if (depth === 2 || depth === 3) headings.push({ depth, text, id })
  }
  return headings
}
