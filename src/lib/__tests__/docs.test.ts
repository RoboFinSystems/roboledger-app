import { describe, expect, it } from 'vitest'
import {
  descriptionRepeatsBody,
  docsNeighbors,
  findDocsPage,
  getDocsNav,
  latestUpdate,
  tableOfContents,
  type DocsCatalog,
  type DocsPage,
} from '../docs'

function page(overrides: Partial<DocsPage>): DocsPage {
  return {
    site: 'robosystems',
    layer: 'technical',
    slug: 'x',
    path: '/docs/technical/x',
    title: 'X',
    description: '',
    section: null,
    order: 0,
    updated: null,
    body: 'technical/x.md',
    source_url: 'https://github.com/RoboFinSystems/robosystems/wiki/X',
    ...overrides,
  }
}

const catalog: DocsCatalog = {
  schema_version: 1,
  digest: 'abc',
  collections: [
    {
      site: 'robosystems',
      layer: 'technical',
      base_path: '/docs/technical',
      sections: [
        { title: 'Getting Started', slugs: ['quick-start', 'core-concepts'] },
        { title: 'Operations', slugs: ['graph-operations', 'missing-page'] },
        { title: 'Empty', slugs: [] },
      ],
    },
    {
      site: 'roboledger',
      layer: 'product',
      base_path: '/docs',
      sections: [{ title: null, slugs: ['index', 'connect'] }],
    },
  ],
  pages: [
    page({
      slug: 'index',
      path: '/docs/technical',
      title: 'Technical documentation',
      updated: '2026-08-23T19:15:24-05:00',
    }),
    page({
      slug: 'quick-start',
      title: 'Quick Start',
      updated: '2026-09-09T12:00:00-05:00',
    }),
    page({ slug: 'core-concepts', title: 'Core Concepts' }),
    page({ slug: 'graph-operations', title: 'Graph Operations' }),
    page({
      site: 'roboledger',
      layer: 'product',
      slug: 'index',
      path: '/docs',
    }),
    page({
      site: 'roboledger',
      layer: 'product',
      slug: 'connect',
      path: '/docs/connect',
    }),
  ],
}

describe('getDocsNav', () => {
  it('groups one collection by its sections, index page first', () => {
    const nav = getDocsNav(catalog, 'robosystems', 'technical')!
    expect(nav.index?.slug).toBe('index')
    expect(
      nav.sections.map((s) => [s.title, s.pages.map((p) => p.slug)])
    ).toEqual([
      ['Getting Started', ['quick-start', 'core-concepts']],
      ['Operations', ['graph-operations']],
    ])
    expect(nav.ordered.map((p) => p.slug)).toEqual([
      'index',
      'quick-start',
      'core-concepts',
      'graph-operations',
    ])
  })

  it('keeps each site and layer apart', () => {
    const nav = getDocsNav(catalog, 'roboledger', 'product')!
    expect(nav.index?.path).toBe('/docs')
    expect(nav.ordered.map((p) => p.slug)).toEqual(['index', 'connect'])
  })

  it('returns null for a collection the catalog does not have', () => {
    expect(getDocsNav(catalog, 'roboinvestor', 'product')).toBeNull()
  })
})

describe('findDocsPage and docsNeighbors', () => {
  const nav = getDocsNav(catalog, 'robosystems', 'technical')!

  it('finds a page by slug', () => {
    expect(findDocsPage(nav, 'core-concepts')?.title).toBe('Core Concepts')
    expect(findDocsPage(nav, 'nope')).toBeUndefined()
  })

  it('links previous and next in sidebar order', () => {
    expect(docsNeighbors(nav, 'quick-start')).toEqual({
      previous: nav.ordered[0],
      next: nav.ordered[2],
    })
    expect(docsNeighbors(nav, 'index').previous).toBeUndefined()
    expect(docsNeighbors(nav, 'graph-operations').next).toBeUndefined()
    expect(docsNeighbors(nav, 'nope')).toEqual({})
  })
})

describe('latestUpdate', () => {
  it('is the newest valid date, or none', () => {
    const nav = getDocsNav(catalog, 'robosystems', 'technical')!
    expect(latestUpdate(nav.ordered)?.toISOString()).toBe(
      '2026-09-09T17:00:00.000Z'
    )
    expect(latestUpdate([page({ updated: null })])).toBeUndefined()
  })
})

describe('tableOfContents', () => {
  it('lists H2 and H3 with the ids rehype-slug gives them', () => {
    const markdown = [
      '## CI/CD & Deployment',
      'text',
      '### Authenticated REST: `GET /whoami`',
      '#### Too deep',
      '## [Linked](Other) heading',
    ].join('\n')
    expect(tableOfContents(markdown)).toEqual([
      { depth: 2, text: 'CI/CD & Deployment', id: 'cicd--deployment' },
      {
        depth: 3,
        text: 'Authenticated REST: GET /whoami',
        id: 'authenticated-rest-get-whoami',
      },
      { depth: 2, text: 'Linked heading', id: 'linked-heading' },
    ])
  })

  it('numbers repeated headings the way the rendered page does', () => {
    const markdown = '## Setup\n#### Setup\n## Setup\n'
    expect(tableOfContents(markdown).map((h) => h.id)).toEqual([
      'setup',
      'setup-2',
    ])
  })

  it('skips headings inside fenced code', () => {
    const markdown = '```bash\n## not a heading\n```\n## Real\n'
    expect(tableOfContents(markdown)).toEqual([
      { depth: 2, text: 'Real', id: 'real' },
    ])
  })
})

describe('descriptionRepeatsBody', () => {
  it('is true when the description was taken from the opening paragraph', () => {
    const body =
      'RoboSystems is multi-tenant at the graph layer: every dataset is keyed by a `graph_id`. More.'
    expect(
      descriptionRepeatsBody(
        'RoboSystems is multi-tenant at the graph layer: every dataset is keyed by a graph_id.',
        body
      )
    ).toBe(true)
    expect(
      descriptionRepeatsBody(
        'This guide takes you from an empty checkout to a running stack and your first\u2026',
        'This guide takes you from an empty checkout to a running stack and your first query.'
      )
    ).toBe(true)
  })

  it('is false for a written description', () => {
    expect(
      descriptionRepeatsBody(
        'How Claude closes a month on RoboLedger.',
        'Closing a month in RoboLedger locks the period.'
      )
    ).toBe(false)
    expect(descriptionRepeatsBody('', 'Body')).toBe(false)
  })
})
