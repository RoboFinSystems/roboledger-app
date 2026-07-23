import { describe, expect, it } from 'vitest'
import type { EnvelopeBlock } from '../../ledger/close/components/blockview/types'
import { buildPlanCsv, composePlan, slicePlan } from '../planModel'

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
