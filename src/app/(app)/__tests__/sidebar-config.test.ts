import { describe, expect, it } from 'vitest'
import { getNavigationItems } from '../sidebar-config'

describe('getNavigationItems', () => {
  it.each([
    ['without', false],
    ['with', true],
  ])(
    'ends with Docs and Blog in a new tab %s a qualifying graph',
    (_, hasQualifyingGraph) => {
      const items = getNavigationItems(hasQualifyingGraph)
      const [docs, blog] = items.slice(-2)

      expect(docs).toMatchObject({
        label: 'Docs',
        href: '/docs',
        target: '_blank',
      })
      expect(blog).toMatchObject({
        label: 'Blog',
        href: '/blog',
        target: '_blank',
      })
      expect(docs.icon).toBeDefined()
      expect(blog.icon).toBeDefined()
    }
  )

  it('keeps the graph items above the docs and blog links', () => {
    const labels = getNavigationItems(true).map((item) => item.label)

    expect(labels.slice(-3)).toEqual(['Search', 'Docs', 'Blog'])
  })
})
