'use client'

import type { ReportPackage } from '@robosystems/client/clients'
import { Button } from 'flowbite-react'
import type { FC } from 'react'
import { useState } from 'react'
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi'
import {
  DISCLOSURE_BLOCK_TYPE,
  isStatementBlockType,
} from '../../../ledger/close/components/blockview/types'

type PackageItem = ReportPackage['items'][number]

type SidebarGroup = {
  label: string
  items: PackageItem[]
}

/**
 * Group package items into display sections. Mirrors the §5.1 sketch
 * in `financial-viewer.md` — Financial Statements / Notes / Working
 * Papers / Other. Group order matches the package's stacked display
 * order (statements → disclosures → schedules). Groups omitted when
 * empty.
 */
function groupItems(items: PackageItem[]): SidebarGroup[] {
  const statements: PackageItem[] = []
  const notes: PackageItem[] = []
  const workingPapers: PackageItem[] = []
  const other: PackageItem[] = []

  for (const item of items) {
    const blockType = item.block?.blockType ?? ''
    if (isStatementBlockType(blockType)) {
      statements.push(item)
    } else if (blockType === DISCLOSURE_BLOCK_TYPE) {
      notes.push(item)
    } else if (blockType === 'schedule') {
      workingPapers.push(item)
    } else {
      other.push(item)
    }
  }

  const groups: SidebarGroup[] = []
  if (statements.length > 0) {
    groups.push({ label: 'Financial Statements', items: statements })
  }
  if (notes.length > 0) {
    groups.push({ label: 'Notes', items: notes })
  }
  if (workingPapers.length > 0) {
    groups.push({ label: 'Working Papers', items: workingPapers })
  }
  if (other.length > 0) {
    groups.push({ label: 'Other', items: other })
  }
  return groups
}

function itemLabel(item: PackageItem): string {
  return item.block?.displayName || item.block?.name || 'Untitled'
}

interface ReportPackageSidebarProps {
  items: PackageItem[]
  activeFactSetId: string | null
  onSelect: (factSetId: string) => void
}

/**
 * Sidebar navigation for `ReportPackageView`. One entry per member
 * Information Block, grouped by block-type family. Sticky position so
 * it stays visible while the user scrolls the stacked `BlockView`s.
 * Anchor-scroll only — clicking an entry jumps the page to that
 * block's anchor; active state is driven from the parent's scroll
 * observer.
 */
const ReportPackageSidebar: FC<ReportPackageSidebarProps> = ({
  items,
  activeFactSetId,
  onSelect,
}) => {
  const [collapsed, setCollapsed] = useState(false)
  const groups = groupItems(items)

  // Sidebar is a top-of-page table of contents. `position: sticky`
  // would be ideal, but the page chrome's `overflow-y: auto` wrapper
  // isn't the actual scrolling context (html is), so sticky fails to
  // pin. Matches the close-page sidebar pattern (also non-sticky).
  // On narrow viewports the sidebar stacks above the content; the
  // parent flex container handles the column → row flip at the `lg`
  // breakpoint.
  if (collapsed) {
    return (
      <div className="flex w-full shrink-0 flex-col items-center self-start rounded-lg border border-gray-200 bg-white py-2 lg:w-auto dark:border-gray-700 dark:bg-gray-800">
        <Button
          size="xs"
          color="light"
          onClick={() => setCollapsed(false)}
          className="border-0 bg-transparent p-1"
          aria-label="Expand sidebar"
        >
          <HiChevronRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full shrink-0 self-start rounded-lg border border-gray-200 bg-white lg:w-64 dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <span className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
          Package
        </span>
        <Button
          size="xs"
          color="light"
          onClick={() => setCollapsed(true)}
          className="border-0 bg-transparent p-1"
          aria-label="Collapse sidebar"
        >
          <HiChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <div className="max-h-[calc(100vh-8rem)] overflow-y-auto py-2">
        {groups.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs text-gray-400">
            No items
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="mb-3">
              <div className="px-4 py-1.5">
                <span className="text-xs font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                  {group.label}
                </span>
              </div>
              {group.items.map((item) => {
                const active = item.factSetId === activeFactSetId
                return (
                  <button
                    key={item.factSetId}
                    onClick={() => onSelect(item.factSetId)}
                    aria-current={active ? 'true' : undefined}
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
                    <span className="truncate">{itemLabel(item)}</span>
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

export default ReportPackageSidebar
export type { ReportPackageSidebarProps }
