'use client'

import type { InformationBlockList } from '@robosystems/client/clients'
import { LoadingState } from '@robosystems/core'
import { TextInput } from 'flowbite-react'
import type { FC } from 'react'
import { useMemo, useState } from 'react'
import { HiSearch } from 'react-icons/hi'

type BlockListItem = InformationBlockList[number]

/**
 * Sidebar group headings by block type. The statement family collapses
 * into one group; unknown block types land in "Other" so new registry
 * entries surface without a picker change.
 */
const GROUP_BY_BLOCK_TYPE: Record<string, string> = {
  metric: 'Metrics',
  balance_sheet: 'Statements',
  income_statement: 'Statements',
  cash_flow_statement: 'Statements',
  equity_statement: 'Statements',
  comprehensive_income: 'Statements',
  schedule: 'Schedules',
  regulatory_disclosure: 'Disclosures',
  forecast: 'Scenarios',
}

// The reading order of a financial report: the statements first, their
// notes next, then the working papers behind them, derived analytics,
// forward scenarios, and everything else.
const GROUP_ORDER = [
  'Statements',
  'Disclosures',
  'Schedules',
  'Metrics',
  'Scenarios',
  'Other',
]

// Canonical statement presentation order (the report-package order) —
// the list API sorts alphabetically by block_type, which shuffles the
// family (BS, CF, Equity, IS). Unlisted types sort last, by name.
const STATEMENT_TYPE_ORDER: Record<string, number> = {
  balance_sheet: 0,
  income_statement: 1,
  cash_flow_statement: 2,
  equity_statement: 3,
  comprehensive_income: 4,
}

const byName = (a: BlockListItem, b: BlockListItem) =>
  (a.name || a.displayName || '').localeCompare(b.name || b.displayName || '')

const byStatementOrder = (a: BlockListItem, b: BlockListItem) =>
  (STATEMENT_TYPE_ORDER[a.blockType] ?? 99) -
    (STATEMENT_TYPE_ORDER[b.blockType] ?? 99) || byName(a, b)

interface BlockPickerProps {
  blocks: InformationBlockList
  selectedId: string | null
  onSelect: (block: BlockListItem) => void
  isLoading: boolean
}

/**
 * Searchable Information Block picker — the left rail of `/explorer`.
 * Groups blocks by family (metrics first: they're the explorer home)
 * and filters by name client-side; the block list itself is one
 * `listInformationBlocks` fetch owned by the page.
 */
const BlockPicker: FC<BlockPickerProps> = ({
  blocks,
  selectedId,
  onSelect,
  isLoading,
}) => {
  const [search, setSearch] = useState('')

  const groups = useMemo(() => {
    const needle = search.toLowerCase()
    const filtered = needle
      ? blocks.filter((b) =>
          (b.name || (b.displayName ?? '')).toLowerCase().includes(needle)
        )
      : blocks

    const byGroup = new Map<string, BlockListItem[]>()
    for (const block of filtered) {
      const group = GROUP_BY_BLOCK_TYPE[block.blockType] ?? 'Other'
      const bucket = byGroup.get(group)
      if (bucket) {
        bucket.push(block)
      } else {
        byGroup.set(group, [block])
      }
    }
    return GROUP_ORDER.filter((g) => byGroup.has(g)).map((g) => ({
      label: g,
      items: (byGroup.get(g) ?? [])
        .slice()
        .sort(g === 'Statements' ? byStatementOrder : byName),
    }))
  }, [blocks, search])

  return (
    <div className="w-64 shrink-0 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <span className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
          Information Blocks
        </span>
        <TextInput
          sizing="sm"
          icon={HiSearch}
          placeholder="Search blocks"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mt-2"
        />
      </div>

      {/* Content */}
      <div className="max-h-[calc(100vh-18rem)] overflow-y-auto py-2">
        {isLoading ? (
          <LoadingState size="md" className="py-8" />
        ) : groups.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
            {search ? 'No blocks match.' : 'No information blocks yet.'}
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="mb-3">
              <div className="px-4 py-1.5">
                <span className="text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                  {group.label}
                </span>
              </div>
              {group.items.map((block) => {
                const active = block.id === selectedId
                return (
                  <button
                    key={block.id}
                    onClick={() => onSelect(block)}
                    className={`flex w-full items-center gap-2 px-4 py-1.5 text-left text-sm transition-colors ${
                      active
                        ? 'border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-400 dark:bg-primary-900/20 dark:text-primary-300 border-l-2 font-medium'
                        : 'border-l-2 border-transparent text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        active
                          ? 'bg-primary-500 dark:bg-primary-400'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                    <span className="truncate">
                      {block.name || block.displayName}
                    </span>
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

export default BlockPicker
export type { BlockListItem }
