import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetPostBySlug = vi.fn()
const mockRenderOgImage = vi.fn()

vi.mock('@/lib/blog', () => ({
  getPostBySlug: (...args: unknown[]) => mockGetPostBySlug(...args),
}))

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw Object.assign(new Error('NEXT_HTTP_ERROR_FALLBACK;404'), {
      digest: 'NEXT_HTTP_ERROR_FALLBACK;404',
    })
  },
}))

vi.mock('@/lib/og', () => ({
  OG_SIZE: { width: 1200, height: 630 },
  OG_CONTENT_TYPE: 'image/png',
  renderOgImage: (...args: unknown[]) => mockRenderOgImage(...args),
}))

import Image from '../opengraph-image'

describe('blog post card', () => {
  beforeEach(() => {
    mockGetPostBySlug.mockReset()
    mockRenderOgImage.mockReset()
    mockRenderOgImage.mockReturnValue(new Response('png'))
  })

  it("renders the post's title", async () => {
    mockGetPostBySlug.mockResolvedValue({ title: 'A post', excerpt: 'Short' })
    await Image({ params: Promise.resolve({ slug: 'a-post' }) })
    expect(mockRenderOgImage).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'A post', subtitle: 'Short' })
    )
  })

  it('is a 404 for an unknown slug, never a rendered card', async () => {
    mockGetPostBySlug.mockResolvedValue(null)
    await expect(
      Image({ params: Promise.resolve({ slug: 'no-such-post' }) })
    ).rejects.toMatchObject({ digest: expect.stringContaining('404') })
    expect(mockRenderOgImage).not.toHaveBeenCalled()
  })
})
