'use client'

import { TableHeadCell } from 'flowbite-react'
import type { FC, ReactNode } from 'react'
import { HiChevronDown, HiChevronUp, HiSelector } from 'react-icons/hi'

interface SortableHeadCellProps {
  children: ReactNode
  /** From `useTableSort().ariaSort(key)`. */
  sort: 'ascending' | 'descending' | 'none'
  onSort: () => void
  align?: 'left' | 'right'
}

/**
 * A column header that sorts its table. `aria-sort` sits on the `<th>`, where
 * assistive tech reads it; the click target is a real button, so the header
 * is keyboard-reachable. The idle icon is faint but always there — a header
 * that only reveals it sorts on hover isn't discoverable.
 */
const SortableHeadCell: FC<SortableHeadCellProps> = ({
  children,
  sort,
  onSort,
  align = 'left',
}) => {
  const Icon =
    sort === 'ascending'
      ? HiChevronUp
      : sort === 'descending'
        ? HiChevronDown
        : HiSelector
  return (
    <TableHeadCell
      aria-sort={sort}
      className={align === 'right' ? 'text-right' : undefined}
    >
      <button
        type="button"
        onClick={onSort}
        className={`inline-flex items-center gap-1 uppercase hover:text-gray-900 dark:hover:text-white ${
          align === 'right' ? 'flex-row-reverse' : ''
        } ${sort === 'none' ? '' : 'text-gray-900 dark:text-white'}`}
      >
        {children}
        <Icon
          aria-hidden
          className={`h-3.5 w-3.5 shrink-0 ${sort === 'none' ? 'opacity-40' : ''}`}
        />
      </button>
    </TableHeadCell>
  )
}

export default SortableHeadCell
