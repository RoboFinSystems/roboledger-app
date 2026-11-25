export interface EntityTypeOption {
  value: string
  label: string
}

/** Legal forms: the value the server stores, and the name a person reads. */
export const ENTITY_TYPES: ReadonlyArray<EntityTypeOption> = [
  { value: 'corporation', label: 'Corporation' },
  { value: 'llc', label: 'Limited liability company (LLC)' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'sole_proprietorship', label: 'Sole proprietorship' },
  { value: 'non_profit', label: 'Non-profit' },
]

/** The readable name of a stored legal form; a value off the list shows as stored. */
export function entityTypeLabel(value?: string | null): string {
  if (!value) return ''
  return ENTITY_TYPES.find((t) => t.value === value)?.label ?? value
}
