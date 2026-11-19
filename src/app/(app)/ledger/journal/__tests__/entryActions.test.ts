import { describe, expect, it } from 'vitest'
import { entryActions, quickBooksMode } from '../entryActions'

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

  it('is mirrored when an external ledger keeps the entity in scope', () => {
    const connections = [
      {
        provider: 'external',
        write_policy: 'shadow',
        entity_id: 'ent_sub',
        keeps_books: true,
      },
      { provider: 'external', write_policy: 'native', keeps_books: false },
    ]
    expect(
      quickBooksMode(connections, { entityId: 'ent_sub', parentId: 'ent_p' })
    ).toBe('mirrored')
    expect(
      quickBooksMode(connections, { entityId: null, parentId: 'ent_p' })
    ).toBe('none')
    // An external source with no word from the API keeps nobody's books.
    expect(quickBooksMode([{ provider: 'external' }])).toBe('none')
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

describe('entryActions on mirrored books', () => {
  const ctx = { closedThrough: null, calendarLoaded: true }
  const posted = {
    status: 'posted',
    postingDate: '2026-09-15',
    provenance: 'source_sync',
  }

  it('offers no reversal: the ledger that keeps the books corrects it', () => {
    const actions = entryActions(posted, { ...ctx, quickBooks: 'mirrored' })
    expect(actions.reverse).toBe(false)
    expect(actions.note).toMatch(/Correct it there/)
  })

  it('still lets an authored draft be edited', () => {
    const actions = entryActions(
      { ...posted, status: 'draft', provenance: 'manual_entry' },
      { ...ctx, quickBooks: 'mirrored' }
    )
    expect(actions.edit).toBe(true)
  })
})
