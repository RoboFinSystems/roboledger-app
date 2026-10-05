import { describe, expect, it } from 'vitest'
import { quickBooksMode } from '../entryActions'

describe('quickBooksMode', () => {
  it('is none without a QuickBooks connection', () => {
    expect(quickBooksMode([])).toBe('none')
    expect(quickBooksMode([{ provider: 'plaid', write_policy: null }])).toBe(
      'none'
    )
  })

  it('is synced for a QuickBooks connection that writes nothing back', () => {
    expect(
      quickBooksMode([{ provider: 'QuickBooks', write_policy: 'native' }])
    ).toBe('synced')
    expect(quickBooksMode([{ provider: 'quickbooks' }])).toBe('synced')
  })

  it('is writeback when close publishes to QuickBooks', () => {
    expect(
      quickBooksMode([{ provider: 'quickbooks', write_policy: 'hybrid' }])
    ).toBe('writeback')
    expect(
      quickBooksMode([
        { provider: 'quickbooks', write_policy: 'native' },
        { provider: 'quickbooks', write_policy: 'qb_authoritative' },
      ])
    ).toBe('writeback')
  })
})
