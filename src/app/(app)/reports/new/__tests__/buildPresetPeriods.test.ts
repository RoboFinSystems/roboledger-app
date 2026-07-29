import { describe, expect, it } from 'vitest'

import { buildPresetPeriods } from '../presetPeriods'

// Local-time construction: the helper reads getFullYear/getMonth, so building
// these with `new Date(y, m, d)` matches how a browser would see "now".
const on = (year: number, month1: number, day: number) =>
  new Date(year, month1 - 1, day)

describe('buildPresetPeriods', () => {
  describe('this_month', () => {
    it('spans the whole current month', () => {
      const r = buildPresetPeriods('this_month', on(2026, 7, 15))
      expect(r.periodStart).toBe('2026-07-01')
      expect(r.periodEnd).toBe('2026-07-31')
    })

    it('handles a 30-day month', () => {
      expect(buildPresetPeriods('this_month', on(2026, 4, 3)).periodEnd).toBe(
        '2026-04-30'
      )
    })

    it('handles February in a leap year', () => {
      const r = buildPresetPeriods('this_month', on(2028, 2, 10))
      expect(r.periodStart).toBe('2028-02-01')
      expect(r.periodEnd).toBe('2028-02-29')
    })

    it('handles February in a non-leap year', () => {
      expect(buildPresetPeriods('this_month', on(2026, 2, 10)).periodEnd).toBe(
        '2026-02-28'
      )
    })
  })

  describe('last_month', () => {
    it('takes the previous month within the same year', () => {
      const r = buildPresetPeriods('last_month', on(2026, 7, 15))
      expect(r.periodStart).toBe('2026-06-01')
      expect(r.periodEnd).toBe('2026-06-30')
    })

    it('rolls back to the previous December in January', () => {
      // The boundary that matters: in January, "last month" is Dec of last year.
      const r = buildPresetPeriods('last_month', on(2026, 1, 5))
      expect(r.periodStart).toBe('2025-12-01')
      expect(r.periodEnd).toBe('2025-12-31')
    })
  })

  describe('this_quarter', () => {
    it.each([
      [2, 'Q1', '2026-01-01', '2026-03-31'],
      [5, 'Q2', '2026-04-01', '2026-06-30'],
      [8, 'Q3', '2026-07-01', '2026-09-30'],
      [11, 'Q4', '2026-10-01', '2026-12-31'],
    ])('covers %s (%s)', (month1, _label, start, end) => {
      const r = buildPresetPeriods(
        'this_quarter',
        on(2026, month1 as number, 5)
      )
      expect(r.periodStart).toBe(start)
      expect(r.periodEnd).toBe(end)
    })
  })

  describe('last_quarter', () => {
    it('takes the previous quarter within the same year', () => {
      const r = buildPresetPeriods('last_quarter', on(2026, 7, 15))
      expect(r.periodStart).toBe('2026-04-01')
      expect(r.periodEnd).toBe('2026-06-30')
    })

    it('rolls back to the previous Q4 during Q1', () => {
      // The other year-boundary case: in Q1, "last quarter" is Q4 of last year.
      const r = buildPresetPeriods('last_quarter', on(2026, 2, 10))
      expect(r.periodStart).toBe('2025-10-01')
      expect(r.periodEnd).toBe('2025-12-31')
    })
  })

  describe('monthly_ytd', () => {
    it('produces one period per month through the current one', () => {
      const r = buildPresetPeriods('monthly_ytd', on(2026, 4, 20))
      expect(r.periods).toHaveLength(4)
      expect(r.periods?.[0].start).toBe('2026-01-01')
      expect(r.periods?.[3].end).toBe('2026-04-30')
      expect(r.periodStart).toBe('2026-01-01')
      expect(r.periodEnd).toBe('2026-04-30')
    })

    it('produces a single period in January', () => {
      const r = buildPresetPeriods('monthly_ytd', on(2026, 1, 20))
      expect(r.periods).toHaveLength(1)
      expect(r.periods?.[0].start).toBe('2026-01-01')
      expect(r.periods?.[0].end).toBe('2026-01-31')
    })
  })

  describe('monthly_full_year', () => {
    it('produces twelve consecutive months ending with the current one', () => {
      const r = buildPresetPeriods('monthly_full_year', on(2026, 3, 10))
      expect(r.periods).toHaveLength(12)
      // Twelve months back from March 2026 starts at April 2025.
      expect(r.periods?.[0].start).toBe('2025-04-01')
      expect(r.periods?.[11].start).toBe('2026-03-01')
      expect(r.periods?.[11].end).toBe('2026-03-31')
    })

    it('keeps months strictly consecutive across the year boundary', () => {
      const r = buildPresetPeriods('monthly_full_year', on(2026, 1, 10))
      const starts = r.periods?.map((p) => p.start) ?? []
      expect(starts[0]).toBe('2025-02-01')
      expect(starts[11]).toBe('2026-01-01')
      // No duplicates and no gaps — a rollover bug typically shows up as a
      // repeated month rather than an obviously wrong date.
      expect(new Set(starts).size).toBe(12)
    })
  })

  describe('annual_comparison', () => {
    it('pairs the current fiscal year with the prior one', () => {
      const r = buildPresetPeriods('annual_comparison', on(2026, 7, 15))
      expect(r.periods).toHaveLength(2)
      expect(r.periods?.[0]).toMatchObject({
        start: '2026-01-01',
        end: '2026-12-31',
        label: 'FY 2026',
      })
      expect(r.periods?.[1]).toMatchObject({
        start: '2025-01-01',
        end: '2025-12-31',
        label: 'FY 2025',
      })
    })
  })

  describe('custom', () => {
    it('returns empty dates and no period spec', () => {
      const r = buildPresetPeriods('custom', on(2026, 7, 15))
      expect(r.periodStart).toBe('')
      expect(r.periodEnd).toBe('')
      expect(r.periods).toBeUndefined()
    })
  })

  it('always emits zero-padded ISO dates', () => {
    // Single-digit months must pad, or the API receives "2026-7-01".
    const iso = /^\d{4}-\d{2}-\d{2}$/
    for (const preset of [
      'this_month',
      'last_month',
      'this_quarter',
      'last_quarter',
      'monthly_ytd',
      'monthly_full_year',
      'annual_comparison',
    ] as const) {
      const r = buildPresetPeriods(preset, on(2026, 9, 5))
      expect(r.periodStart).toMatch(iso)
      expect(r.periodEnd).toMatch(iso)
      for (const p of r.periods ?? []) {
        expect(p.start).toMatch(iso)
        expect(p.end).toMatch(iso)
      }
    }
  })
})
