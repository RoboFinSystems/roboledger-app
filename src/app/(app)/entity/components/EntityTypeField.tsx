'use client'

import { ENTITY_TYPES } from '@/lib/entity-types'
import ListField from './ListField'

/** An entity's legal form, chosen from the list and shown by name. */
export default function EntityTypeField(props: {
  /** The stored legal form. */
  value?: string | null
  editing: boolean
  /** The form's current choice while editing. */
  selected: string
  onChange: (value: string) => void
}) {
  return (
    <ListField
      {...props}
      label="Entity Type"
      field="entity_type"
      options={ENTITY_TYPES}
      hint="Changing it does not change the Reporting Style."
    />
  )
}
