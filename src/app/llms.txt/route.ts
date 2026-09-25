import { getAllPosts } from '@/lib/blog'
import type { DocsPage } from '@/lib/docs'
import { DOCS_SITE, getDocsCatalog, getDocsNav } from '@/lib/docs'
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/site'

// llms.txt (llmstxt.org): a plain-markdown map of the site for language models. Built from
// the same docs and blog catalogs as the sitemap, so it cannot list a page that is gone.

const BASE_URL = 'https://roboledger.ai'

export const revalidate = 300

function link(title: string, url: string, note?: string): string {
  const text = note?.replace(/\s+/g, ' ').trim()
  return text ? `- [${title}](${url}): ${text}` : `- [${title}](${url})`
}

function docsLinks(pages: DocsPage[]): string[] {
  return pages.map((p) => link(p.title, `${BASE_URL}${p.path}`, p.description))
}

export async function GET() {
  const [catalog, posts] = await Promise.all([
    getDocsCatalog(),
    getAllPosts().catch(() => []),
  ])
  const docs = catalog
    ? (getDocsNav(catalog, DOCS_SITE, 'product')?.ordered ?? [])
    : []

  const body = [
    `# ${SITE_NAME}`,
    '',
    `> ${SITE_DESCRIPTION}`,
    '',
    'RoboLedger is a finance layer on top of QuickBooks, not a replacement ledger. It syncs the books into a knowledge graph that Claude, ChatGPT, or any MCP client can query at https://api.robosystems.ai/v1/mcp/roboledger: financial statements, forecasts that roll off actuals, comparisons with public companies from their SEC filings, and a month-end close that is drafted for review. Nothing is written back to QuickBooks until a person posts it. It is built on RoboSystems (https://robosystems.ai), open source under Apache 2.0, by RFS LLC.',
    '',
    '## Docs',
    ...docsLinks(docs),
    '',
    '## Blog',
    ...posts.map((post) =>
      link(
        post.title,
        `${BASE_URL}/blog/${post.slug}`,
        post.metaDescription || post.excerpt
      )
    ),
    '',
    '## Company',
    link(
      'About RoboSystems',
      'https://robosystems.ai/about',
      'who builds RoboLedger and the company behind it'
    ),
    link('RoboSystems platform', 'https://robosystems.ai/platform'),
    '',
  ].join('\n')

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
