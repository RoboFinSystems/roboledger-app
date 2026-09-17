import { afterEach, describe, expect, it, vi } from 'vitest'

const mockGetAllPosts = vi.fn()
const mockGetDocsCatalog = vi.fn()

vi.mock('@/lib/blog', () => ({
  getAllPosts: () => mockGetAllPosts(),
}))

// Only the fetch is replaced; the nav grouping is the real one.
vi.mock('@/lib/docs', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getDocsCatalog: () => mockGetDocsCatalog(),
}))

import type { DocsCatalog, DocsPage } from '@/lib/docs'
import sitemap from '../sitemap'

const posts = [
  { slug: 'ai-native-accounting', date: '2026-07-29' },
  { slug: 'claude-ledger', date: '2026-07-26' },
]

function docsPage(slug: string, updated: string | null): DocsPage {
  return {
    site: 'roboledger',
    layer: 'product',
    slug,
    path: slug === 'index' ? '/docs' : `/docs/${slug}`,
    title: slug,
    description: '',
    section: null,
    order: 0,
    updated,
    body: `product/roboledger/${slug}.md`,
    source_url: '',
  }
}

const docsCatalog: DocsCatalog = {
  schema_version: 1,
  digest: 'abc',
  collections: [
    {
      site: 'roboledger',
      layer: 'product',
      base_path: '/docs',
      sections: [{ title: null, slugs: ['index', 'connect', 'close'] }],
    },
    {
      site: 'robosystems',
      layer: 'technical',
      base_path: '/docs/technical',
      sections: [{ title: 'Getting Started', slugs: ['quick-start'] }],
    },
  ],
  pages: [
    docsPage('index', '2026-09-17T01:00:00-05:00'),
    docsPage('connect', '2026-09-16T12:00:00-05:00'),
    docsPage('close', null),
    {
      ...docsPage('quick-start', '2026-08-09T22:40:55-05:00'),
      site: 'robosystems',
      layer: 'technical',
      path: '/docs/technical/quick-start',
    },
  ],
}

// A lastmod is a real date or absent. A date stamped at request time teaches Bing and
// Google to ignore the field on every entry, including the posts whose dates are true.
describe('sitemap', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it("lists this site's docs pages, dated by their last commit", async () => {
    mockGetAllPosts.mockResolvedValue(posts)
    mockGetDocsCatalog.mockResolvedValue(docsCatalog)
    const docs = (await sitemap()).filter((e) => e.url.includes('/docs'))

    expect(docs).toEqual([
      {
        url: 'https://roboledger.ai/docs',
        lastModified: new Date('2026-09-17T01:00:00-05:00'),
        changeFrequency: 'monthly',
        priority: 0.9,
      },
      {
        url: 'https://roboledger.ai/docs/connect',
        lastModified: new Date('2026-09-16T12:00:00-05:00'),
        changeFrequency: 'monthly',
        priority: 0.8,
      },
      {
        url: 'https://roboledger.ai/docs/close',
        lastModified: undefined,
        changeFrequency: 'monthly',
        priority: 0.8,
      },
    ])
  })

  it('leaves the docs out, and keeps everything else, when the docs catalog is unreachable', async () => {
    mockGetAllPosts.mockResolvedValue(posts)
    mockGetDocsCatalog.mockResolvedValue(null)
    const urls = (await sitemap()).map((e) => e.url)

    expect(urls.some((u) => u.includes('/docs'))).toBe(false)
    expect(urls).toContain('https://roboledger.ai/blog/claude-ledger')
  })

  it('sends no lastmod for the homepage', async () => {
    mockGetAllPosts.mockResolvedValue(posts)
    const home = (await sitemap()).find(
      (e) => e.url === 'https://roboledger.ai'
    )

    expect(home).toBeDefined()
    expect(home?.lastModified).toBeUndefined()
  })

  it('dates the blog hub by its newest post and each post by its own date', async () => {
    mockGetAllPosts.mockResolvedValue(posts)
    const entries = await sitemap()
    const byUrl = new Map(entries.map((e) => [e.url, e.lastModified]))

    expect(byUrl.get('https://roboledger.ai/blog')).toEqual(
      new Date('2026-07-29')
    )
    expect(byUrl.get('https://roboledger.ai/blog/claude-ledger')).toEqual(
      new Date('2026-07-26')
    )
  })

  it('sends no lastmod for the hub when the catalog is empty or unreachable', async () => {
    mockGetAllPosts.mockRejectedValue(new Error('catalog down'))
    const hub = (await sitemap()).find(
      (e) => e.url === 'https://roboledger.ai/blog'
    )

    expect(hub?.lastModified).toBeUndefined()
  })

  it('is byte-identical across fetches', async () => {
    mockGetAllPosts.mockResolvedValue(posts)
    const first = JSON.stringify(await sitemap())
    await new Promise((resolve) => setTimeout(resolve, 5))
    const second = JSON.stringify(await sitemap())

    expect(second).toEqual(first)
  })
})
