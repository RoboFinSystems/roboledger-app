import { fireEvent, render, screen } from '@testing-library/react'
import { Table, TableHead } from 'flowbite-react'
import { describe, expect, it, vi } from 'vitest'
import SortableHeadCell from '../SortableHeadCell'

const renderCell = (
  sort: 'ascending' | 'descending' | 'none',
  onSort = vi.fn()
) => {
  // Inside flowbite's Table, as on the pages — TableHeadCell reads its theme
  // from the table's context.
  render(
    <Table>
      <TableHead>
        <tr>
          <SortableHeadCell sort={sort} onSort={onSort} align="right">
            Net Balance
          </SortableHeadCell>
        </tr>
      </TableHead>
    </Table>
  )
  return onSort
}

describe('SortableHeadCell', () => {
  it('reports its state on the <th>, where assistive tech reads it', () => {
    renderCell('descending')
    expect(screen.getByRole('columnheader')).toHaveAttribute(
      'aria-sort',
      'descending'
    )
  })

  it('sorts from a real button, so the header is keyboard-reachable', () => {
    const onSort = renderCell('none')
    fireEvent.click(screen.getByRole('button', { name: 'Net Balance' }))
    expect(onSort).toHaveBeenCalledTimes(1)
  })

  it('always shows an icon — faint when idle — so sorting is discoverable', () => {
    renderCell('none')
    const icon = screen.getByRole('button').querySelector('svg')
    expect(icon).not.toBeNull()
    expect(icon?.getAttribute('class')).toContain('opacity-40')
  })
})
