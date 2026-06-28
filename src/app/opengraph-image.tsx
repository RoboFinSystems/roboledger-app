import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from '@/lib/og'

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = 'RoboLedger | AI-Native Financial Reporting'

export default function Image() {
  return renderOgImage({
    eyebrow: 'RoboLedger',
    title: 'AI-Native Financial Reporting',
    subtitle:
      'Turn natural language into complete, validated financial statements.',
  })
}
