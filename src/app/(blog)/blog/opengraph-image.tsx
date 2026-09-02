import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from '@/lib/og'

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = 'RoboLedger Blog'

export default function Image() {
  return renderOgImage({
    eyebrow: 'RoboLedger Blog',
    title: 'Accounting on a ledger Claude can query',
    subtitle:
      'Connect QuickBooks, ask the first question, share the statement, plan, compare. The close comes last.',
  })
}
