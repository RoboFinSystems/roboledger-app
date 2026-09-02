import { getPostBySlug } from '@/lib/blog'
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from '@/lib/og'

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = 'RoboLedger Blog'

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPostBySlug(slug).catch(() => null)
  const excerpt = post?.excerpt || ''
  // Trim to a word boundary so the subtitle never cuts mid-word.
  const subtitle =
    excerpt.length > 100
      ? `${excerpt.slice(0, 100).replace(/\s+\S*$/, '')}…`
      : excerpt
  return renderOgImage({
    eyebrow: 'RoboLedger Blog',
    title: post?.title || 'RoboLedger Blog',
    subtitle,
  })
}
