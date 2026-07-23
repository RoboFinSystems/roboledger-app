'use client'

import type { FC } from 'react'
import { PERIOD_WINDOWS, type PeriodWindow } from './usePeriodWindow'

interface PeriodWindowControlProps {
  window: PeriodWindow
  onChange: (window: PeriodWindow) => void
}

/**
 * Trailing-window quick-picks (All / 12M / 6M / 3M) for long metric series.
 * A single left-aligned segmented control, per the dataviz filter rule —
 * scopes the table and the chart to the same slice.
 */
const PeriodWindowControl: FC<PeriodWindowControlProps> = ({
  window,
  onChange,
}) => (
  <div
    className="inline-flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
    role="group"
    aria-label="Period range"
  >
    {PERIOD_WINDOWS.map(({ value, label }) => {
      const active = value === window
      return (
        <button
          key={value}
          type="button"
          aria-pressed={active}
          onClick={() => onChange(value)}
          className={`px-3 py-1 text-xs font-medium transition-colors ${
            active
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          } ${value !== 'all' ? 'border-l border-gray-200 dark:border-gray-700' : ''}`}
        >
          {label}
        </button>
      )
    })}
  </div>
)

export default PeriodWindowControl
