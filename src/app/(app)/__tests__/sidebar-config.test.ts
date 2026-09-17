import { describe, expect, it } from 'vitest'
import { getNavigationItems } from '../sidebar-config'

describe('getNavigationItems', () => {
  it('ends with the graph items', () => {
    const labels = getNavigationItems(true).map((item) => item.label)

    expect(labels[labels.length - 1]).toBe('Search')
  })

  // The docs are reached from the user menu (core's CoreNavbar) and from the page each
  // guide explains; the blog is read on the public site.
  it.each([
    ['without', false],
    ['with', true],
  ])(
    'links neither the docs nor the blog %s a qualifying graph',
    (_, hasQualifyingGraph) => {
      const hrefs = getNavigationItems(hasQualifyingGraph).flatMap((item) => [
        item.href,
        ...(item.items ?? []).map((child) => child.href),
      ])

      expect(hrefs).not.toContain('/docs')
      expect(hrefs).not.toContain('/blog')
    }
  )
})
