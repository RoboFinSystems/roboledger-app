'use client'

import type { LedgerClosingBookStructures } from '@robosystems/client/clients'
import { Button, Spinner } from 'flowbite-react'
import type { FC } from 'react'
import { useState } from 'react'
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi'

// ── Types ──────────────────────────────────────────────────────────────

// Derived from the GraphQL `closingBookStructures` field — the sidebar's
// data comes from `extensions.ledger.getClosingBookStructures()`.
type ClosingBookCategory = LedgerClosingBookStructures['categories'][number]
type ClosingBookItem = ClosingBookCategory['items'][number]

export type SelectedItem =
  | { type: 'statement'; structureId: string }
  | { type: 'schedule'; structureId: string }
  | { type: 'account_rollups'; mappingId: string; name: string }
  | { type: 'trial_balance' }
  | { type: 'period_close' }

// ── Helpers ────────────────────────────────────────────────────────────

function itemToSelected(item: ClosingBookItem): SelectedItem {
  switch (item.itemType) {
    case 'statement':
      return {
        type: 'statement',
        structureId: item.id,
      }
    case 'schedule':
      return {
        type: 'schedule',
        structureId: item.id,
      }
    case 'account_rollups':
      return {
        type: 'account_rollups',
        mappingId: item.id,
        name: item.name,
      }
    case 'trial_balance':
      return { type: 'trial_balance' }
    case 'period_close':
      return { type: 'period_close' }
    default:
      return { type: 'period_close' }
  }
}

function isActive(
  selected: SelectedItem | null,
  item: ClosingBookItem
): boolean {
  if (!selected) return false
  switch (selected.type) {
    case 'statement':
      return item.itemType === 'statement' && item.id === selected.structureId
    case 'schedule':
      return item.itemType === 'schedule' && item.id === selected.structureId
    case 'account_rollups':
      return (
        item.itemType === 'account_rollups' && item.id === selected.mappingId
      )
    case 'trial_balance':
      return item.itemType === 'trial_balance'
    case 'period_close':
      return item.itemType === 'period_close'
  }
}

// ── Component ──────────────────────────────────────────────────────────

interface StructureSidebarProps {
  categories: ClosingBookCategory[]
  selectedItem: SelectedItem | null
  onSelect: (item: SelectedItem) => void
  isLoading: boolean
}

const StructureSidebar: FC<StructureSidebarProps> = ({
  categories,
  selectedItem,
  onSelect,
  isLoading,
}) => {
  const [collapsed, setCollapsed] = useState(false)

  if (collapsed) {
    return (
      <div className="flex shrink-0 flex-col items-center rounded-lg border border-gray-200 bg-white py-2 dark:border-gray-700 dark:bg-gray-800">
        <Button
          size="xs"
          color="light"
          onClick={() => setCollapsed(false)}
          className="border-0 bg-transparent p-1"
        >
          <HiChevronRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="w-64 shrink-0 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <span className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
          Closing Book
        </span>
        <Button
          size="xs"
          color="light"
          onClick={() => setCollapsed(true)}
          className="border-0 bg-transparent p-1"
        >
          <HiChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="max-h-[calc(100vh-16rem)] overflow-y-auto py-2">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="md" />
          </div>
        ) : (
          categories.map((cat) => (
            <div key={cat.label} className="mb-3">
              <div className="px-4 py-1.5">
                <span className="text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                  {cat.label}
                </span>
              </div>
              {cat.items.map((item) => {
                const active = isActive(selectedItem, item)
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelect(itemToSelected(item))}
                    className={`flex w-full items-center gap-2 px-4 py-1.5 text-left text-sm transition-colors ${
                      active
                        ? 'border-l-2 border-blue-500 bg-blue-50 font-medium text-blue-700 dark:border-blue-400 dark:bg-blue-900/20 dark:text-blue-300'
                        : 'border-l-2 border-transparent text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        active
                          ? 'bg-blue-500 dark:bg-blue-400'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                    <span className="truncate">{item.name}</span>
                  </button>
                )
              })}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default StructureSidebar
export { itemToSelected }
export type { StructureSidebarProps }
