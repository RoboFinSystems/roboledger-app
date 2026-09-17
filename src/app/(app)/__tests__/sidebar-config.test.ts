import { describe, expect, it } from 'vitest'
import { getNavigationItems } from '../sidebar-config'

describe('getNavigationItems', () => {
  it.each([
    ['without', false],
    ['with', true],
  ])(
    'ends with Docs in a new tab %s a qualifying graph',
    (_, hasQualifyingGraph) => {
      const items = getNavigationItems(hasQualifyingGraph)
      const docs = items[items.length - 1]

      expect(docs).toMatchObject({
        label: 'Docs',
        href: '/docs',
        target: '_blank',
      })
      expect(docs.icon).toBeDefined()
    }
  )

  it('keeps the graph items above the docs link', () => {
    const labels = getNavigationItems(true).map((item) => item.label)

    expect(labels.slice(-2)).toEqual(['Search', 'Docs'])
  })

  it.each([
    ['without', false],
    ['with', true],
  ])(
    'does not link the blog %s a qualifying graph',
    (_, hasQualifyingGraph) => {
      const hrefs = getNavigationItems(hasQualifyingGraph).flatMap((item) => [
        item.href,
        ...(item.items ?? []).map((child) => child.href),
      ])

      expect(hrefs).not.toContain('/blog')
    }
  )
})
