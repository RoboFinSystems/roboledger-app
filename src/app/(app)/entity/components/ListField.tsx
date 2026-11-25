'use client'

import { type CodeOption, codeLabel } from '@/lib/regions'
import { Label, Select } from '@robosystems/core/ui'

const labelClass = 'mb-1 text-sm font-medium text-gray-500 dark:text-gray-400'

/**
 * A field chosen from a list of stored values, shown by name. A value from
 * before the list stays selected, shown as stored, until another is picked.
 */
export default function ListField({
  label,
  field,
  options,
  value,
  editing,
  selected,
  onChange,
  hint,
}: {
  label: string
  field: string
  options: ReadonlyArray<CodeOption>
  /** The stored value. */
  value?: string | null
  editing: boolean
  /** The form's current choice while editing. */
  selected: string
  onChange: (value: string) => void
  hint?: string
}) {
  if (!editing) {
    return (
      <div>
        <dt className={labelClass}>{label}</dt>
        <dd className="text-base break-words text-gray-900 dark:text-white">
          {codeLabel(options, value) || (
            <span className="text-gray-400 dark:text-gray-500">--</span>
          )}
        </dd>
      </div>
    )
  }

  const offList =
    selected && !options.some((o) => o.value === selected) ? selected : null

  return (
    <div>
      <Label htmlFor={field} className={labelClass}>
        {label}
      </Label>
      <Select
        id={field}
        sizing="sm"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Not recorded</option>
        {offList && <option value={offList}>{offList}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
      {(offList || hint) && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {offList
            ? `“${offList}” is not on the list. Choose one to replace it.`
            : hint}
        </p>
      )}
    </div>
  )
}
