// Schema.org JSON-LD for a docs page: a TechArticle and its BreadcrumbList. Mirrored in
// robosystems-app, which renders the technical docs from the same catalog.

import type { DocsPage } from '@/lib/docs'

const ORG = {
  name: 'RoboLedger',
  url: 'https://roboledger.ai',
  logo: 'https://roboledger.ai/images/logos/roboledger-icon.png',
}

export interface Crumb {
  name: string
  path: string
}

/** One JSON-LD block. `</` is escaped so page text can never break out of the script. */
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

export function DocsJsonLd({
  page,
  crumbs,
  baseUrl = ORG.url,
}: {
  page: DocsPage
  crumbs: Crumb[]
  baseUrl?: string
}) {
  const url = `${baseUrl}${page.path}`
  const article: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: page.title,
    description: page.description,
    url,
    mainEntityOfPage: url,
    inLanguage: 'en',
    publisher: {
      '@type': 'Organization',
      name: ORG.name,
      url: ORG.url,
      logo: { '@type': 'ImageObject', url: ORG.logo },
    },
  }
  if (page.updated) article.dateModified = page.updated

  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: `${baseUrl}${crumb.path}`,
    })),
  }

  return (
    <>
      <JsonLd data={article} />
      <JsonLd data={breadcrumbs} />
    </>
  )
}
