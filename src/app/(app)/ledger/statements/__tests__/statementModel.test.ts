import type { LiveFinancialStatementResponse } from '@robosystems/client/types'
import { describe, expect, it } from 'vitest'
import {
  buildStatementModel,
  periodCaption,
  rowChange,
} from '../statementModel'

// Wire shape: [Current, Prior], rows post-order (children, then subtotal).
const BALANCE_SHEET: LiveFinancialStatementResponse = {
  graph_id: 'kg1',
  statement_type: 'balance_sheet',
  periods: [
    { start: '2026-01-01', end: '2026-09-18', label: 'Current' },
    { start: '2025-01-01', end: '2025-09-18', label: 'Prior' },
  ],
  facts: [
    {
      qname: 'us-gaap:Cash',
      name: 'Cash',
      values: [19112.3, 2043.95],
      depth: 2,
    },
    {
      qname: 'us-gaap:ShortTermInvestments',
      name: 'Short-Term Investments',
      values: [26000, 0],
      depth: 2,
    },
    {
      qname: 'us-gaap:AssetsCurrent',
      name: 'Assets, Current',
      values: [45112.3, 2043.95],
      depth: 1,
      is_subtotal: true,
    },
    {
      qname: 'us-gaap:PropertyPlantAndEquipmentNet',
      name: 'Property, Plant and Equipment, Net',
      values: [7439.26, 8901.31],
      depth: 2,
    },
    {
      qname: 'us-gaap:AssetsNoncurrent',
      name: 'Assets, Noncurrent',
      values: [7439.26, 8901.31],
      depth: 1,
      is_subtotal: true,
    },
    {
      qname: 'us-gaap:Assets',
      name: 'Assets',
      values: [52551.56, 10945.26],
      depth: 0,
      is_subtotal: true,
    },
  ],
  fact_count: 6,
}

describe('buildStatementModel', () => {
  it('orders columns oldest to newest and permutes every row to match', () => {
    const model = buildStatementModel(BALANCE_SHEET)
    expect(model.columns.map((c) => c.label)).toEqual(['Prior', 'Current'])
    expect(model.rows[0].values).toEqual([2043.95, 19112.3])
    expect(model.rows[5].values).toEqual([10945.26, 52551.56])
  })

  it('leaves an already-chronological response alone', () => {
    const model = buildStatementModel({
      ...BALANCE_SHEET,
      periods: [...BALANCE_SHEET.periods].reverse(),
    })
    expect(model.columns.map((c) => c.label)).toEqual(['Prior', 'Current'])
    expect(model.rows[0].values).toEqual([19112.3, 2043.95])
  })
})

describe('periodCaption', () => {
  const period = { start: '2026-01-01', end: '2026-09-18', label: 'Current' }

  it('dates a balance sheet as a point in time', () => {
    expect(periodCaption(period, 'balance_sheet')).toBe('As of Sep 18, 2026')
  })

  it('dates a flow statement as a window, naming a shared year once', () => {
    expect(periodCaption(period, 'income_statement')).toBe(
      'Jan 1 – Sep 18, 2026'
    )
  })

  it('names both years when the window crosses one', () => {
    expect(
      periodCaption(
        { start: '2025-10-01', end: '2026-03-31', label: 'Current' },
        'income_statement'
      )
    ).toBe('Oct 1, 2025 – Mar 31, 2026')
  })
})

describe('rowChange', () => {
  it('is the latest column minus the one before it', () => {
    const change = rowChange([2043.95, 19112.3])
    expect(change?.amount).toBeCloseTo(17068.35)
    expect(change?.percent).toBeCloseTo(8.3507, 3)
  })

  it('measures percent against the magnitude of a negative base', () => {
    expect(rowChange([-100, -50])).toEqual({ amount: 50, percent: 0.5 })
  })

  it('has no percent off a zero base', () => {
    expect(rowChange([0, 26000])).toEqual({ amount: 26000, percent: null })
  })

  it('is null without two values to compare', () => {
    expect(rowChange([19112.3])).toBeNull()
    expect(rowChange([null, 19112.3])).toBeNull()
  })
})
