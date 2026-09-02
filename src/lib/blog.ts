// Blog catalog access. Posts are authored and published by robosystems-content-machine to
// s3://robosystems-content/blog/ and served via the CloudFront CDN: one blog/index.json
// catalog plus a post.md (and optional narration mp3) per post. The catalog is shared with
// robosystems-app; each app keeps the posts whose `site` matches its lane, so a post moves
// between roboledger.ai and robosystems.ai by editing one frontmatter line and reindexing.
// Fetched server-side (SSG/ISR) so the blog stays statically rendered for SEO.

const BLOG_CATALOG_URL =
  process.env.NEXT_PUBLIC_BLOG_CATALOG_URL ||
  'https://assets.robosystems.ai/blog/index.json'

/** The lane this app renders. A catalog entry without a `site` belongs to robosystems.ai. */
export const BLOG_SITE = 'roboledger'

export interface BlogPost {
  slug: string
  site: string
  title: string
  date: string
  author: string
  excerpt: string
  metaDescription?: string
  tags?: string[]
  keywords?: string[]
  readingTime?: string
  canonicalUrl?: string
  narrationUrl?: string
  content?: string // raw markdown body; only populated by getPostBySlug
}

interface CatalogEntry {
  slug: string
  site?: string
  title: string
  date: string
  author: string
  excerpt: string
  metaDescription?: string
  tags?: string[]
  keywords?: string[]
  reading_time_minutes?: number
  canonical_url?: string
  assets?: { body?: string; narration_mp3?: string }
}

function toPost(e: CatalogEntry): BlogPost {
  return {
    slug: e.slug,
    site: e.site ?? 'robosystems',
    title: e.title,
    date: e.date,
    author: e.author,
    excerpt: e.excerpt,
    metaDescription: e.metaDescription,
    tags: e.tags ?? [],
    keywords: e.keywords,
    readingTime: e.reading_time_minutes
      ? `${e.reading_time_minutes} min read`
      : undefined,
    canonicalUrl: e.canonical_url,
    narrationUrl: e.assets?.narration_mp3,
  }
}

async function fetchCatalog(revalidate = 300): Promise<CatalogEntry[]> {
  const res = await fetch(BLOG_CATALOG_URL, { next: { revalidate } })
  if (!res.ok) throw new Error(`Blog catalog fetch failed: ${res.status}`)
  const data = (await res.json()) as { posts?: CatalogEntry[] }
  return data.posts ?? []
}

/** This lane's posts, newest first. */
export async function getAllPosts(): Promise<BlogPost[]> {
  try {
    const entries = await fetchCatalog()
    return entries
      .map(toPost)
      .filter((p) => p.site === BLOG_SITE)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  } catch (error) {
    console.error('Error loading blog catalog:', error)
    return []
  }
}

export async function getPostSlugs(): Promise<string[]> {
  const posts = await getAllPosts()
  return posts.map((p) => p.slug)
}

/**
 * One post with its markdown body, or null when the slug is unknown or the post belongs
 * to another site. This lane is new, so there are no legacy URLs to keep answering: a
 * robosystems.ai essay requested here is a 404, not a duplicate.
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const entries = await fetchCatalog()
    const entry = entries.find((e) => e.slug === slug)
    if (!entry) return null
    const post = toPost(entry)
    if (post.site !== BLOG_SITE) return null
    if (entry.assets?.body) {
      const res = await fetch(entry.assets.body, { next: { revalidate: 300 } })
      if (res.ok) post.content = await res.text()
    }
    return post
  } catch (error) {
    console.error(`Error loading post ${slug}:`, error)
    return null
  }
}

/**
 * "July 26, 2026" (or "Jul 26, 2026") from the catalog's ISO date. Pinned to UTC: a
 * date-only string parses as UTC midnight, and formatting it in a US timezone would
 * print the day before.
 */
export function formatPostDate(
  iso: string,
  style: 'long' | 'short' = 'long'
): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: style,
    day: 'numeric',
  }).format(d)
}
