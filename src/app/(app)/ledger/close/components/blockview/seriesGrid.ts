import { formatDate, formatMonth } from '../../utils'
import type { EnvelopeRenderingPeriod } from './types'

/**
 * The shell of a wide period grid — what the statement and metric
 * projections share so they can't drift apart.
 *
 * A series read is one column per month, so these tables are wider than the
 * page. They are raw tables rather than flowbite's `Table`, on the Plan
 * grid's pattern: flowbite paints its body on an absolutely-positioned
 * `w-full` layer, which is only as wide as the viewport while the table
 * overflows it — past the first screen the rows sat on bare background. Here
 * every row carries its own background, and the label column is sticky with
 * an OPAQUE one so scrolled values pass underneath it.
 *
 * The title block and toolbar belong OUTSIDE `GRID_SCROLLER`; inside it they
 * scroll away with the columns.
 */

export const GRID_SCROLLER =
  'overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700'

export const GRID_TABLE = 'w-full text-sm'

export const GRID_HEAD_ROW =
  'border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'

/** The (usually empty) header cell above the sticky label column. */
export const GRID_LABEL_HEAD =
  'sticky left-0 z-10 bg-gray-50 px-4 py-2 text-left dark:bg-gray-800'

export const GRID_HEAD_CELL =
  'px-4 py-2 text-right font-semibold whitespace-nowrap text-gray-600 dark:text-gray-300'

export const GRID_VALUE_CELL =
  'px-4 py-2 text-right font-mono whitespace-nowrap'

export const GRID_ROW = 'group border-b border-gray-100 dark:border-gray-700/50'

/**
 * A row's background and its sticky label cell's. The cell repeats the row's
 * — opaque, and via `group-hover` so it tracks the row's hover.
 */
export const rowBackground = (
  emphasized: boolean
): { row: string; label: string } =>
  emphasized
    ? {
        row: 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700',
        label:
          'bg-gray-50 group-hover:bg-gray-100 dark:bg-gray-800 dark:group-hover:bg-gray-700',
      }
    : {
        row: 'bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800',
        label:
          'bg-white group-hover:bg-gray-50 dark:bg-gray-900 dark:group-hover:bg-gray-800',
      }

export const GRID_LABEL_CELL = 'sticky left-0 z-10 py-2 pr-4'

/**
 * Sized to its content up to a cap: an overflowing table squeezes wrappable
 * text to its narrowest, which broke ordinary line items across three and
 * four lines. This keeps them on one; only a monster wraps, at the cap.
 */
export const GRID_LABEL_TEXT = 'w-max max-w-sm'

// ── Column headers ───────────────────────────────────────────────────

const isMonthEnd = (iso: string): boolean => {
  const next = new Date(`${iso}T00:00:00Z`)
  next.setUTCDate(next.getUTCDate() + 1)
  return next.getUTCDate() === 1
}

/** A point in time: metric periods carry no start, only the date measured. */
const isInstant = (period: EnvelopeRenderingPeriod): boolean =>
  !period.start || period.start === period.end

/** One calendar month — as a window (1st → last) or as its closing instant. */
const isCalendarMonth = (period: EnvelopeRenderingPeriod): boolean => {
  if (!period.end || !isMonthEnd(period.end)) return false
  if (isInstant(period)) return true
  return (
    period.start.slice(0, 7) === period.end.slice(0, 7) &&
    period.start.endsWith('-01')
  )
}

/** The window in full, for a tooltip — a point in time when `instant`. */
export const periodRange = (
  period: EnvelopeRenderingPeriod,
  instant: boolean
): string =>
  instant || isInstant(period)
    ? `As of ${formatDate(period.end)}`
    : `${formatDate(period.start)} — ${formatDate(period.end)}`

/**
 * Actuals arrive with an empty label (only a scenario's forward months are
 * labelled server-side), and a monthly series spelling out "Jul 1, 2024 —
 * Jul 31, 2024" twenty-five times is most of the table's width. A calendar
 * month says "Jul 2024"; the full window stays on the header's tooltip.
 * " (forecast)" is dropped from server labels — the `f` marker and the seam
 * tint already say it, as on the Plan grid.
 */
export const columnLabel = (
  period: EnvelopeRenderingPeriod,
  instant: boolean
): string => {
  if (period.label) return period.label.replace(' (forecast)', '')
  return isCalendarMonth(period)
    ? formatMonth(period.end)
    : periodRange(period, instant)
}

export const columnTitle = (
  period: EnvelopeRenderingPeriod,
  instant: boolean
): string =>
  `${period.forecast ? 'Forecast' : 'Actual'} · ${periodRange(period, instant)}`

/**
 * Seam styling keyed off the machine-readable flag (never the label): tinted
 * forecast columns + a border on the first one. Absent on actuals-only
 * reads, so single-set grids render exactly as before.
 */
export const seamClasses = (
  periods: readonly EnvelopeRenderingPeriod[]
): ((index: number) => string) => {
  const firstForecast = periods.findIndex((p) => p.forecast)
  return (index) => {
    const tint = periods[index].forecast
      ? 'bg-primary-50/60 dark:bg-primary-900/25'
      : ''
    const seam =
      index === firstForecast && firstForecast > 0
        ? 'border-l-2 border-primary-300 dark:border-primary-500/60'
        : ''
    return `${tint} ${seam}`.trim()
  }
}
