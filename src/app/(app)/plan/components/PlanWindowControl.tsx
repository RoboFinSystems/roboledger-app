'use client'

import type { FC } from 'react'
import {
  PERIOD_WINDOWS,
  type PeriodWindow,
} from '../../ledger/close/components/blockview/usePeriodWindow'

interface PlanWindowControlProps {
  history: PeriodWindow
  forecast: PeriodWindow
  onHistoryChange: (window: PeriodWindow) => void
  onForecastChange: (window: PeriodWindow) => void
  /** False when Actuals is selected — no forward columns to window. */
  forecastEnabled: boolean
}

/**
 * The Plan grid's two-sided window: history and forecast are separate
 * selections split at the seam, color-coded to the column families they
 * scope — gray active states window the actual (gray) columns, primary
 * (purple) active states window the forecast (tinted) columns. "3M
 * history + 12M forecast" is the workbook posture: a few months behind,
 * the horizon ahead. The forecast group is inert on the actuals view.
 */
const PlanWindowControl: FC<PlanWindowControlProps> = ({
  history,
  forecast,
  onHistoryChange,
  onForecastChange,
  forecastEnabled,
}) => (
  <div className="flex items-center gap-3">
    <WindowGroup
      label="History"
      ariaLabel="History range"
      window={history}
      onChange={onHistoryChange}
      activeClass="bg-gray-600 text-white dark:bg-gray-500"
      enabled
    />
    <WindowGroup
      label="Forecast"
      ariaLabel="Forecast range"
      window={forecast}
      onChange={onForecastChange}
      activeClass="bg-primary-600 text-white"
      enabled={forecastEnabled}
    />
  </div>
)

interface WindowGroupProps {
  label: string
  ariaLabel: string
  window: PeriodWindow
  onChange: (window: PeriodWindow) => void
  activeClass: string
  enabled: boolean
}

const WindowGroup: FC<WindowGroupProps> = ({
  label,
  ariaLabel,
  window,
  onChange,
  activeClass,
  enabled,
}) => (
  <div
    className={`flex items-center gap-1.5 ${enabled ? '' : 'opacity-40'}`}
    data-testid={`plan-window-${label.toLowerCase()}`}
  >
    <span className="text-[10px] font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
      {label}
    </span>
    <div
      className="inline-flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
      role="group"
      aria-label={ariaLabel}
    >
      {PERIOD_WINDOWS.map(({ value, label: optionLabel }) => {
        const active = value === window
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            disabled={!enabled}
            onClick={() => onChange(value)}
            className={`px-2.5 py-1 text-xs font-medium transition-colors ${
              active && enabled
                ? activeClass
                : 'bg-white text-gray-600 hover:bg-gray-50 disabled:hover:bg-white dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:disabled:hover:bg-gray-800'
            } ${value !== 'all' ? 'border-l border-gray-200 dark:border-gray-700' : ''} ${
              enabled ? '' : 'cursor-not-allowed'
            }`}
          >
            {optionLabel}
          </button>
        )
      })}
    </div>
  </div>
)

export default PlanWindowControl
