import type { MetadataRoute } from 'next'

// RoboLedger's public surface is thin — the marketing homepage. Everything else is
// behind auth in the (app) route group (see robots.ts); /register is de-indexed
// ahead of the centralized-login flip (registration lives on the login home), and
// /pages/privacy + /pages/terms are server redirects to the consolidated
// RoboSystems legal docs, so they're intentionally excluded.
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://roboledger.ai'

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]
}
