import { afterEach, describe, expect, it, vi } from 'vitest'

const mockGetAllPosts = vi.fn()

vi.mock('@/lib/blog', () => ({
  getAllPosts: () => mockGetAllPosts(),
}))

import sitemap from '../sitemap'

const posts = [
  { slug: 'ai-native-accounting', date: '2026-07-29' },
  { slug: 'claude-ledger', date: '2026-07-26' },
]

// A lastmod is a real date or absent. A date stamped at request time teaches Bing and
// Google to ignore the field on every entry, including the posts whose dates are true.
describe('sitemap', () => {
  afterEach(() => {
    vi.clearAllMocks()
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
