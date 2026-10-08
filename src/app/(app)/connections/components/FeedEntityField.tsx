'use client'

import { hierarchyDepth } from '@/lib/entity-scope'
import type { LedgerEntitySummary } from '@robosystems/client/clients'
import { Label, Select } from 'flowbite-react'

interface FeedEntityFieldProps {
  id: string
  /** The group's entities, the parent first (`useEntityScope().entities`). */
  entities: LedgerEntitySummary[]
  /** The picked entity's id. */
  value: string
  onChange: (entityId: string) => void
  /**
   * A synced ledger (QuickBooks) keeps the group parent's books, so a feed
   * cannot land there: the parent is listed but cannot be picked.
   */
  parentKept: boolean
  disabled?: boolean
}

/** What the connection config takes: a subsidiary's id, null for the parent. */
export const feedEntityScope = (
  entities: readonly LedgerEntitySummary[],
  entityId: string
): string | null => {
  const entity = entities.find((e) => e.id === entityId)
  return entity && !entity.isParent ? entity.id : null
}

/** The entity a feed lands on by default: the parent, unless QuickBooks keeps
 *  its books, then the first subsidiary; '' when nothing can take a feed. */
export const feedEntityDefault = (
  entities: readonly LedgerEntitySummary[],
  parentKept: boolean
): string => {
  const parent = entities.find((e) => e.isParent) ?? entities[0]
  if (!parentKept) return parent?.id ?? ''
  return entities.find((e) => !e.isParent)?.id ?? ''
}

/** Whether a pick is one the server would accept for a feed. */
export const feedEntityAllowed = (
  entities: readonly LedgerEntitySummary[],
  entityId: string,
  parentKept: boolean
): boolean => {
  const entity = entities.find((e) => e.id === entityId)
  if (!entity) return false
  return !(parentKept && entity.isParent)
}

// Which company's books a bank feed's accounts land on. A single-company
// group has no choice to make and shows nothing; a holding company picks,
// with the parent disabled while QuickBooks keeps its books. Each account can
// be moved to another entity later from Bank Accounts.
export default function FeedEntityField({
  id,
  entities,
  value,
  onChange,
  parentKept,
  disabled = false,
}: FeedEntityFieldProps) {
  if (entities.length < 2) {
    if (!parentKept || entities.length === 0) return null
    return (
      <p className="text-sm text-gray-600 dark:text-gray-400" role="note">
        QuickBooks keeps {entities[0].name}&rsquo;s books, so a bank cannot
        connect for it. Add a subsidiary under Entities to connect a bank for
        that company.
      </p>
    )
  }
  return (
    <div>
      <Label htmlFor={id}>Company</Label>
      <Select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {entities.map((row) => (
          <option
            key={row.id}
            value={row.id}
            disabled={parentKept && row.isParent}
          >
            {' '.repeat(hierarchyDepth(row, entities) * 2)}
            {row.name}
            {parentKept && row.isParent ? ' (QuickBooks keeps its books)' : ''}
          </option>
        ))}
      </Select>
      <p className="mt-1 text-xs text-gray-500">
        The accounts book to this company. Move one to another company later
        from Bank Accounts.
      </p>
    </div>
  )
}
