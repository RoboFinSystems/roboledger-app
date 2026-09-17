import { SITE_DESCRIPTION, SITE_TITLE } from '@/lib/site'
import type { Metadata } from 'next'

export const landingMetadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
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
