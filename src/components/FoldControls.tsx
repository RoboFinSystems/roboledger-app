'use client'

import type { RowFold } from '@/lib/ledger/rowFold'
import type { FC } from 'react'

interface FoldControlsProps {
  fold: Pick<RowFold, 'canExpand' | 'canCollapse' | 'expandAll' | 'collapseAll'>
}

const BUTTON =
  'bg-white px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:disabled:hover:bg-gray-800'

/**
 * Expand all / Collapse all for a foldable statement table. Shaped like
 * `PeriodWindowControl` — the two share a toolbar on the block page.
 */
const FoldControls: FC<FoldControlsProps> = ({ fold }) => (
  <div
    className="inline-flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
    role="group"
    aria-label="Sections"
  >
    <button
      type="button"
      disabled={!fold.canExpand}
      onClick={fold.expandAll}
      className={BUTTON}
    >
      Expand all
    </button>
    <button
      type="button"
      disabled={!fold.canCollapse}
      onClick={fold.collapseAll}
      className={`${BUTTON} border-l border-gray-200 dark:border-gray-700`}
    >
      Collapse all
    </button>
  </div>
)

export default FoldControls
