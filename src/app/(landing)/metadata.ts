import { SITE_DESCRIPTION, SITE_TITLE } from '@/lib/site'
import type { Metadata } from 'next'

export const landingMetadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  // The group terms lead since the 2026-10-27 refresh (gtm/seo/keywords.md: "multi-entity
  // accounting" rising, "combined vs consolidated" at almost no competition), then the long
  // tail behind the head terms Intuit owns (2026-09-02 SERP sample); the close terms left
  // with the old hero.
  keywords: [
    'multi-entity accounting',
    'consolidated financial statements software',
    'holding company accounting software',
    'accounting software for multiple LLCs',
    'combined vs consolidated financial statements',
    'intercompany eliminations',
    'AI-native accounting',
    'QuickBooks MCP server',
    'connect QuickBooks to Claude',
    'connect QuickBooks to ChatGPT',
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
