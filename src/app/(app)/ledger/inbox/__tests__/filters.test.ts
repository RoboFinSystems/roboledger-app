import { describe, expect, it, vi } from 'vitest'

vi.mock('@robosystems/core', () => ({}))

import {
  EVENT_TYPE_OPTIONS,
  SOURCE_OPTIONS,
  SUGGESTION_OPTIONS,
  summarizeBatch,
} from '../content'

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

  it('can narrow to the learned suggestions, the ones a batch approval is for', () => {
    expect(SUGGESTION_OPTIONS.map((o) => o.value)).toEqual(
      expect.arrayContaining(['agent_default', 'tier0', 'none'])
    )
  })

  it("summarizes a batch in the reviewer's words", () => {
    const result = {
      selected: 3,
      classified: 0,
      committed: 2,
      skipped: 1,
      truncated: false,
      dry_run: false,
      lines: [
        { event_id: 'a', outcome: 'committed', reason: null, detail: null },
        { event_id: 'b', outcome: 'committed', reason: null, detail: null },
        {
          event_id: 'c',
          outcome: 'skipped',
          reason: 'no_suggestion',
          detail: null,
        },
      ],
    } as any
    expect(summarizeBatch(result, (id) => id.toUpperCase())).toEqual({
      summary: 'Posted 2 of 3; 1 left as they were.',
      details: ['C: no suggestion to take'],
    })
  })
})
