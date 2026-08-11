import type { MetadataRoute } from 'next'

// RoboLedger's public surface is thin — the marketing homepage. Everything else is
// behind auth in the (app) route group (see robots.ts); /register redirects to the
// centralized login home and /pages/privacy + /pages/terms are server redirects to
// the consolidated RoboSystems legal docs, so they're intentionally excluded
// (listing redirects in a sitemap is an error).
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
