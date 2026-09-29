// Product pages: one page per query whose search results are the product itself (repos,
// directories, vendor pages) rather than articles. Each page's metadata, structured data,
// sitemap entry, llms.txt line and footer link come from this registry, so a page cannot
// ship half-wired; __tests__/product-pages.test.ts checks every entry against the SEO rules.

import type { Metadata } from 'next'
import { SITE_NAME } from './site'

const SITE_URL = 'https://roboledger.ai'
const ORGANIZATION_ID = 'https://robosystems.ai/#organization'

export interface ProductPage {
  /** URL path, also the route segment under app/(pages). */
  path: string
  /** The one query this page answers. It leads the title and appears in the H1. */
  query: string
  /** <title>: the query first, then `| RoboLedger`. */
  title: string
  /** Search snippet: contains the query, 160 characters or fewer. */
  description: string
  h1: string
  /** Footer link label. */
  navLabel: string
  /** Social-card eyebrow and subtitle. */
  ogEyebrow: string
  ogSubtitle: string
  /** The product docs page every claim on the page is checked against. */
  docsPath: string
  /** Last substantive edit (YYYY-MM-DD): the sitemap's lastmod. */
  updated: string
}

export const PRODUCT_PAGES: ProductPage[] = [
  {
    path: '/quickbooks-mcp',
    query: 'quickbooks mcp',
    title: 'QuickBooks MCP Server for Claude and ChatGPT | RoboLedger',
    description:
      'The QuickBooks MCP server for Claude, ChatGPT and any MCP client. Accounts map to standard reporting concepts, and nothing writes back until you post.',
    h1: 'QuickBooks MCP server for Claude, ChatGPT and any MCP client',
    navLabel: 'QuickBooks MCP',
    ogEyebrow: 'QuickBooks MCP',
    ogSubtitle:
      'Sync QuickBooks into a ledger your AI can query. Nothing writes back until you post.',
    docsPath: '/docs/connect-your-books',
    updated: '2026-09-29',
  },
]

export function getProductPage(path: string): ProductPage {
  const page = PRODUCT_PAGES.find((p) => p.path === path)
  if (!page) throw new Error(`No product page registered at ${path}`)
  return page
}

export function productPageUrl(page: ProductPage): string {
  return `${SITE_URL}${page.path}`
}

export function productPageMetadata(page: ProductPage): Metadata {
  const url = productPageUrl(page)
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: url },
    openGraph: {
      title: page.title,
      description: page.description,
      type: 'website',
      url,
      // og:image comes from the generated opengraph-image.tsx in the page's segment.
    },
    twitter: {
      card: 'summary_large_image',
      title: page.title,
      description: page.description,
    },
  }
}

export function productPageJsonLd(page: ProductPage) {
  const url = productPageUrl(page)
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: SITE_NAME,
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web',
        // No `offers`: the marketing site is price-silent (see structured-data.ts).
        description: page.description,
        url,
        image: `${SITE_URL}/images/logos/roboledger-icon.png`,
        publisher: { '@id': ORGANIZATION_ID },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: SITE_NAME, item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: page.navLabel, item: url },
        ],
      },
    ],
  }
}
