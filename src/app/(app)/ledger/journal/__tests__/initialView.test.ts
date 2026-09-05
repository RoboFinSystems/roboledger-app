import { describe, expect, it } from 'vitest'

import { initialViewFromSearch } from '../content'

describe('initialViewFromSearch', () => {
  it('defaults to entries', () => {
    // The journal is the complete record; the transaction list is partial,
    // so a bare visit must not open on the view that hides closing entries.
    expect(initialViewFromSearch('')).toBe('entries')
    expect(initialViewFromSearch('?foo=bar')).toBe('entries')
  })

  it('opens transactions when the link asks for it', () => {
    // home's "Recent Transactions → View all" means transactions.
    expect(initialViewFromSearch('?view=transactions')).toBe('transactions')
    expect(initialViewFromSearch('?a=1&view=transactions&b=2')).toBe(
      'transactions'
    )
  })

  it('ignores an unrecognized view', () => {
    expect(initialViewFromSearch('?view=nonsense')).toBe('entries')
    expect(initialViewFromSearch('?view=')).toBe('entries')
  })
})
