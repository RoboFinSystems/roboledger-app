import { describe, expect, it } from 'vitest'
import type { EnvelopeBlock } from '../../ledger/close/components/blockview/types'
import {
  buildPlanCsv,
  composePlan,
  slicePlan,
  slicePlanSeam,
} from '../planModel'

const envelope = (
  periods: { end: string; label?: string | null; forecast?: boolean | null }[],
  rows: {
    elementId: string
    elementName: string
    itemType?: string | null
    isSubtotal?: boolean
    depth?: number
    values: (number | null)[]
  }[]
): EnvelopeBlock =>
  ({
    view: {
      rendering: {
        periods: periods.map((p) => ({
          start: p.end,
          end: p.end,
          label: p.label ?? null,
          forecast: p.forecast ?? null,
        })),
        rows: rows.map((r) => ({
          elementId: r.elementId,
          elementQname: null,
          elementName: r.elementName,
          classification: null,
          balanceType: null,
          itemType: r.itemType ?? null,
          values: r.values,
          textValue: null,
          isSubtotal: r.isSubtotal ?? false,
          depth: r.depth ?? 0,
        })),
        validation: null,
        unmappedCount: 0,
      },
      chart: null,
    },
  }) as unknown as EnvelopeBlock

describe('composePlan', () => {
  it('unions periods into master columns and aligns section values', () => {
    // Statements span May..Jul; the lever grid covers only Jun..Jul.
    const is = envelope(
      [
        { end: '2026-05-31' },
        { end: '2026-06-30', label: 'Jun 2026 (forecast)', forecast: true },
        { end: '2026-07-31', label: 'Jul 2026 (forecast)', forecast: true },
      ],
      [{ elementId: 'rev', elementName: 'Revenues', values: [100, 103, 106] }]
    )
    const levers = envelope(
      [{ end: '2026-06-30' }, { end: '2026-07-31' }],
      [
        {
          elementId: 'growth',
          elementName: 'RevenueGrowthRate',
          itemType: 'percent',
          values: [0.03, 0.03],
        },
      ]
    )
    const model = composePlan([
      { title: 'Assumptions', envelope: levers },
      { title: 'Income Statement', envelope: is },
    ])

    expect(model.columns.map((c) => c.end)).toEqual([
      '2026-05-31',
      '2026-06-30',
      '2026-07-31',
    ])
    // The seam flag propagates from whichever envelope carries it.
    expect(model.columns.map((c) => c.forecast)).toEqual([false, true, true])

    const [assumptions, incomeStatement] = model.sections
    expect(assumptions.title).toBe('Assumptions')
    // The lever row aligns into master columns: May uncovered → null.
    expect(assumptions.rows[0].values).toEqual([null, 0.03, 0.03])
    expect(incomeStatement.rows[0].values).toEqual([100, 103, 106])
  })

  it('drops sections with no rendering', () => {
    const model = composePlan([
      { title: 'Assumptions', envelope: null },
      {
        title: 'Income Statement',
        envelope: envelope(
          [{ end: '2026-05-31' }],
          [{ elementId: 'rev', elementName: 'Revenues', values: [100] }]
        ),
      },
    ])
    expect(model.sections.map((s) => s.title)).toEqual(['Income Statement'])
  })
})

describe('slicePlan', () => {
  it('cuts columns and every section value in register', () => {
    const model = composePlan([
      {
        title: 'Income Statement',
        envelope: envelope(
          [{ end: '2026-05-31' }, { end: '2026-06-30' }, { end: '2026-07-31' }],
          [{ elementId: 'rev', elementName: 'Revenues', values: [1, 2, 3] }]
        ),
      },
    ])
    const sliced = slicePlan(model, 2)
    expect(sliced.columns.map((c) => c.end)).toEqual(['2026-07-31'])
    expect(sliced.sections[0].rows[0].values).toEqual([3])
  })
})

describe('slicePlanSeam', () => {
  // Four actuals then three forecast months — the seam mid-series.
  const seamModel = () =>
    composePlan([
      {
        title: 'Income Statement',
        envelope: envelope(
          [
            { end: '2026-02-28' },
            { end: '2026-03-31' },
            { end: '2026-04-30' },
            { end: '2026-05-31' },
            { end: '2026-06-30', forecast: true },
            { end: '2026-07-31', forecast: true },
            { end: '2026-08-31', forecast: true },
          ],
          [
            {
              elementId: 'rev',
              elementName: 'Revenues',
              values: [1, 2, 3, 4, 5, 6, 7],
            },
          ]
        ),
      },
    ])

  it('keeps trailing history and LEADING forecast around the seam', () => {
    const sliced = slicePlanSeam(seamModel(), 2, 2)
    expect(sliced.columns.map((c) => c.end)).toEqual([
      '2026-04-30',
      '2026-05-31',
      '2026-06-30',
      '2026-07-31',
    ])
    expect(sliced.sections[0].rows[0].values).toEqual([3, 4, 5, 6])
  })

  it('windows history while keeping the whole forecast', () => {
    const sliced = slicePlanSeam(seamModel(), 1, 'all')
    expect(sliced.columns.map((c) => c.end)).toEqual([
      '2026-05-31',
      '2026-06-30',
      '2026-07-31',
      '2026-08-31',
    ])
    expect(sliced.sections[0].rows[0].values).toEqual([4, 5, 6, 7])
  })

  it('never drops all actuals the way a trailing window would', () => {
    // The regression this exists for: trailing "3" over the composed
    // series would keep only forecast columns. Seam-split "3/3" keeps
    // three actuals too.
    const sliced = slicePlanSeam(seamModel(), 3, 3)
    expect(sliced.columns.filter((c) => !c.forecast).length).toBe(3)
    expect(sliced.columns.filter((c) => c.forecast).length).toBe(3)
  })

  it('returns the model unchanged for all/all', () => {
    const model = seamModel()
    expect(slicePlanSeam(model, 'all', 'all')).toBe(model)
  })

  it('handles an actuals-only series (no seam)', () => {
    const model = composePlan([
      {
        title: 'Income Statement',
        envelope: envelope(
          [{ end: '2026-04-30' }, { end: '2026-05-31' }],
          [{ elementId: 'rev', elementName: 'Revenues', values: [1, 2] }]
        ),
      },
    ])
    const sliced = slicePlanSeam(model, 1, 3)
    expect(sliced.columns.map((c) => c.end)).toEqual(['2026-05-31'])
    expect(sliced.sections[0].rows[0].values).toEqual([2])
  })
})

describe('buildPlanCsv', () => {
  it('emits section-title rows and raw values under period headers', () => {
    const model = composePlan([
      {
        title: 'Income Statement',
        envelope: envelope(
          [
            { end: '2026-05-31' },
            { end: '2026-06-30', label: 'Jun 2026 (forecast)', forecast: true },
          ],
          [{ elementId: 'rev', elementName: 'Revenues', values: [100, 103] }]
        ),
      },
    ])
    const csv = buildPlanCsv(model)
    expect(csv).not.toBeNull()
    const lines = csv!.split('\n')
    expect(lines[0]).toBe('Line Item,2026-05-31,Jun 2026 (forecast)')
    expect(lines[1]).toBe('Income Statement')
    expect(lines[2]).toBe('Revenues,100,103')
  })

  it('returns null for an empty model', () => {
    expect(buildPlanCsv(composePlan([]))).toBeNull()
  })
})
