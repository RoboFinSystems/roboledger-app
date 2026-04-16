import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('flowbite-react', () => ({
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
  Spinner: () => <div data-testid="spinner" />,
}))

vi.mock('react-icons/hi', () => ({
  HiChevronLeft: () => <span data-testid="icon-collapse" />,
  HiChevronRight: () => <span data-testid="icon-expand" />,
}))

import type { LedgerClosingBookStructures } from '@robosystems/client/clients'
import type { SelectedItem } from '../components/StructureSidebar'
import StructureSidebar from '../components/StructureSidebar'

type ClosingBookCategory = LedgerClosingBookStructures['categories'][number]

const makeCategories = (): ClosingBookCategory[] => [
  {
    label: 'Statements',
    items: [
      {
        id: 'struct_is',
        name: 'Income Statement',
        itemType: 'statement',
        structureType: 'income_statement',
        reportId: 'rpt_01',
      },
      {
        id: 'struct_bs',
        name: 'Balance Sheet',
        itemType: 'statement',
        structureType: 'balance_sheet',
        reportId: 'rpt_01',
      },
    ],
  },
  {
    label: 'Account Rollups',
    items: [
      {
        id: 'struct_map_01',
        name: 'GAAP Mapping',
        itemType: 'account_rollups',
      },
    ],
  },
  {
    label: 'Schedules',
    items: [
      {
        id: 'struct_depr',
        name: 'Office Furniture Depreciation',
        itemType: 'schedule',
        structureType: 'schedule',
      },
    ],
  },
  {
    label: 'Period Close',
    items: [
      {
        id: 'period_close',
        name: 'Current Period Status',
        itemType: 'period_close',
      },
    ],
  },
]

describe('StructureSidebar', () => {
  it('renders all category labels', () => {
    render(
      <StructureSidebar
        categories={makeCategories()}
        selectedItem={null}
        onSelect={vi.fn()}
        isLoading={false}
      />
    )
    expect(screen.getByText('Statements')).toBeInTheDocument()
    expect(screen.getByText('Account Rollups')).toBeInTheDocument()
    expect(screen.getByText('Schedules')).toBeInTheDocument()
    expect(screen.getByText('Period Close')).toBeInTheDocument()
  })

  it('renders all item names', () => {
    render(
      <StructureSidebar
        categories={makeCategories()}
        selectedItem={null}
        onSelect={vi.fn()}
        isLoading={false}
      />
    )
    expect(screen.getByText('Income Statement')).toBeInTheDocument()
    expect(screen.getByText('Balance Sheet')).toBeInTheDocument()
    expect(screen.getByText('GAAP Mapping')).toBeInTheDocument()
    expect(
      screen.getByText('Office Furniture Depreciation')
    ).toBeInTheDocument()
    expect(screen.getByText('Current Period Status')).toBeInTheDocument()
  })

  it('shows spinner when loading', () => {
    render(
      <StructureSidebar
        categories={[]}
        selectedItem={null}
        onSelect={vi.fn()}
        isLoading={true}
      />
    )
    expect(screen.getByTestId('spinner')).toBeInTheDocument()
  })

  it('highlights active statement item', () => {
    const selected: SelectedItem = {
      type: 'statement',
      reportId: 'rpt_01',
      structureType: 'income_statement',
    }
    render(
      <StructureSidebar
        categories={makeCategories()}
        selectedItem={selected}
        onSelect={vi.fn()}
        isLoading={false}
      />
    )
    const isButton = screen.getByText('Income Statement').closest('button')
    expect(isButton?.className).toContain('border-blue-500')
    // Balance Sheet should NOT be highlighted
    const bsButton = screen.getByText('Balance Sheet').closest('button')
    expect(bsButton?.className).toContain('border-transparent')
  })

  it('highlights active schedule item', () => {
    const selected: SelectedItem = {
      type: 'schedule',
      structureId: 'struct_depr',
      name: 'Office Furniture Depreciation',
    }
    render(
      <StructureSidebar
        categories={makeCategories()}
        selectedItem={selected}
        onSelect={vi.fn()}
        isLoading={false}
      />
    )
    const btn = screen
      .getByText('Office Furniture Depreciation')
      .closest('button')
    expect(btn?.className).toContain('border-blue-500')
  })

  it('highlights active account rollups item', () => {
    const selected: SelectedItem = {
      type: 'account_rollups',
      mappingId: 'struct_map_01',
      name: 'GAAP Mapping',
    }
    render(
      <StructureSidebar
        categories={makeCategories()}
        selectedItem={selected}
        onSelect={vi.fn()}
        isLoading={false}
      />
    )
    const btn = screen.getByText('GAAP Mapping').closest('button')
    expect(btn?.className).toContain('border-blue-500')
  })

  it('calls onSelect with correct SelectedItem when clicking a statement', () => {
    const onSelect = vi.fn()
    render(
      <StructureSidebar
        categories={makeCategories()}
        selectedItem={null}
        onSelect={onSelect}
        isLoading={false}
      />
    )
    fireEvent.click(screen.getByText('Balance Sheet'))
    expect(onSelect).toHaveBeenCalledWith({
      type: 'statement',
      reportId: 'rpt_01',
      structureType: 'balance_sheet',
    })
  })

  it('calls onSelect with correct SelectedItem when clicking a schedule', () => {
    const onSelect = vi.fn()
    render(
      <StructureSidebar
        categories={makeCategories()}
        selectedItem={null}
        onSelect={onSelect}
        isLoading={false}
      />
    )
    fireEvent.click(screen.getByText('Office Furniture Depreciation'))
    expect(onSelect).toHaveBeenCalledWith({
      type: 'schedule',
      structureId: 'struct_depr',
      name: 'Office Furniture Depreciation',
    })
  })

  it('calls onSelect with correct SelectedItem when clicking period close', () => {
    const onSelect = vi.fn()
    render(
      <StructureSidebar
        categories={makeCategories()}
        selectedItem={null}
        onSelect={onSelect}
        isLoading={false}
      />
    )
    fireEvent.click(screen.getByText('Current Period Status'))
    expect(onSelect).toHaveBeenCalledWith({
      type: 'period_close',
    })
  })

  it('collapses and expands the sidebar', () => {
    render(
      <StructureSidebar
        categories={makeCategories()}
        selectedItem={null}
        onSelect={vi.fn()}
        isLoading={false}
      />
    )
    // Initially expanded — items visible
    expect(screen.getByText('Income Statement')).toBeInTheDocument()

    // Click collapse
    const collapseBtn = screen.getByTestId('icon-collapse').closest('button')
    fireEvent.click(collapseBtn!)

    // Items should be gone
    expect(screen.queryByText('Income Statement')).not.toBeInTheDocument()

    // Click expand
    const expandBtn = screen.getByTestId('icon-expand').closest('button')
    fireEvent.click(expandBtn!)

    // Items visible again
    expect(screen.getByText('Income Statement')).toBeInTheDocument()
  })

  it('renders empty categories list without crashing', () => {
    render(
      <StructureSidebar
        categories={[]}
        selectedItem={null}
        onSelect={vi.fn()}
        isLoading={false}
      />
    )
    expect(screen.getByText('Closing Book')).toBeInTheDocument()
  })

  it('renders the Closing Book header', () => {
    render(
      <StructureSidebar
        categories={makeCategories()}
        selectedItem={null}
        onSelect={vi.fn()}
        isLoading={false}
      />
    )
    expect(screen.getByText('Closing Book')).toBeInTheDocument()
  })
})
