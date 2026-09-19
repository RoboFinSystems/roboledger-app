import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { type SortColumn, sortRows, useTableSort } from '../useTableSort'

interface Row {
  code: string
  name: string
  net: number | null
}

// Natural order is the chart of accounts', not alphabetical or by size.
const ROWS: Row[] = [
  { code: '1200', name: 'Receivables', net: 8098.42 },
  { code: '1010', name: 'Cash', net: 19112.3 },
  { code: '2000', name: 'Payables', net: -4500 },
  { code: '9999', name: 'Suspense', net: null },
  { code: '200', name: 'Petty Cash', net: 250 },
]

const COLUMNS: Record<'code' | 'name' | 'net', SortColumn<Row>> = {
  code: { value: (row) => row.code },
  name: { value: (row) => row.name },
  net: { value: (row) => row.net },
}

const codes = (rows: Row[]) => rows.map((row) => row.code)

describe('sortRows', () => {
  it('leaves the natural order alone when unsorted', () => {
    expect(codes(sortRows(ROWS, COLUMNS, null))).toEqual(codes(ROWS))
  })

  it('orders numbers by value, signed', () => {
    expect(
      codes(sortRows(ROWS, COLUMNS, { key: 'net', direction: 'desc' }))
    ).toEqual(['1010', '1200', '200', '2000', '9999'])
  })

  it('keeps nulls last in BOTH directions', () => {
    expect(
      codes(sortRows(ROWS, COLUMNS, { key: 'net', direction: 'asc' })).at(-1)
    ).toBe('9999')
    expect(
      codes(sortRows(ROWS, COLUMNS, { key: 'net', direction: 'desc' })).at(-1)
    ).toBe('9999')
  })

  it('orders account codes numerically, not lexically', () => {
    // Lexically "1010" < "200"; an accountant expects 200 first.
    expect(
      codes(sortRows(ROWS, COLUMNS, { key: 'code', direction: 'asc' }))
    ).toEqual(['200', '1010', '1200', '2000', '9999'])
  })

  it('does not mutate the list it was given', () => {
    const before = codes(ROWS)
    sortRows(ROWS, COLUMNS, { key: 'name', direction: 'asc' })
    expect(codes(ROWS)).toEqual(before)
  })
})

describe('useTableSort', () => {
  it('cycles a column: first direction, the reverse, then natural order', () => {
    const { result } = renderHook(() => useTableSort(ROWS, COLUMNS))
    expect(result.current.ariaSort('name')).toBe('none')

    act(() => result.current.toggle('name'))
    expect(result.current.ariaSort('name')).toBe('ascending')
    expect(codes(result.current.sorted)[0]).toBe('1010') // Cash

    act(() => result.current.toggle('name'))
    expect(result.current.ariaSort('name')).toBe('descending')

    // The third click is the way back to the chart-of-accounts order.
    act(() => result.current.toggle('name'))
    expect(result.current.ariaSort('name')).toBe('none')
    expect(codes(result.current.sorted)).toEqual(codes(ROWS))
  })

  it('starts a numeric column largest-first', () => {
    const { result } = renderHook(() => useTableSort(ROWS, COLUMNS))
    act(() => result.current.toggle('net'))
    expect(result.current.ariaSort('net')).toBe('descending')
    expect(codes(result.current.sorted)[0]).toBe('1010')
  })

  it('honours an explicit first direction', () => {
    const columns = {
      ...COLUMNS,
      name: { ...COLUMNS.name, first: 'desc' as const },
    }
    const { result } = renderHook(() => useTableSort(ROWS, columns))
    act(() => result.current.toggle('name'))
    expect(result.current.ariaSort('name')).toBe('descending')
  })

  it('moves the sort to another column rather than stacking', () => {
    const { result } = renderHook(() => useTableSort(ROWS, COLUMNS))
    act(() => result.current.toggle('name'))
    act(() => result.current.toggle('net'))
    expect(result.current.ariaSort('name')).toBe('none')
    expect(result.current.ariaSort('net')).toBe('descending')
  })
})
