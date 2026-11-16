import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from '@/lib/og'

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = 'RoboLedger Blog'

export default function Image() {
  return renderOgImage({
    eyebrow: 'RoboLedger Blog',
    title: 'Accounting on a ledger your AI can query',
    subtitle:
      'How we put AI on a general ledger: QuickBooks over MCP, a group of companies consolidated, and every number traced to the entry behind it.',
  })
}
