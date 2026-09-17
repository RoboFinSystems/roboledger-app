import { BLOG_DESCRIPTION } from '@/components/blog/BlogJsonLd'
import { getAllPosts } from '@/lib/blog'

// RSS 2.0 for the roboledger.ai lane: readers, aggregators and search engines pick new
// posts up from here without waiting on a sitemap recrawl. Same catalog and cadence as
// the pages.

const BASE_URL = 'https://roboledger.ai'

export const revalidate = 300

function xml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function rfc822(iso: string): string | undefined {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? undefined : d.toUTCString()
}

export async function GET() {
  const posts = await getAllPosts()

  const items = posts.map((post) => {
    const url = `${BASE_URL}/blog/${post.slug}`
    const pubDate = rfc822(post.date)
    return [
      '    <item>',
      `      <title>${xml(post.title)}</title>`,
      `      <link>${url}</link>`,
      `      <guid isPermaLink="true">${url}</guid>`,
      pubDate ? `      <pubDate>${pubDate}</pubDate>` : '',
      `      <dc:creator>${xml(post.author)}</dc:creator>`,
      `      <description>${xml(post.metaDescription || post.excerpt)}</description>`,
      '    </item>',
    ]
      .filter(Boolean)
      .join('\n')
  })

  // Newest post first (getAllPosts sorts), so its date is the feed's; never request time.
  const lastBuildDate = posts[0] ? rfc822(posts[0].date) : undefined

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    '  <channel>',
    '    <title>RoboLedger Blog</title>',
    `    <link>${BASE_URL}/blog</link>`,
    `    <description>${xml(BLOG_DESCRIPTION)}</description>`,
    '    <language>en-us</language>',
    `    <atom:link href="${BASE_URL}/blog/feed.xml" rel="self" type="application/rss+xml"/>`,
    lastBuildDate ? `    <lastBuildDate>${lastBuildDate}</lastBuildDate>` : '',
    ...items,
    '  </channel>',
    '</rss>',
  ]
    .filter(Boolean)
    .join('\n')

  return new Response(body, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
