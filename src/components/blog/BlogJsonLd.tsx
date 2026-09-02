// Schema.org JSON-LD for the blog: a per-post BlogPosting (plus AudioObject when a
// narration exists) with a BreadcrumbList, and an ItemList for the index hub. Mirrors
// robosystems-app's component so the two lanes stay aligned; the publisher is RoboLedger.
// There is no per-post image in the blog catalog yet, so the org logo stands in.

import type { BlogPost } from '@/lib/blog'

const ORG = {
  name: 'RoboLedger',
  url: 'https://roboledger.ai',
  logo: 'https://roboledger.ai/images/logos/roboledger.png',
}

export const BLOG_DESCRIPTION =
  'Connect QuickBooks, ask Claude the first question, share the statement, plan the quarter, compare against public filers. The close comes last.'

/** One JSON-LD block. `</` is escaped so post text can never break out of the script. */
function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  )
}

/** Per-post structured data for `/blog/{slug}`: BlogPosting + BreadcrumbList. */
export function BlogJsonLd({
  post,
  baseUrl = ORG.url,
}: {
  post: BlogPost
  baseUrl?: string
}) {
  const url = `${baseUrl}/blog/${post.slug}`
  const keywords = (post.keywords?.length ? post.keywords : post.tags)?.join(
    ', '
  )

  const blogPosting: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.metaDescription || post.excerpt,
    author: { '@type': 'Person', name: post.author },
    datePublished: post.date,
    dateModified: post.date,
    publisher: {
      '@type': 'Organization',
      name: ORG.name,
      url: ORG.url,
      logo: { '@type': 'ImageObject', url: ORG.logo },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    image: ORG.logo,
    keywords: keywords || undefined,
    audio: post.narrationUrl
      ? {
          '@type': 'AudioObject',
          contentUrl: post.narrationUrl,
          name: `${post.title}: narration`,
        }
      : undefined,
  }

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${baseUrl}/blog`,
      },
      { '@type': 'ListItem', position: 3, name: post.title, item: url },
    ],
  }

  return (
    <>
      <JsonLd data={blogPosting} />
      <JsonLd data={breadcrumb} />
    </>
  )
}

/** ItemList structured data for the `/blog` index: the post hub as a list. */
export function BlogListJsonLd({
  posts,
  baseUrl = ORG.url,
}: {
  posts: BlogPost[]
  baseUrl?: string
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'RoboLedger Blog',
    description: BLOG_DESCRIPTION,
    itemListElement: posts.map((post, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${baseUrl}/blog/${post.slug}`,
      name: post.title,
    })),
  }
  return <JsonLd data={data} />
}
