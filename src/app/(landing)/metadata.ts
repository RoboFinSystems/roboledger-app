import type { Metadata } from 'next'

const TITLE = 'RoboLedger | Connect Your Books. Ask Claude.'
const DESCRIPTION =
  'Sync QuickBooks into a graph Claude can reason over. Analyze, share statements that tie, plan off your actuals, and compare your numbers to public companies. Nothing writes back until you post an entry.'

export const landingMetadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  // The long tail behind the head terms Intuit owns (2026-09-02 SERP sample); the close
  // terms left with the old hero.
  keywords: [
    'AI-native accounting',
    'connect QuickBooks to Claude',
    'Claude QuickBooks integration',
    'analyze QuickBooks data with AI',
    'benchmark small business against public companies',
    'QuickBooks scenario planning AI',
    'financial knowledge graph',
    'XBRL reporting',
  ],
  // openGraph/twitter are intentionally inherited from the root layout so the homepage
  // picks up the generated app/opengraph-image.tsx. Defining an openGraph object here
  // (even without images) would shadow that file-convention image.
  alternates: {
    canonical: 'https://roboledger.ai',
  },
}
