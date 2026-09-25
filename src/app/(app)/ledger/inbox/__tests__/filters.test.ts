import { describe, expect, it, vi } from 'vitest'

vi.mock('@robosystems/core', () => ({}))

import { EVENT_TYPE_OPTIONS, SOURCE_OPTIONS } from '../content'

describe('Inbox filters', () => {
  it('can narrow to the bank feed, the queue the Inbox exists for', () => {
    const sources = SOURCE_OPTIONS.map((o) => o.value)
    expect(sources).toEqual(expect.arrayContaining(['plaid', 'mercury']))
    const types = EVENT_TYPE_OPTIONS.map((o) => o.value)
    expect(types).toEqual(
      expect.arrayContaining([
        'bank_transaction',
        'bank_fee',
        'external_transfer',
        'internal_transfer',
      ])
    )
  })
})
