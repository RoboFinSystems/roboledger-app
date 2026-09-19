import { useCallback, useMemo, useState } from 'react'

/**
 * Section folding for statement rows.
 *
 * Statement grids arrive flat and post-order — children, then their subtotal.
 * That order comes from `fact_grid._build_rows` on the server, which both the
 * live-statement op and every envelope rendering (statements and numeric
 * disclosures) go through. So a row owns the contiguous run of deeper rows
 * directly above it, and folding the row hides that run.
 *
 * Foldable is structural, not `isSubtotal`: a calc-only subtotal (Gross
 * Profit — its summands are siblings) owns no rows and has nothing to fold.
 */

/**
 * For each row, the index of the first row it owns — its own index when it
 * owns none. Depth can skip levels (abstract and all-zero rows are dropped
 * server-side), so ownership is "deeper than me", not "exactly one deeper".
 */
export function ownedStarts(rows: readonly { depth: number }[]): number[] {
  return rows.map((row, i) => {
    let start = i
    while (start > 0 && rows[start - 1].depth > row.depth) start--
    return start
  })
}

/** Row indexes left showing once every row owned by a folded row is hidden. */
export function visibleIndexes(
  owned: readonly number[],
  isFolded: (index: number) => boolean
): number[] {
  const hidden = new Set<number>()
  owned.forEach((start, i) => {
    if (start === i || !isFolded(i)) return
    for (let j = start; j < i; j++) hidden.add(j)
  })
  return owned.map((_, i) => i).filter((i) => !hidden.has(i))
}

export interface RowFold {
  /** Indexes into `rows` that are currently showing, in order. */
  visible: number[]
  isFoldable: (index: number) => boolean
  isFolded: (index: number) => boolean
  /** How many rows the row at `index` owns (nested subtotals included). */
  ownedCount: (index: number) => number
  toggle: (index: number) => void
  expandAll: () => void
  collapseAll: () => void
  canExpand: boolean
  canCollapse: boolean
}

/**
 * Fold state for a statement table.
 *
 * State is keyed by `keyOf(row)` rather than by index, so a folded section
 * stays folded across a refresh, a period change, or a column window change;
 * keys left over from another statement simply match nothing. Pass a stable
 * (module-level) `keyOf`.
 */
export function useRowFold<T extends { depth: number }>(
  rows: readonly T[],
  keyOf: (row: T) => string
): RowFold {
  const [folded, setFolded] = useState<ReadonlySet<string>>(new Set())

  const owned = useMemo(() => ownedStarts(rows), [rows])
  const foldableKeys = useMemo(
    () => rows.filter((_, i) => owned[i] < i).map(keyOf),
    [rows, owned, keyOf]
  )

  const isFoldable = useCallback(
    (index: number) => owned[index] < index,
    [owned]
  )
  const isFolded = useCallback(
    (index: number) => isFoldable(index) && folded.has(keyOf(rows[index])),
    [isFoldable, folded, keyOf, rows]
  )
  const visible = useMemo(
    () => visibleIndexes(owned, isFolded),
    [owned, isFolded]
  )

  const toggle = useCallback(
    (index: number) => {
      const key = keyOf(rows[index])
      setFolded((prev) => {
        const next = new Set(prev)
        if (!next.delete(key)) next.add(key)
        return next
      })
    },
    [keyOf, rows]
  )

  const foldedHere = foldableKeys.filter((key) => folded.has(key)).length

  return {
    visible,
    isFoldable,
    isFolded,
    ownedCount: (index) => index - owned[index],
    toggle,
    expandAll: () => setFolded(new Set()),
    collapseAll: () => setFolded(new Set(foldableKeys)),
    canExpand: foldedHere > 0,
    canCollapse: foldedHere < foldableKeys.length,
  }
}
