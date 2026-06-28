import type { MetadataRoute } from 'next'

// RoboLedger's public surface is thin — the marketing homepage and register. Everything
// else is behind auth in the (app) route group (see robots.ts), and /pages/privacy +
// /pages/terms are server redirects to the consolidated RoboSystems legal docs, so they're
// intentionally excluded (listing redirects in a sitemap is an error).
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://roboledger.ai'

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ]
}
