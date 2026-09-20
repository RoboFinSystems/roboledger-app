'use client'

import type { ReactNode } from 'react'

export interface SegmentedOption<T extends string> {
  value: T
  label: ReactNode
}

interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedOption<T>[]
  value: T
  /**
   * `NoInfer` so `T` comes from `options` / `value` alone. A React state
   * setter takes `SetStateAction<T>` — a union with an updater function — and
   * left to infer from it TypeScript gives up and widens `T` to `string`,
   * rejecting the setter a caller most wants to pass.
   */
  onChange: (value: NoInfer<T>) => void
  /** Names the group for assistive tech — the visible label, if any, is separate. */
  ariaLabel: string
  /**
   * `field` stands as tall as a `sizing="sm"` input, for a `FilterBar` row;
   * `compact` sits in a table's own toolbar.
   */
  size?: 'field' | 'compact'
}

/**
 * Pick one of a few — a view mode, a statement type, a trailing window.
 *
 * The app had grown four looks for this (a Buttons row, rounded pills, a
 * ToggleSwitch labelled on both sides, and this one). A switch in particular
 * reads as on/off, which says nothing when both sides are views.
 */
function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  size = 'field',
}: SegmentedControlProps<T>) {
  return (
    <div
      className="inline-flex max-w-full overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700"
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((option, i) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`px-3 text-xs font-medium whitespace-nowrap transition-colors ${
              size === 'field' ? 'py-2' : 'py-1'
            } ${
              active
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            } ${i > 0 ? 'border-l border-gray-200 dark:border-gray-700' : ''}`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export default SegmentedControl
