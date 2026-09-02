import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { formatPostDate, getAllPosts, getPostBySlug } from '../blog'

// One shared catalog, three posts: an essay with no `site` (robosystems.ai by default) and
// two roboledger.ai posts out of date order, so the lane filter and the sort both show.
const catalog = {
  posts: [
    {
      slug: 'graph-essay',
      title: 'Graph essay',
      date: '2026-07-30',
      author: 'Joey French',
      excerpt: 'graph',
      assets: { body: 'https://cdn.test/blog/graph-essay/post.md' },
    },
    {
      slug: 'claude-ledger',
      site: 'roboledger',
      title: 'Claude in the Ledger',
      date: '2026-07-26',
      author: 'Joey French',
      excerpt: 'ledger',
      reading_time_minutes: 7,
      canonical_url: 'https://roboledger.ai/blog/claude-ledger',
      assets: {
        body: 'https://cdn.test/blog/claude-ledger/post.md',
        narration_mp3: 'https://cdn.test/blog/claude-ledger/narration.mp3',
      },
    },
    {
      slug: 'export-chain',
      site: 'roboledger',
      title: 'Export chain',
      date: '2026-07-29',
      author: 'Joey French',
      excerpt: 'exports',
      assets: { body: 'https://cdn.test/blog/export-chain/post.md' },
    },
  ],
}

const bodies: Record<string, string> = {
  'https://cdn.test/blog/claude-ledger/post.md': '# The ledger\n\nBody.',
}

function fetchStub(url: string) {
  if (url.endsWith('/blog/index.json')) {
    return Promise.resolve({ ok: true, json: async () => catalog })
  }
  if (url in bodies) {
    return Promise.resolve({ ok: true, text: async () => bodies[url] })
  }
  return Promise.resolve({ ok: false, status: 404 })
}

describe('blog catalog', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(fetchStub))
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('lists only this lane, newest first', async () => {
    const posts = await getAllPosts()
    expect(posts.map((p) => p.slug)).toEqual(['export-chain', 'claude-ledger'])
    expect(posts[1]).toMatchObject({
      site: 'roboledger',
      readingTime: '7 min read',
      canonicalUrl: 'https://roboledger.ai/blog/claude-ledger',
      narrationUrl: 'https://cdn.test/blog/claude-ledger/narration.mp3',
    })
  })

  it('loads the body for a post in this lane', async () => {
    const post = await getPostBySlug('claude-ledger')
    expect(post?.content).toBe('# The ledger\n\nBody.')
  })

  it('treats a post from the other site as unknown', async () => {
    expect(await getPostBySlug('graph-essay')).toBeNull()
  })

  it('degrades to an empty lane when the catalog is unreachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline')))
    )
    expect(await getAllPosts()).toEqual([])
    expect(await getPostBySlug('claude-ledger')).toBeNull()
  })
})

describe('formatPostDate', () => {
  it('prints a date-only string as that day in any timezone', () => {
    expect(formatPostDate('2026-07-26')).toBe('July 26, 2026')
    expect(formatPostDate('2026-07-26', 'short')).toBe('Jul 26, 2026')
  })

  it('passes an unparseable value through', () => {
    expect(formatPostDate('soon')).toBe('soon')
  })
})
