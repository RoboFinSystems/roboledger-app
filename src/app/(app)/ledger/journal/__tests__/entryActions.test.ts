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

  it('reads the connection that keeps the entity in scope, not the graph', () => {
    const parents = [
      {
        provider: 'quickbooks',
        write_policy: 'qb_authoritative',
        entity_id: 'ent_parent',
      },
    ]
    const onParent = { entityId: null, parentId: 'ent_parent' }
    const onSubsidiary = { entityId: 'ent_sub', parentId: 'ent_parent' }

    expect(quickBooksMode(parents, onParent)).toBe('writeback')
    expect(quickBooksMode(parents, onSubsidiary)).toBe('none')
    // A connection from before connections named their entity is the parent's.
    expect(quickBooksMode([{ provider: 'quickbooks' }], onSubsidiary)).toBe(
      'none'
    )
    expect(quickBooksMode([{ provider: 'quickbooks' }], onParent)).toBe(
      'synced'
    )
  })

  it('skips a connection the API says no longer keeps the books', () => {
    const scope = { entityId: null, parentId: 'ent_parent' }
    expect(
      quickBooksMode(
        [
          {
            provider: 'quickbooks',
            write_policy: 'qb_authoritative',
            entity_id: 'ent_parent',
            keeps_books: false,
          },
          {
            provider: 'quickbooks',
            write_policy: 'shadow',
            entity_id: 'ent_parent',
            keeps_books: true,
          },
        ],
        scope
      )
    ).toBe('synced')
  })
})
