import { DocsArticle } from '@/components/docs/DocsArticle'
import {
  DOCS_SITE,
  findDocsPage,
  getDocsBody,
  getDocsCatalog,
  getDocsNav,
} from '@/lib/docs'
import { SITE_NAME } from '@/lib/site'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

// RoboLedger's product docs at roboledger.ai/docs, written in the robosystems repo under
// docs/product/roboledger/ and published to the shared docs catalog. The index page is
// the docs home.

export const revalidate = 300

const BASE_URL = 'https://roboledger.ai'

type Props = { params: Promise<{ slug?: string[] }> }

async function load(slug?: string[]) {
  if (slug && slug.length > 1) return null
  const catalog = await getDocsCatalog()
  const nav = catalog && getDocsNav(catalog, DOCS_SITE, 'product')
  const page = nav && findDocsPage(nav, slug?.[0] ?? 'index')
  return nav && page ? { nav, page } : null
}

export async function generateStaticParams() {
  const catalog = await getDocsCatalog()
  const nav = catalog && getDocsNav(catalog, DOCS_SITE, 'product')
  return (nav?.ordered ?? []).map((page) => ({
    slug: page.slug === 'index' ? [] : [page.slug],
  }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await load((await params).slug)
  if (!found) return { title: `Page Not Found | ${SITE_NAME} Docs` }
  const { page } = found
  const url = `${BASE_URL}${page.path}`
  const title =
    page.slug === 'index' ? page.title : `${page.title} | ${SITE_NAME} Docs`
  return {
    title,
    description: page.description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      siteName: SITE_NAME,
      title,
      description: page.description,
      modifiedTime: page.updated ?? undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: page.description,
    },
  }
}

export default async function ProductDocsPage({ params }: Props) {
  const found = await load((await params).slug)
  if (!found) notFound()
  const body = await getDocsBody(found.page)
  if (body === null) notFound()

  const { nav, page } = found
  const crumbs = [
    { name: 'Docs', path: nav.collection.base_path },
    ...(page.slug === 'index' ? [] : [{ name: page.title, path: page.path }]),
  ]

  return (
    <DocsArticle
      nav={nav}
      page={page}
      body={body}
      crumbs={crumbs}
      collectionTitle="RoboLedger docs"
      baseUrl={BASE_URL}
    />
  )
}
