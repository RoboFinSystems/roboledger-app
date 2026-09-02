import { getAllPosts } from '@/lib/blog'
import type { MetadataRoute } from 'next'

/** Newest valid date in a list, or `now` when none, so the hub `lastmod` stays honest. */
function latestDate(dates: (string | undefined)[]): Date {
  const ts = dates
    .filter((d): d is string => !!d)
    .map((d) => new Date(d).getTime())
    .filter((n) => !Number.isNaN(n))
  return ts.length ? new Date(Math.max(...ts)) : new Date()
}

// RoboLedger's public surface is the marketing homepage and the blog. Everything else is
// behind auth in the (app) route group (see robots.ts); /register is de-indexed ahead of
// the centralized-login flip (registration lives on the login home), and /pages/privacy +
// /pages/terms are server redirects to the consolidated RoboSystems legal docs, so they
// are intentionally excluded.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://roboledger.ai'

  // This lane's posts, from the shared S3 catalog.
  const posts = await getAllPosts().catch(() => [])
  const blogPosts = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: latestDate(posts.map((p) => p.date)),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...blogPosts,
  ]
}
