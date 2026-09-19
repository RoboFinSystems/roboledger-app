import { describe, expect, it } from 'vitest'
import { withoutTaxonomy } from '../blockName'

describe('withoutTaxonomy', () => {
  it('drops a lead segment that is the block’s own taxonomy', () => {
    expect(
      withoutTaxonomy('rs-gaap — Balance Sheet — Classified', {
        taxonomyName: 'rs-gaap',
      })
    ).toBe('Balance Sheet — Classified')
    expect(
      withoutTaxonomy('RoboSystems GAAP — Balance Sheet', {
        taxonomyName: 'RoboSystems GAAP',
      })
    ).toBe('Balance Sheet')
  })

  it('recognises a taxonomy id by shape when the block names none', () => {
    expect(withoutTaxonomy('us-gaap — Cash Flow — Indirect')).toBe(
      'Cash Flow — Indirect'
    )
    expect(withoutTaxonomy('ifrs-full — Statement of Financial Position')).toBe(
      'Statement of Financial Position'
    )
  })

  it('leaves a lead segment that is not a taxonomy', () => {
    expect(withoutTaxonomy('Buffer — 2026-07 Prepaid Amortization')).toBe(
      'Buffer — 2026-07 Prepaid Amortization'
    )
    expect(withoutTaxonomy('Key Financial Metrics')).toBe(
      'Key Financial Metrics'
    )
  })

  it('only ever drops the first segment', () => {
    expect(withoutTaxonomy('rs-gaap — us-gaap — Balance Sheet')).toBe(
      'us-gaap — Balance Sheet'
    )
  })
})
