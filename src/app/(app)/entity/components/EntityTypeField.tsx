'use client'

import { ENTITY_TYPES, entityTypeLabel } from '@/lib/entity-types'
import { Label, Select } from '@robosystems/core/ui'

const labelClass = 'mb-1 text-sm font-medium text-gray-500 dark:text-gray-400'

/**
 * An entity's legal form, chosen from the list. A value from before the list
 * stays selected, shown as stored, until the user picks another.
 */
export default function EntityTypeField({
  value,
  editing,
  selected,
  onChange,
}: {
  /** The stored legal form. */
  value?: string | null
  editing: boolean
  /** The form's current choice while editing. */
  selected: string
  onChange: (value: string) => void
}) {
  if (!editing) {
    return (
      <div>
        <dt className={labelClass}>Entity Type</dt>
        <dd className="text-base break-words text-gray-900 dark:text-white">
          {entityTypeLabel(value) || (
            <span className="text-gray-400 dark:text-gray-500">--</span>
          )}
        </dd>
      </div>
    )
  }

  const offList =
    selected && !ENTITY_TYPES.some((t) => t.value === selected)
      ? selected
      : null

  return (
    <div>
      <Label htmlFor="entity_type" className={labelClass}>
        Entity Type
      </Label>
      <Select
        id="entity_type"
        sizing="sm"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Not recorded</option>
        {offList && <option value={offList}>{offList}</option>}
        {ENTITY_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </Select>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {offList
          ? `“${offList}” is not on the list. Choose one to replace it.`
          : 'Changing it does not change the Reporting Style.'}
      </p>
    </div>
  )
}
