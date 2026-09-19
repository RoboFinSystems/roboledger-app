'use client'

import type { FC } from 'react'
import { HiChevronDown, HiChevronRight } from 'react-icons/hi'

interface FoldLabelProps {
  label: string
  canFold: boolean
  folded: boolean
  /** Rows hidden while folded — shown as "4 lines" beside the label. */
  ownedCount: number
}

/**
 * A statement row's label, with a disclosure chevron when the row folds.
 *
 * The button carries no handler of its own: its click (Enter / Space
 * included) bubbles to the label cell, which owns `onClick`. That makes the
 * whole cell the target rather than just the text — and deliberately not the
 * whole row, so dragging across the numbers to copy them never folds a
 * section.
 */
const FoldLabel: FC<FoldLabelProps> = ({
  label,
  canFold,
  folded,
  ownedCount,
}) => {
  if (!canFold) {
    // Indent past the chevron gutter so labels at one depth line up whether
    // or not the row folds.
    return <span className="pl-5">{label}</span>
  }
  const Chevron = folded ? HiChevronRight : HiChevronDown
  return (
    <button
      type="button"
      aria-expanded={!folded}
      className="flex items-center gap-1 text-left"
    >
      <Chevron className="h-4 w-4 shrink-0 text-gray-400" />
      {label}
      {folded && (
        <span className="ml-1 text-xs font-normal whitespace-nowrap text-gray-500 dark:text-gray-400">
          {ownedCount} line{ownedCount === 1 ? '' : 's'}
        </span>
      )}
    </button>
  )
}

export default FoldLabel
