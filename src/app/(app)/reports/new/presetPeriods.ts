import type { PeriodSpecInput } from '@robosystems/client/clients'

/** Report period presets offered by the report builder. */
export type PresetKey =
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'last_quarter'
  | 'monthly_ytd'
  | 'monthly_full_year'
  | 'annual_comparison'
  | 'custom'

const formatMonthLabel = (year: number, month: number): string => {
  const date = new Date(year, month, 1)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

const lastDayOfMonth = (year: number, month: number): number =>
  new Date(year, month + 1, 0).getDate()

const pad = (n: number): string => String(n).padStart(2, '0')

const getQuarter = (month: number): number => Math.floor(month / 3)

// Exported for unit testing: the year/quarter rollovers here decide which
// periods a generated report covers, and a boundary slip produces a plausible
// report for the wrong dates rather than an error.
export function buildPresetPeriods(
  preset: PresetKey,
  now: Date
): {
  periodStart: string
  periodEnd: string
  comparative: boolean
  periods: PeriodSpecInput[] | undefined
} {
  const year = now.getFullYear()
  const month = now.getMonth() // 0-indexed

  switch (preset) {
    case 'this_month': {
      const start = `${year}-${pad(month + 1)}-01`
      const end = `${year}-${pad(month + 1)}-${lastDayOfMonth(year, month)}`
      return {
        periodStart: start,
        periodEnd: end,
        comparative: false,
        periods: undefined,
      }
    }

    case 'last_month': {
      const prevMonth = month === 0 ? 11 : month - 1
      const prevYear = month === 0 ? year - 1 : year
      const start = `${prevYear}-${pad(prevMonth + 1)}-01`
      const end = `${prevYear}-${pad(prevMonth + 1)}-${lastDayOfMonth(prevYear, prevMonth)}`
      return {
        periodStart: start,
        periodEnd: end,
        comparative: true,
        periods: undefined,
      }
    }

    case 'this_quarter': {
      const q = getQuarter(month)
      const qStart = q * 3
      const start = `${year}-${pad(qStart + 1)}-01`
      const end = `${year}-${pad(qStart + 3)}-${lastDayOfMonth(year, qStart + 2)}`
      return {
        periodStart: start,
        periodEnd: end,
        comparative: false,
        periods: undefined,
      }
    }

    case 'last_quarter': {
      const q = getQuarter(month)
      const prevQ = q === 0 ? 3 : q - 1
      const prevYear = q === 0 ? year - 1 : year
      const qStart = prevQ * 3
      const start = `${prevYear}-${pad(qStart + 1)}-01`
      const end = `${prevYear}-${pad(qStart + 3)}-${lastDayOfMonth(prevYear, qStart + 2)}`
      return {
        periodStart: start,
        periodEnd: end,
        comparative: true,
        periods: undefined,
      }
    }

    case 'monthly_ytd': {
      const periods: PeriodSpecInput[] = []
      for (let m = 0; m <= month; m++) {
        periods.push({
          start: `${year}-${pad(m + 1)}-01`,
          end: `${year}-${pad(m + 1)}-${lastDayOfMonth(year, m)}`,
          label: formatMonthLabel(year, m),
        })
      }
      return {
        periodStart: periods[0].start,
        periodEnd: periods[periods.length - 1].end,
        comparative: false,
        periods,
      }
    }

    case 'monthly_full_year': {
      const periods: PeriodSpecInput[] = []
      for (let i = 11; i >= 0; i--) {
        const d = new Date(year, month - i, 1)
        const y = d.getFullYear()
        const m = d.getMonth()
        periods.push({
          start: `${y}-${pad(m + 1)}-01`,
          end: `${y}-${pad(m + 1)}-${lastDayOfMonth(y, m)}`,
          label: formatMonthLabel(y, m),
        })
      }
      return {
        periodStart: periods[0].start,
        periodEnd: periods[periods.length - 1].end,
        comparative: false,
        periods,
      }
    }

    case 'annual_comparison': {
      const periods: PeriodSpecInput[] = [
        {
          start: `${year}-01-01`,
          end: `${year}-12-31`,
          label: `FY ${year}`,
        },
        {
          start: `${year - 1}-01-01`,
          end: `${year - 1}-12-31`,
          label: `FY ${year - 1}`,
        },
      ]
      return {
        periodStart: periods[0].start,
        periodEnd: periods[0].end,
        comparative: false,
        periods,
      }
    }

    case 'custom':
    default:
      return {
        periodStart: '',
        periodEnd: '',
        comparative: true,
        periods: undefined,
      }
  }
}

// ── Component ────────────────────────────────────────────────────────────
