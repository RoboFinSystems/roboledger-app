import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  PRODUCT_PAGES,
  productPageJsonLd,
  productPageMetadata,
} from '../product-pages'

// The SEO checklist every product page ships against (vault: gtm/content/pages/README.md).
describe.each(PRODUCT_PAGES)('product page $path', (page) => {
  const query = page.query.toLowerCase()

  it('leads the title with the query and keeps it to 60 characters', () => {
    expect(page.title.toLowerCase().startsWith(query)).toBe(true)
    expect(page.title.endsWith('| RoboLedger')).toBe(true)
    expect(page.title.length).toBeLessThanOrEqual(60)
  })

  it('puts the query in a description results show whole', () => {
    expect(page.description.toLowerCase()).toContain(query)
    expect(page.description.length).toBeLessThanOrEqual(160)
  })

  it('puts the query in the H1', () => {
    expect(page.h1.toLowerCase()).toContain(query)
  })

  it('declares a self-referencing absolute canonical', () => {
    expect(productPageMetadata(page).alternates?.canonical).toBe(
      `https://roboledger.ai${page.path}`
    )
  })

  it('carries a real last-modified date', () => {
    expect(page.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(Number.isNaN(new Date(page.updated).getTime())).toBe(false)
  })

  it('links a product docs page', () => {
    expect(page.docsPath.startsWith('/docs/')).toBe(true)
  })

  it('marks up the software and the breadcrumb, with no price', () => {
    const graph = productPageJsonLd(page)['@graph']
    const types = graph.map((node) => node['@type'])
    expect(types).toEqual(['SoftwareApplication', 'BreadcrumbList'])
    expect(graph[0]).not.toHaveProperty('offers')
  })

  it('has a route and its own social card', () => {
    const segment = join(process.cwd(), 'src/app/(pages)', page.path)
    expect(existsSync(join(segment, 'page.tsx'))).toBe(true)
    expect(existsSync(join(segment, 'opengraph-image.tsx'))).toBe(true)
  })
})

describe('product page registry', () => {
  it('gives every page its own path, query and title', () => {
    for (const key of ['path', 'query', 'title'] as const) {
      const values = PRODUCT_PAGES.map((p) => p[key])
      expect(new Set(values).size).toBe(values.length)
    }
  })
})
