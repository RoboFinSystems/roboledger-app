import { afterEach, describe, expect, it, vi } from 'vitest'

const mockGetAllPosts = vi.fn()

vi.mock('@/lib/blog', () => ({
  getAllPosts: () => mockGetAllPosts(),
}))

import { GET } from '../route'

describe('GET /blog/feed.xml', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('lists the lane newest first, escaped, dated by the newest post', async () => {
    mockGetAllPosts.mockResolvedValue([
      {
        slug: 'ai-native-accounting',
        title: 'Accounting Runs on a Chain of Exports & Claude',
        date: '2026-07-29',
        author: 'Joey French',
        excerpt: 'Why AI cannot <yet> do it.',
      },
      {
        slug: 'claude-ledger',
        title: 'Claude in the Ledger',
        date: '2026-07-26',
        author: 'Joey French',
        excerpt: 'ledger',
        metaDescription: 'The meta description wins.',
      },
    ])

    const res = await GET()
    const body = await res.text()

    expect(res.headers.get('Content-Type')).toContain('application/rss+xml')
    expect(body).toContain(
      '<title>Accounting Runs on a Chain of Exports &amp; Claude</title>'
    )
    expect(body).toContain('Why AI cannot &lt;yet&gt; do it.')
    expect(body).toContain(
      '<description>The meta description wins.</description>'
    )
    expect(body).toContain(
      '<guid isPermaLink="true">https://roboledger.ai/blog/claude-ledger</guid>'
    )
    expect(body.indexOf('ai-native-accounting')).toBeLessThan(
      body.indexOf('claude-ledger')
    )
    expect(body).toContain(
      `<lastBuildDate>${new Date('2026-07-29').toUTCString()}</lastBuildDate>`
    )
  })

  it('is a valid empty channel when the lane has no posts', async () => {
    mockGetAllPosts.mockResolvedValue([])

    const body = await (await GET()).text()

    expect(body).toContain('<channel>')
    expect(body).not.toContain('<item>')
    expect(body).not.toContain('<lastBuildDate>')
  })
})
