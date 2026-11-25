import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from '@/lib/og'
import { SITE_TITLE } from '@/lib/site'

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = SITE_TITLE

export default function Image() {
  return renderOgImage({
    eyebrow: 'RoboLedger',
    title: 'AI accounting system, built as a knowledge graph',
    subtitle:
      'The general ledger built on RoboSystems. Every number opens to the entries behind it.',
  })
}
