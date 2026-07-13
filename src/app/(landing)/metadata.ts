import type { Metadata } from 'next'

const TITLE = 'RoboLedger | Close Your Books with AI'
const DESCRIPTION =
  'AI-native accounting on a financial knowledge graph. Connect QuickBooks, let Claude triage every transaction in an inbox, close the period with guard rails, and publish validated, XBRL-ready statements — in hours, not days.'

export const landingMetadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'AI-native accounting',
    'AI bookkeeping automation',
    'QuickBooks AI close',
    'automated month-end close',
    'financial close automation',
    'automated financial statements',
    'XBRL reporting',
    'natural language financial reporting',
  ],
  // openGraph/twitter are intentionally inherited from the root layout so the homepage
  // picks up the generated app/opengraph-image.tsx. Defining an openGraph object here
  // (even without images) would shadow that file-convention image.
  alternates: {
    canonical: 'https://roboledger.ai',
  },
}
