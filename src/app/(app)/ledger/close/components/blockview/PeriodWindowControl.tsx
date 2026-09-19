'use client'

import SegmentedControl from '@/components/SegmentedControl'
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
  <SegmentedControl
    options={PERIOD_WINDOWS}
    value={window}
    onChange={onChange}
    ariaLabel="Period range"
    size="compact"
  />
)

export default PeriodWindowControl
