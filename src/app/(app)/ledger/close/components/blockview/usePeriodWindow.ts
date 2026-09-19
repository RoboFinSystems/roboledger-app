'use client'

import { useState } from 'react'
import type { EnvelopeRendering } from './types'

/**
 * Trailing-window quick-picks for long standing series (monthly metric
 * blocks). "All" shows the full series; the numeric windows keep the most
 * recent N periods — the FP&A cadence is monthly, so 3M / 6M / 12M are the
 * comparability spans an operator reaches for. Shared by the metric table
 * and the chart projection so both scope to the same slice.
 */
export type PeriodWindow = 'all' | '12' | '6' | '3'

export const PERIOD_WINDOWS: readonly { value: PeriodWindow; label: string }[] =
  [
    { value: 'all', label: 'All' },
    { value: '12', label: '12M' },
    { value: '6', label: '6M' },
    { value: '3', label: '3M' },
  ] as const

/** The first period index a window keeps — trailing N, clamped to 0. */
export function windowStartIndex(total: number, window: PeriodWindow): number {
  if (window === 'all') return 0
  return Math.max(0, total - Number(window))
}

/**
 * The default for a TABLE over `total` periods. A series read runs oldest →
 * newest, so "All" opens a 25-month grid on its first month with the current
 * one a long scroll to the right — the opposite of what a reader came for.
 * Past a year, open on the trailing twelve. (A chart shows its whole span at
 * a glance, so it keeps "All".)
 */
export const defaultTableWindow = (total: number): PeriodWindow =>
  total > 12 ? '12' : 'all'

/**
 * `defaultWindow` stays live until the user picks: the same mounted
 * projection is handed a 3-month block and then a 25-month one, and a
 * default frozen at first mount would be wrong for the second.
 */
export function usePeriodWindow(defaultWindow: PeriodWindow = 'all'): {
  window: PeriodWindow
  setWindow: (w: PeriodWindow) => void
} {
  const [picked, setPicked] = useState<PeriodWindow | null>(null)
  return { window: picked ?? defaultWindow, setWindow: setPicked }
}

/**
 * A rendering sliced to a trailing window — periods and every row's aligned
 * values cut to the same `[start, end)` range, so columns stay in register.
 */
export function sliceRendering(
  rendering: EnvelopeRendering,
  start: number
): EnvelopeRendering {
  if (start <= 0) return rendering
  return {
    ...rendering,
    periods: rendering.periods.slice(start),
    rows: rendering.rows.map((row) => ({
      ...row,
      values: row.values.slice(start),
    })),
  }
}
