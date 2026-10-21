import { describe, expect, it } from 'vitest'

import { canDrill, describeFact, originLabel, partLabel } from '../provenance'

describe('describeFact', () => {
  it('reads a pivot with its accounts, hash and line count', () => {
    const d = describeFact({
      origin: 'pivot',
      mapping_id: 'map_1',
      period: '2026-06-01/2026-06-30',
      sources: [
        { entity_id: 'ent_1', account_id: 'acct_4000', value: 1000 },
        { entity_id: 'ent_1', account_id: 'acct_zero', value: 0 },
        { bogus: true },
      ],
      content_hash: 'sha256:abc',
      line_count: 3,
    })
    expect(d).toEqual({
      origin: 'pivot',
      sources: [
        { entity_id: 'ent_1', account_id: 'acct_4000', value: 1000 },
        { entity_id: 'ent_1', account_id: 'acct_zero', value: 0 },
      ],
      postingFilter: null,
      contentHash: 'sha256:abc',
      lineCount: 3,
    })
    expect(canDrill(d)).toBe(true)
    expect(originLabel(d!)).toBe('Summed from accounts')
  })

  it('reads a pivot through a flow filter as the filter, not accounts', () => {
    const d = describeFact({
      origin: 'pivot',
      mapping_id: 'map_1',
      period: 'x',
      sources: null,
      posting_filter: { flow_element: 'rs-gaap:ProceedsFromDebt' },
    })
    expect(d).toMatchObject({
      origin: 'pivot',
      sources: null,
      postingFilter: { flow_element: 'rs-gaap:ProceedsFromDebt' },
    })
    expect(canDrill(d)).toBe(true)
    expect(originLabel(d!)).toMatch(/flow filter/)
  })

  it('reads a rollup with its children and rule', () => {
    const d = describeFact({
      origin: 'rollup',
      rule: 'net_income',
      children: [
        { qname: 'rs-gaap:Revenues', weight: 1 },
        { qname: 'rs-gaap:CostOfRevenue', weight: -1 },
        { qname: 'nope' },
      ],
    })
    expect(d).toEqual({
      origin: 'rollup',
      rule: 'net_income',
      children: [
        { qname: 'rs-gaap:Revenues', weight: 1 },
        { qname: 'rs-gaap:CostOfRevenue', weight: -1 },
      ],
    })
    expect(originLabel(d!)).toBe('Net income: revenue less expenses')
  })

  it('reads a derivation by its parts', () => {
    const d = describeFact({
      origin: 'derived',
      computation: 'pivot+close_to_retained_earnings',
      amounts: { pivot: 1000, close_to_retained_earnings: 250 },
      source_concepts: ['rs-gaap:NetIncomeLoss'],
      sources: [{ entity_id: 'ent_1', account_id: 'acct_3000', value: 1000 }],
    })
    expect(d).toMatchObject({
      origin: 'derived',
      computation: 'pivot+close_to_retained_earnings',
      formula: null,
      amounts: { pivot: 1000, close_to_retained_earnings: 250 },
      sourceConcepts: ['rs-gaap:NetIncomeLoss'],
    })
    expect(canDrill(d)).toBe(true)
    expect(partLabel('pivot+close_to_retained_earnings')).toBe(
      'pivot + close to retained earnings'
    )
  })

  it('keeps another arm as what it says it is, and cannot drill it', () => {
    const d = describeFact({ origin: 'asserted', source_system: 'manual' })
    expect(d).toEqual({
      origin: 'other',
      kind: 'asserted',
      detail: { origin: 'asserted', source_system: 'manual' },
    })
    expect(canDrill(d)).toBe(false)
  })

  it('reads nothing as unknown, never as a claim', () => {
    expect(describeFact(null)).toBeNull()
    expect(describeFact({ mapping_id: 'x' })).toBeNull()
    expect(canDrill(null)).toBe(false)
    expect(canDrill(describeFact({ origin: 'pivot', sources: [] }))).toBe(false)
  })
})
