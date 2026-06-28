import type { Metadata } from 'next'

const TITLE = 'RoboLedger | AI-Native Financial Reporting'
const DESCRIPTION =
  'AI-powered financial reporting platform. Transform natural language requests into complete, validated financial statements powered by Claude AI and RoboSystems.'

export const landingMetadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'AI financial reporting',
    'AI-native accounting',
    'automated financial statements',
    'natural language financial reporting',
    'AI bookkeeping',
    'financial close automation',
    'AI accounting platform',
  ],
  // openGraph/twitter are intentionally inherited from the root layout so the homepage
  // picks up the generated app/opengraph-image.tsx. Defining an openGraph object here
  // (even without images) would shadow that file-convention image.
  alternates: {
    canonical: 'https://roboledger.ai',
  },
}
