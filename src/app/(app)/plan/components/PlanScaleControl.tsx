'use client'

import type { FC } from 'react'
import type { PlanScale } from '../planModel'

const OPTIONS: { value: PlanScale; label: string }[] = [
  { value: 'ones', label: '$' },
  { value: 'thousands', label: '$K' },
]

interface PlanScaleControlProps {
  scale: PlanScale
  onChange: (scale: PlanScale) => void
}

/** Whole dollars or thousands for the grid's money; defaults by materiality. */
const PlanScaleControl: FC<PlanScaleControlProps> = ({ scale, onChange }) => (
  <div className="flex items-center gap-1.5" data-testid="plan-scale">
    <span className="text-[10px] font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
      Units
    </span>
    <div
      className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700"
      role="group"
      aria-label="Units"
    >
      {OPTIONS.map(({ value, label }, i) => {
        const active = value === scale
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(value)}
            className={`px-2.5 py-1 text-xs font-medium transition-colors ${
              active
                ? 'bg-gray-600 text-white dark:bg-gray-500'
                : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            } ${i > 0 ? 'border-l border-gray-200 dark:border-gray-700' : ''}`}
          >
            {label}
          </button>
        )
      })}
    </div>
  </div>
)

export default PlanScaleControl
