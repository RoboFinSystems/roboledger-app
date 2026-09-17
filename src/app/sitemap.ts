import { getAllPosts } from '@/lib/blog'
import { DOCS_SITE, getDocsCatalog, getDocsNav } from '@/lib/docs'
import type { MetadataRoute } from 'next'

/**
 * Newest valid date in a list, or none. A `lastmod` is a real date or absent: a date
 * stamped at request time teaches Bing and Google to ignore the field on every entry,
 * including the posts whose dates are true.
 */
function latestDate(dates: (string | undefined)[]): Date | undefined {
  const ts = dates
    .filter((d): d is string => !!d)
    .map((d) => new Date(d).getTime())
    .filter((n) => !Number.isNaN(n))
  return ts.length ? new Date(Math.max(...ts)) : undefined
}

// RoboLedger's public surface is the marketing homepage, the docs and the blog. Everything else is
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

  // The product docs, from the shared docs catalog; lastmod is each page's last commit.
  const catalog = await getDocsCatalog()
  const docs = catalog && getDocsNav(catalog, DOCS_SITE, 'product')
  const docsPages: MetadataRoute.Sitemap = (docs?.ordered ?? []).map(
    (page) => ({
      url: `${baseUrl}${page.path}`,
      lastModified: page.updated ? new Date(page.updated) : undefined,
      changeFrequency: 'monthly' as const,
      priority: page.slug === 'index' ? 0.9 : 0.8,
    })
  )

  return [
    // No lastModified: the homepage changes on deploys, and nothing here knows when.
    {
      url: baseUrl,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: latestDate(posts.map((p) => p.date)),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...docsPages,
    ...blogPosts,
  ]
}
