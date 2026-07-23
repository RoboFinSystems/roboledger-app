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

export function usePeriodWindow(defaultWindow: PeriodWindow = 'all'): {
  window: PeriodWindow
  setWindow: (w: PeriodWindow) => void
} {
  const [window, setWindow] = useState<PeriodWindow>(defaultWindow)
  return { window, setWindow }
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
