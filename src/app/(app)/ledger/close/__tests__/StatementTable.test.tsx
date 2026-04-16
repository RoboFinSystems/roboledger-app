import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/core', () => ({
  customTheme: { table: {} },
}))

vi.mock('flowbite-react', () => ({
  Table: ({ children }: any) => <table>{children}</table>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableCell: ({ children, className, style }: any) => (
    <td className={className} style={style}>
      {children}
    </td>
  ),
  TableHead: ({ children }: any) => <thead>{children}</thead>,
  TableHeadCell: ({ children, className }: any) => (
    <th className={className}>{children}</th>
  ),
  TableRow: ({ children, className }: any) => (
    <tr className={className}>{children}</tr>
  ),
}))

import type { StatementData } from '@robosystems/client/clients'
import StatementTable from '../components/StatementTable'

const makeStatement = (overrides?: Partial<StatementData>): StatementData => ({
  reportId: 'rpt_01',
  structureId: 'struct_01',
  structureName: 'Income Statement',
  structureType: 'income_statement',
  periods: [{ start: '2026-01-01', end: '2026-03-31', label: 'Q1 2026' }],
  rows: [
    {
      elementId: 'elem_rev',
      elementQname: 'us-gaap:Revenues',
      elementName: 'Revenue',
      values: [8500.0],
      isSubtotal: false,
      depth: 0,
    },
    {
      elementId: 'elem_cogs',
      elementQname: 'us-gaap:CostOfGoodsSold',
      elementName: 'Cost of Goods Sold',
      values: [-3400.0],
      isSubtotal: false,
      depth: 0,
    },
    {
      elementId: 'elem_gp',
      elementQname: 'us-gaap:GrossProfit',
      elementName: 'Gross Profit',
      values: [5100.0],
      isSubtotal: true,
      depth: 0,
    },
  ],
  validation: null,
  unmappedCount: 0,
  ...overrides,
})

describe('StatementTable', () => {
  it('renders entity name when provided', () => {
    render(
      <StatementTable
        data={makeStatement()}
        entityName="Harbinger Consultants LLC"
      />
    )
    expect(screen.getByText('Harbinger Consultants LLC')).toBeInTheDocument()
  })

  it('renders structure name', () => {
    render(<StatementTable data={makeStatement()} />)
    expect(screen.getByText('Income Statement')).toBeInTheDocument()
  })

  it('renders period headers', () => {
    render(<StatementTable data={makeStatement()} />)
    expect(screen.getByText('Q1 2026')).toBeInTheDocument()
  })

  it('renders element names', () => {
    render(<StatementTable data={makeStatement()} />)
    expect(screen.getByText('Revenue')).toBeInTheDocument()
    expect(screen.getByText('Cost of Goods Sold')).toBeInTheDocument()
    expect(screen.getByText('Gross Profit')).toBeInTheDocument()
  })

  it('formats positive values without parentheses', () => {
    render(<StatementTable data={makeStatement()} />)
    expect(screen.getByText('8,500.00')).toBeInTheDocument()
  })

  it('formats negative values with parentheses', () => {
    render(<StatementTable data={makeStatement()} />)
    expect(screen.getByText('(3,400.00)')).toBeInTheDocument()
  })

  it('applies bold styling to subtotal rows', () => {
    render(<StatementTable data={makeStatement()} />)
    const grossProfitRow = screen.getByText('Gross Profit').closest('tr')
    expect(grossProfitRow?.className).toContain('bg-gray-50')
  })

  it('applies depth-based indentation', () => {
    const data = makeStatement({
      rows: [
        {
          elementId: 'elem_parent',
          elementQname: 'us-gaap:OpEx',
          elementName: 'Operating Expenses',
          values: [1000.0],
          isSubtotal: false,
          depth: 0,
        },
        {
          elementId: 'elem_child',
          elementQname: 'us-gaap:SGA',
          elementName: 'SG&A',
          values: [500.0],
          isSubtotal: false,
          depth: 1,
        },
        {
          elementId: 'elem_grandchild',
          elementQname: 'us-gaap:Rent',
          elementName: 'Rent Expense',
          values: [250.0],
          isSubtotal: false,
          depth: 2,
        },
      ],
    })
    render(<StatementTable data={data} />)

    const parent = screen.getByText('Operating Expenses').closest('td')
    const child = screen.getByText('SG&A').closest('td')
    const grandchild = screen.getByText('Rent Expense').closest('td')

    // depth * 24 + 16
    expect(parent?.style.paddingLeft).toBe('16px')
    expect(child?.style.paddingLeft).toBe('40px')
    expect(grandchild?.style.paddingLeft).toBe('64px')
  })

  it('renders multi-period columns', () => {
    const data = makeStatement({
      periods: [
        { start: '2026-01-01', end: '2026-01-31', label: 'Jan 2026' },
        { start: '2026-02-01', end: '2026-02-28', label: 'Feb 2026' },
        { start: '2026-03-01', end: '2026-03-31', label: 'Mar 2026' },
      ],
      rows: [
        {
          elementId: 'elem_rev',
          elementQname: 'us-gaap:Revenues',
          elementName: 'Revenue',
          values: [8000.0, 8200.0, 8500.0],
          isSubtotal: false,
          depth: 0,
        },
      ],
    })
    render(<StatementTable data={data} />)

    expect(screen.getByText('Jan 2026')).toBeInTheDocument()
    expect(screen.getByText('Feb 2026')).toBeInTheDocument()
    expect(screen.getByText('Mar 2026')).toBeInTheDocument()
    expect(screen.getByText('8,000.00')).toBeInTheDocument()
    expect(screen.getByText('8,200.00')).toBeInTheDocument()
    expect(screen.getByText('8,500.00')).toBeInTheDocument()
  })

  it('renders dash for null values', () => {
    const data = makeStatement({
      rows: [
        {
          elementId: 'elem_rev',
          elementQname: 'us-gaap:Revenues',
          elementName: 'Revenue',
          values: [null],
          isSubtotal: false,
          depth: 0,
        },
      ],
    })
    render(<StatementTable data={data} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('applies muted styling to all-zero non-subtotal rows', () => {
    const data = makeStatement({
      rows: [
        {
          elementId: 'elem_zero',
          elementQname: 'us-gaap:Zero',
          elementName: 'Zero Line',
          values: [0],
          isSubtotal: false,
          depth: 0,
        },
      ],
    })
    render(<StatementTable data={data} />)
    const cell = screen.getByText('Zero Line').closest('td')
    expect(cell?.className).toContain('text-gray-400')
  })

  it('does not show entity name header when not provided', () => {
    render(<StatementTable data={makeStatement()} />)
    expect(
      screen.queryByText('Harbinger Consultants LLC')
    ).not.toBeInTheDocument()
  })

  it('applies double underline to top-level subtotals', () => {
    render(<StatementTable data={makeStatement()} />)
    // Gross Profit is depth 0, isSubtotal true → gets border-double
    const gpValueCell = screen.getByText('5,100.00').closest('td')
    expect(gpValueCell?.className).toContain('border-double')
  })
})
