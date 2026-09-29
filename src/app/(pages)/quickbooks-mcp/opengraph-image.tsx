import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from '@/lib/og'
import { getProductPage } from '@/lib/product-pages'

const page = getProductPage('/quickbooks-mcp')

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = page.title

export default function Image() {
  return renderOgImage({
    eyebrow: page.ogEyebrow,
    title: page.h1,
    subtitle: page.ogSubtitle,
  })
}
