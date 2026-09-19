import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ownedStarts, useRowFold, visibleIndexes } from '../rowFold'

// Post-order, as the server emits it: children, then their subtotal.
const BALANCE_SHEET = [
  { key: 'Cash', depth: 2 },
  { key: 'ShortTermInvestments', depth: 2 },
  { key: 'AssetsCurrent', depth: 1 },
  { key: 'PropertyPlantAndEquipmentNet', depth: 2 },
  { key: 'AssetsNoncurrent', depth: 1 },
  { key: 'Assets', depth: 0 },
]

const keyOf = (row: { key: string }): string => row.key

describe('ownedStarts', () => {
  it('gives each subtotal the run of deeper rows directly above it', () => {
    expect(ownedStarts(BALANCE_SHEET)).toEqual([0, 1, 0, 3, 3, 0])
  })

  it('owns nothing for a calc-only subtotal whose summands are siblings', () => {
    // Revenues, Cost of Revenue, Gross Profit — all one depth.
    expect(ownedStarts([{ depth: 1 }, { depth: 1 }, { depth: 1 }])).toEqual([
      0, 1, 2,
    ])
  })

  it('owns across skipped levels (abstract rows are dropped server-side)', () => {
    expect(ownedStarts([{ depth: 3 }, { depth: 3 }, { depth: 1 }])).toEqual([
      0, 1, 0,
    ])
  })
})

describe('visibleIndexes', () => {
  const owned = ownedStarts(BALANCE_SHEET)

  it('shows everything when nothing is folded', () => {
    expect(visibleIndexes(owned, () => false)).toEqual([0, 1, 2, 3, 4, 5])
  })

  it('hides only the rows a folded subtotal owns', () => {
    expect(visibleIndexes(owned, (i) => i === 2)).toEqual([2, 3, 4, 5])
  })

  it('folds nested sections under a folded root', () => {
    expect(visibleIndexes(owned, (i) => i === 5)).toEqual([5])
  })

  it('ignores a fold on a row that owns nothing', () => {
    expect(visibleIndexes(owned, (i) => i === 0)).toHaveLength(6)
  })
})

describe('useRowFold', () => {
  it('toggles one section and reports what it hid', () => {
    const { result } = renderHook(() => useRowFold(BALANCE_SHEET, keyOf))
    expect(result.current.isFoldable(2)).toBe(true)
    expect(result.current.isFoldable(0)).toBe(false)
    expect(result.current.ownedCount(2)).toBe(2)
    expect(result.current.ownedCount(5)).toBe(5)

    act(() => result.current.toggle(2))
    expect(result.current.isFolded(2)).toBe(true)
    expect(result.current.visible).toEqual([2, 3, 4, 5])

    act(() => result.current.toggle(2))
    expect(result.current.visible).toHaveLength(6)
  })

  it('collapses and expands everything, enabling the right control', () => {
    const { result } = renderHook(() => useRowFold(BALANCE_SHEET, keyOf))
    expect(result.current.canExpand).toBe(false)
    expect(result.current.canCollapse).toBe(true)

    act(() => result.current.collapseAll())
    expect(result.current.visible).toEqual([5])
    expect(result.current.canExpand).toBe(true)
    expect(result.current.canCollapse).toBe(false)

    act(() => result.current.expandAll())
    expect(result.current.visible).toHaveLength(6)
  })

  it('offers neither control when no row owns another', () => {
    const { result } = renderHook(() =>
      useRowFold(
        [
          { key: 'a', depth: 0 },
          { key: 'b', depth: 0 },
        ],
        keyOf
      )
    )
    expect(result.current.canExpand).toBe(false)
    expect(result.current.canCollapse).toBe(false)
  })

  it('keeps a section folded when the rows are replaced (refresh, new period)', () => {
    const { result, rerender } = renderHook(
      ({ rows }) => useRowFold(rows, keyOf),
      { initialProps: { rows: BALANCE_SHEET } }
    )
    act(() => result.current.toggle(2))

    // A fresh array with an extra leaf — the folded key still matches.
    rerender({ rows: [{ key: 'Receivables', depth: 2 }, ...BALANCE_SHEET] })
    expect(result.current.isFolded(3)).toBe(true)
    expect(result.current.visible).toEqual([3, 4, 5, 6])
  })
})
