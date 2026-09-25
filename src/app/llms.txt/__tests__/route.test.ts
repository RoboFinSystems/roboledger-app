import type * as Docs from '@/lib/docs'
import { afterEach, describe, expect, it, vi } from 'vitest'

const mockGetAllPosts = vi.fn()
const mockGetDocsCatalog = vi.fn()

vi.mock('@/lib/blog', () => ({
  getAllPosts: () => mockGetAllPosts(),
}))

vi.mock('@/lib/docs', async (importOriginal) => ({
  ...(await importOriginal<typeof Docs>()),
  getDocsCatalog: () => mockGetDocsCatalog(),
}))

import { GET } from '../route'

describe('GET /llms.txt', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('maps the site from the docs and blog catalogs', async () => {
    mockGetDocsCatalog.mockResolvedValue({
      schema_version: 1,
      digest: '',
      collections: [
        {
          site: 'roboledger',
          layer: 'product',
          base_path: '/docs',
          sections: [{ title: null, slugs: ['month-end-close'] }],
        },
      ],
      pages: [
        {
          site: 'roboledger',
          layer: 'product',
          slug: 'month-end-close',
          path: '/docs/month-end-close',
          title: 'Month-end close',
          description: 'Draft the close,\nthen post it.',
          section: null,
          order: 0,
          updated: null,
          body: '',
          source_url: '',
        },
      ],
    })
    mockGetAllPosts.mockResolvedValue([
      {
        slug: 'quickbooks-mcp',
        title: 'QuickBooks MCP',
        date: '2026-09-24',
        author: 'Joey French',
        excerpt: 'The excerpt.',
      },
    ])

    const res = await GET()
    const body = await res.text()

    expect(res.headers.get('Content-Type')).toContain('text/plain')
    expect(body.startsWith('# RoboLedger\n\n> ')).toBe(true)
    expect(body).toContain(
      '- [Month-end close](https://roboledger.ai/docs/month-end-close): Draft the close, then post it.'
    )
    expect(body).toContain(
      '- [QuickBooks MCP](https://roboledger.ai/blog/quickbooks-mcp): The excerpt.'
    )
    expect(body).toContain('https://robosystems.ai/about')
  })

  it('still serves the page when the catalogs are unreachable', async () => {
    mockGetDocsCatalog.mockResolvedValue(null)
    mockGetAllPosts.mockRejectedValue(new Error('CDN down'))

    const res = await GET()

    expect(res.status).toBe(200)
    expect(await res.text()).toContain('# RoboLedger')
  })
})
