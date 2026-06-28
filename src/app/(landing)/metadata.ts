import type { Metadata } from 'next'

const TITLE = 'RoboLedger | AI-Native Financial Reporting'
const DESCRIPTION =
  'AI-powered financial reporting platform. Transform natural language requests into complete, validated financial statements powered by Claude AI and RoboSystems.'
const OG_IMAGE = '/images/logos/roboledger.png'

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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://roboledger.ai',
    siteName: 'RoboLedger',
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: OG_IMAGE, width: 1024, height: 1024, alt: 'RoboLedger' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
    site: '@robofinsystems',
    creator: '@robofinsystems',
  },
  alternates: {
    canonical: 'https://roboledger.ai',
  },
}
