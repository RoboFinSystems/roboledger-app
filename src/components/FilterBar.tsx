'use client'

import { Card, Select, TextInput } from 'flowbite-react'
import type { FC, ReactNode } from 'react'
import { HiSearch } from 'react-icons/hi'

/**
 * The filter row above a list — one shape for every list page.
 *
 * Each page used to hand-roll this, and the copies drifted: labelled and
 * unlabelled searches, two control heights, sentence- and Title-case labels.
 * They also shared two bugs, fixed here once:
 *
 * - The search magnifier floated OUTSIDE the field. Pages positioned their
 *   own icon and padded the input with `className="pl-10"` — but flowbite
 *   puts `className` on the wrapper div, not the `<input>`, so the padding
 *   shoved the whole field right and left the icon behind. `TextInput`'s own
 *   `icon` prop pads the input itself.
 * - The core theme pads a Card's children `p-6` and each page added `p-4`
 *   inside it: 40px of padding around a single row of controls.
 *
 * Controls are `sizing="sm"` throughout — this is a toolbar, not a form.
 */

const CARD_THEME = {
  root: { children: 'flex h-full flex-col justify-center p-4' },
}

const LABEL = 'mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400'

export const FilterBar: FC<{ children: ReactNode }> = ({ children }) => (
  <Card theme={CARD_THEME}>
    <div
      className="flex flex-wrap items-end gap-3"
      role="group"
      aria-label="Filters"
    >
      {children}
    </div>
  </Card>
)

interface FilterFieldProps {
  label: string
  /** The control's id. Omit for a non-input control, which names itself. */
  htmlFor?: string
  /** Width, e.g. `sm:w-44`. Fields are full-width below `sm`. */
  className?: string
  children: ReactNode
}

export const FilterField: FC<FilterFieldProps> = ({
  label,
  htmlFor,
  // The fallback, not an addition: `sm:w-auto` and a caller's `sm:w-44` sit
  // at one breakpoint, so stylesheet order — not attribute order — picks the
  // winner, and `w-auto` wins. Emitting both collapsed every field to its
  // content width.
  className = 'sm:w-auto',
  children,
}) => (
  <div className={`w-full ${className}`}>
    {htmlFor ? (
      <label htmlFor={htmlFor} className={LABEL}>
        {label}
      </label>
    ) : (
      <span className={LABEL}>{label}</span>
    )}
    {children}
  </div>
)

interface SearchFieldProps {
  id: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  label?: string
  className?: string
}

export const SearchField: FC<SearchFieldProps> = ({
  id,
  value,
  onChange,
  placeholder,
  label = 'Search',
  className = 'sm:w-64',
}) => (
  <FilterField label={label} htmlFor={id} className={className}>
    <TextInput
      id={id}
      icon={HiSearch}
      sizing="sm"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </FilterField>
)

interface FilterSelectProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  className?: string
  /** The `<option>`s. */
  children: ReactNode
}

export const FilterSelect: FC<FilterSelectProps> = ({
  id,
  label,
  value,
  onChange,
  className = 'sm:w-44',
  children,
}) => (
  <FilterField label={label} htmlFor={id} className={className}>
    <Select
      id={id}
      sizing="sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {children}
    </Select>
  </FilterField>
)

interface FilterDateProps {
  id: string
  label: string
  /** ISO `YYYY-MM-DD`, or empty. */
  value: string
  onChange: (value: string) => void
}

export const FilterDate: FC<FilterDateProps> = ({
  id,
  label,
  value,
  onChange,
}) => (
  <FilterField label={label} htmlFor={id}>
    <TextInput
      id={id}
      type="date"
      sizing="sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </FilterField>
)

/** Right-aligned slot for what acts on the list rather than filters it. */
export const FilterActions: FC<{ children: ReactNode }> = ({ children }) => (
  <div className="ml-auto flex items-end gap-2">{children}</div>
)
