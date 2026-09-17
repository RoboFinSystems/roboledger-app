import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from '@/lib/og'
import { SITE_TITLE } from '@/lib/site'

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = SITE_TITLE

export default function Image() {
  return renderOgImage({
    eyebrow: 'RoboLedger',
    title: 'Connect your books. Ask Claude.',
    subtitle: 'Sync QuickBooks into a graph Claude can reason over.',
  })
}
