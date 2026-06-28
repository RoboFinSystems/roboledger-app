import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Everything below is authenticated product surface (the (app) route group) —
      // no SEO value and login-gated, so keep crawlers off it.
      disallow: [
        '/api/',
        '/agents/',
        '/connections/',
        '/console/',
        '/entities/',
        '/entity/',
        '/graphs/',
        '/home/',
        '/ledger/',
        '/library/',
        '/plaid-connect/',
        '/reports/',
        '/search/',
        '/settings/',
      ],
    },
    sitemap: 'https://roboledger.ai/sitemap.xml',
  }
}
