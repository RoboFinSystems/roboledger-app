import { describe, expect, it, vi } from 'vitest'

vi.mock('../../opengraph-image', () => ({
  default: vi.fn(
    async () =>
      new Response('png', {
        headers: {
          'Content-Type': 'image/png',
          'cache-control': 'public, max-age=0, must-revalidate',
        },
      })
  ),
}))

import renderPostCard from '../../opengraph-image'
import { GET } from '../route'

describe('GET /blog/[slug]/og.png', () => {
  it("serves the post's card with a day of CDN caching, not ImageResponse's max-age=0", async () => {
    const params = Promise.resolve({ slug: 'a-post' })
    const res = await GET(new Request('https://example.test'), { params })

    expect(renderPostCard).toHaveBeenCalledWith({ params })
    expect(res.headers.get('Content-Type')).toBe('image/png')
    expect(res.headers.get('Cache-Control')).toBe(
      'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800'
    )
  })
})
