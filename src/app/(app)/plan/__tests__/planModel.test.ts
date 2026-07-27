import { describe, expect, it } from 'vitest'
import type { EnvelopeBlock } from '../../ledger/close/components/blockview/types'
import {
  buildPlanCsv,
  buildPlanJson,
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

  it('masks assumption values in columns that are already history', () => {
    // The scenario's horizon opened in April; April and May have since
    // closed, so the statements carry actuals there while the lever
    // grid still holds the assertion that was made for them.
    const is = envelope(
      [
        { end: '2026-04-30' },
        { end: '2026-05-31' },
        { end: '2026-06-30', label: 'Jun 2026 (forecast)', forecast: true },
      ],
      [{ elementId: 'rev', elementName: 'Revenues', values: [90, 95, 103] }]
    )
    const levers = envelope(
      [{ end: '2026-04-30' }, { end: '2026-05-31' }, { end: '2026-06-30' }],
      [
        {
          elementId: 'growth',
          elementName: 'RevenueGrowthRate',
          itemType: 'percent',
          values: [0.03, 0.03, 0.03],
        },
      ]
    )
    const model = composePlan([
      { title: 'Assumptions', envelope: levers, forecastOnly: true },
      { title: 'Income Statement', envelope: is },
    ])

    expect(model.columns.map((c) => c.forecast)).toEqual([false, false, true])
    // Only the forward month keeps its assertion.
    expect(model.sections[0].rows[0].values).toEqual([null, null, 0.03])
    // Statements are untouched — actuals still render across the seam.
    expect(model.sections[1].rows[0].values).toEqual([90, 95, 103])
  })

  it('treats scenario-only months as forecast before statements are stamped', () => {
    // Authored but never computed: no statement covers the horizon, so
    // nothing carries the seam flag. The lever months are still forward
    // — masking them would blank the whole assumptions block.
    const is = envelope(
      [{ end: '2026-05-31' }],
      [{ elementId: 'rev', elementName: 'Revenues', values: [95] }]
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
      { title: 'Assumptions', envelope: levers, forecastOnly: true },
      { title: 'Income Statement', envelope: is },
    ])

    expect(model.columns.map((c) => c.forecast)).toEqual([false, true, true])
    expect(model.sections[0].rows[0].values).toEqual([null, 0.03, 0.03])
  })

  it('reads assumptions-only columns BEFORE the actual range as history, not forecast', () => {
    // Windowed statement reads trim the actual columns server-side; an
    // assumptions envelope whose axis wasn't windowed (an older
    // backend) still spans the full history. Those extra columns sit
    // BEFORE the statements' window — flagging them forward made the
    // seam slicer's "first N forecast columns" land on the OLDEST
    // history months (the phantom "Jul 24 F" bug).
    const is = envelope(
      [
        { end: '2026-03-31' },
        { end: '2026-04-30' },
        { end: '2026-05-31' },
        { end: '2026-06-30', label: 'Jun 2026 (forecast)', forecast: true },
      ],
      [
        {
          elementId: 'rev',
          elementName: 'Revenues',
          values: [95, 97, 99, 103],
        },
      ]
    )
    const levers = envelope(
      [
        { end: '2024-07-31' },
        { end: '2024-08-31' },
        { end: '2026-03-31' },
        { end: '2026-04-30' },
        { end: '2026-05-31' },
        { end: '2026-06-30', forecast: true },
      ],
      [
        {
          elementId: 'growth',
          elementName: 'RevenueGrowthRate',
          itemType: 'percent',
          values: [0.18, 0.54, 0.01, 0.02, 0.02, 0.03],
        },
      ]
    )
    const model = composePlan([
      { title: 'Assumptions', envelope: levers, forecastOnly: true },
      { title: 'Income Statement', envelope: is },
    ])

    // Pre-window assumption columns are out-of-window HISTORY.
    expect(model.columns.map((c) => c.forecast)).toEqual([
      false,
      false,
      false,
      false,
      false,
      true,
    ])
    // The seam slicer therefore keeps seam-adjacent columns, never the
    // oldest phantoms.
    const sliced = slicePlanSeam(model, 3, 3)
    expect(sliced.columns.map((c) => c.end)).toEqual([
      '2026-03-31',
      '2026-04-30',
      '2026-05-31',
      '2026-06-30',
    ])
  })

  it('keeps historical lever values when the envelope marks its own seam', () => {
    // The server now back-solves each lever against the closed months
    // and flags only its forward columns — those historical cells are
    // realized rates, not stale assertions, so they render as-is.
    const is = envelope(
      [
        { end: '2026-04-30' },
        { end: '2026-05-31' },
        { end: '2026-06-30', label: 'Jun 2026 (forecast)', forecast: true },
      ],
      [{ elementId: 'rev', elementName: 'Revenues', values: [90, 95, 103] }]
    )
    const levers = envelope(
      [
        { end: '2026-04-30' },
        { end: '2026-05-31' },
        { end: '2026-06-30', forecast: true },
      ],
      [
        {
          elementId: 'growth',
          elementName: 'RevenueGrowthRate',
          itemType: 'percent',
          values: [0.021, 0.038, 0.03],
        },
      ]
    )
    const model = composePlan([
      { title: 'Assumptions', envelope: levers, forecastOnly: true },
      { title: 'Income Statement', envelope: is },
    ])

    expect(model.sections[0].rows[0].values).toEqual([0.021, 0.038, 0.03])
  })

  it('drops a lever row left with nothing to say', () => {
    // A fully elapsed horizon: every lever month has closed.
    const is = envelope(
      [{ end: '2026-04-30' }, { end: '2026-05-31' }],
      [{ elementId: 'rev', elementName: 'Revenues', values: [90, 95] }]
    )
    const levers = envelope(
      [{ end: '2026-04-30' }, { end: '2026-05-31' }],
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
      { title: 'Assumptions', envelope: levers, forecastOnly: true },
      { title: 'Income Statement', envelope: is },
    ])
    expect(model.sections.map((s) => s.title)).toEqual(['Income Statement'])
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

describe('buildPlanJson', () => {
  const model = () =>
    composePlan([
      {
        title: 'Assumptions',
        envelope: envelope(
          [{ end: '2026-06-30', forecast: true }],
          [
            {
              elementId: 'growth',
              elementName: 'RevenueGrowthRate',
              itemType: 'percent',
              values: [0.03],
            },
          ]
        ),
      },
      {
        title: 'Income Statement',
        envelope: envelope(
          [
            { end: '2026-05-31' },
            { end: '2026-06-30', label: 'Jun 2026 (forecast)', forecast: true },
          ],
          [
            {
              elementId: 'rev',
              elementName: 'Revenues',
              isSubtotal: true,
              depth: 1,
              values: [100, 103],
            },
          ]
        ),
      },
    ])

  it('keeps the seam, the row shape, and the value domain CSV drops', () => {
    const json = JSON.parse(
      buildPlanJson(model(), {
        entityName: 'Driftline Coffee',
        scenarioName: 'FY27 Operating Budget',
      })!
    )
    expect(json.entity).toBe('Driftline Coffee')
    expect(json.scenario).toBe('FY27 Operating Budget')
    expect(json.columns).toEqual([
      { end: '2026-05-31', label: null, forecast: false },
      { end: '2026-06-30', label: 'Jun 2026 (forecast)', forecast: true },
    ])
    expect(json.sections.map((s: { title: string }) => s.title)).toEqual([
      'Assumptions',
      'Income Statement',
    ])
    expect(json.sections[0].rows[0]).toEqual({
      label: 'RevenueGrowthRate',
      itemType: 'percent',
      isSubtotal: false,
      depth: 0,
      // Aligned to the master columns — May uncovered by the levers.
      values: [null, 0.03],
    })
    expect(json.sections[1].rows[0]).toMatchObject({
      isSubtotal: true,
      depth: 1,
      values: [100, 103],
    })
  })

  it('records the actuals view as a null scenario', () => {
    const json = JSON.parse(
      buildPlanJson(model(), { entityName: null, scenarioName: null })!
    )
    expect(json.entity).toBeNull()
    expect(json.scenario).toBeNull()
  })

  it('returns null for an empty model', () => {
    expect(
      buildPlanJson(composePlan([]), { entityName: null, scenarioName: null })
    ).toBeNull()
  })
})
