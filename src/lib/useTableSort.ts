import { useMemo, useState } from 'react'

export type SortDirection = 'asc' | 'desc'

export interface SortState<K extends string> {
  key: K
  direction: SortDirection
}

export interface SortColumn<T> {
  /** The value to order by. `null` sorts last in either direction. */
  value: (row: T) => string | number | null
  /**
   * Where the first click lands. Numbers default to `desc` — a reader sorting
   * a balance column is looking for the largest — and text to `asc`.
   */
  first?: SortDirection
}

const compareValues = (
  a: string | number | null,
  b: string | number | null
): number => {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), 'en-US', {
    numeric: true,
    sensitivity: 'base',
  })
}

/** `rows` ordered by `sort`, or untouched when `sort` is null. */
export function sortRows<T, K extends string>(
  rows: readonly T[],
  columns: Record<K, SortColumn<T>>,
  sort: SortState<K> | null
): T[] {
  if (!sort) return [...rows]
  const { value } = columns[sort.key]
  const sign = sort.direction === 'asc' ? 1 : -1
  // Array.prototype.sort is stable, so ties keep the list's natural order.
  return [...rows].sort((rowA, rowB) => {
    const a = value(rowA)
    const b = value(rowB)
    if (a === null || b === null) return a === b ? 0 : a === null ? 1 : -1
    return sign * compareValues(a, b)
  })
}

export interface TableSort<T, K extends string> {
  sorted: T[]
  sort: SortState<K> | null
  /** Cycle a column: first direction → the reverse → natural order. */
  toggle: (key: K) => void
  /** For a header cell's `aria-sort`. */
  ariaSort: (key: K) => 'ascending' | 'descending' | 'none'
}

/**
 * Click-to-sort for a table whose WHOLE list is in the browser.
 *
 * Do not use it on a capped or paginated fetch (the Journal and Inbox load a
 * window of at most 500): it would rank only what happened to load, and a
 * reader has no way to tell "largest" from "largest of the first 500".
 *
 * The third click returns to the natural order rather than looping between
 * directions — on the Trial Balance that order is the chart of accounts', and
 * there has to be a way back to it. Declare `columns` at module level (or
 * memoise it) so the sorted list isn't rebuilt on every render.
 */
export function useTableSort<T, K extends string>(
  rows: readonly T[],
  columns: Record<K, SortColumn<T>>
): TableSort<T, K> {
  const [sort, setSort] = useState<SortState<K> | null>(null)

  const sorted = useMemo(
    () => sortRows(rows, columns, sort),
    [rows, columns, sort]
  )

  const firstDirection = (key: K): SortDirection => {
    const column = columns[key]
    if (column.first) return column.first
    const sample = rows.map(column.value).find((v) => v !== null)
    return typeof sample === 'number' ? 'desc' : 'asc'
  }

  const toggle = (key: K) =>
    setSort((current) => {
      const first = firstDirection(key)
      if (current?.key !== key) return { key, direction: first }
      if (current.direction === first) {
        return { key, direction: first === 'asc' ? 'desc' : 'asc' }
      }
      return null
    })

  const ariaSort = (key: K) =>
    sort?.key !== key
      ? ('none' as const)
      : sort.direction === 'asc'
        ? ('ascending' as const)
        : ('descending' as const)

  return { sorted, sort, toggle, ariaSort }
}
