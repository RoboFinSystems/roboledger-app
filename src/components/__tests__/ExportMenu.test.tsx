import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ExportMenu from '../ExportMenu'

const GROUPS = [
  {
    header: 'Current view',
    items: [
      { key: 'csv:view', label: 'CSV', hint: 'Spreadsheet grid' },
      { key: 'json:view', label: 'JSON' },
    ],
  },
  {
    header: 'Full range',
    items: [{ key: 'csv:full', label: 'CSV' }],
  },
]

const openMenu = async () => {
  fireEvent.click(screen.getByRole('button', { name: /export/i }))
  await waitFor(() => expect(screen.getByText('Current view')).toBeVisible())
}

describe('ExportMenu', () => {
  it('lists every group and hands the item key back on select', async () => {
    const onSelect = vi.fn()
    render(<ExportMenu groups={GROUPS} onSelect={onSelect} />)
    await openMenu()

    expect(screen.getByText('Full range')).toBeInTheDocument()
    expect(screen.getByText('Spreadsheet grid')).toBeInTheDocument()
    // Same label in both groups — the key, not the label, carries scope.
    expect(screen.getAllByText('CSV')).toHaveLength(2)

    fireEvent.click(screen.getAllByText('CSV')[1])
    expect(onSelect).toHaveBeenCalledWith('csv:full')
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('takes a custom trigger label', () => {
    render(
      <ExportMenu groups={GROUPS} onSelect={vi.fn()} label="Download plan" />
    )
    expect(
      screen.getByRole('button', { name: /download plan/i })
    ).toBeInTheDocument()
  })

  it('disables the trigger when there is nothing to export', () => {
    render(<ExportMenu groups={GROUPS} onSelect={vi.fn()} disabled />)
    expect(screen.getByRole('button', { name: /export/i })).toBeDisabled()
  })
})
