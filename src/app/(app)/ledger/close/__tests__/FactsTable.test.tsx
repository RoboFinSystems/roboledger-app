import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/core', () => ({
  customTheme: { table: {} },
}))

vi.mock('flowbite-react', () => ({
  Table: ({ children }: any) => <table>{children}</table>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableCell: ({ children, className }: any) => (
    <td className={className}>{children}</td>
  ),
  TableHead: ({ children }: any) => <thead>{children}</thead>,
  TableHeadCell: ({ children }: any) => <th>{children}</th>,
  TableRow: ({ children }: any) => <tr>{children}</tr>,
}))

import type { FactRow } from '../components/FactsTable'
import FactsTable from '../components/FactsTable'

describe('FactsTable', () => {
  it('renders fact rows with element names', () => {
    const facts: FactRow[] = [
      {
        elementName: 'Revenue',
        elementQname: 'us-gaap:Revenues',
        periodStart: '2026-01-01',
        periodEnd: '2026-03-31',
        value: 8500.0,
        unit: 'USD',
      },
      {
        elementName: 'Cost of Goods Sold',
        elementQname: 'us-gaap:CostOfGoodsSold',
        periodStart: '2026-01-01',
        periodEnd: '2026-03-31',
        value: 3400.0,
        unit: 'USD',
      },
    ]
    render(<FactsTable facts={facts} />)

    expect(screen.getByText('Revenue')).toBeInTheDocument()
    expect(screen.getByText('Cost of Goods Sold')).toBeInTheDocument()
  })

  it('renders element qnames', () => {
    const facts: FactRow[] = [
      {
        elementName: 'Revenue',
        elementQname: 'us-gaap:Revenues',
        periodStart: '2026-01-01',
        periodEnd: null,
        value: 8500.0,
      },
    ]
    render(<FactsTable facts={facts} />)
    expect(screen.getByText('us-gaap:Revenues')).toBeInTheDocument()
  })

  it('formats period range', () => {
    const facts: FactRow[] = [
      {
        elementName: 'Revenue',
        elementQname: 'us-gaap:Revenues',
        periodStart: '2026-01-01',
        periodEnd: '2026-03-31',
        value: 8500.0,
      },
    ]
    render(<FactsTable facts={facts} />)
    expect(screen.getByText(/Jan 1, 2026/)).toBeInTheDocument()
    expect(screen.getByText(/Mar 31, 2026/)).toBeInTheDocument()
  })

  it('formats single-date period', () => {
    const facts: FactRow[] = [
      {
        elementName: 'Cash',
        elementQname: 'us-gaap:Cash',
        periodStart: '2026-03-31',
        periodEnd: null,
        value: 15000.0,
      },
    ]
    render(<FactsTable facts={facts} />)
    expect(screen.getByText('Mar 31, 2026')).toBeInTheDocument()
  })

  it('formats numeric values with commas and decimals', () => {
    const facts: FactRow[] = [
      {
        elementName: 'Revenue',
        elementQname: 'us-gaap:Revenues',
        periodStart: '2026-01-01',
        periodEnd: null,
        value: 1234567.89,
      },
    ]
    render(<FactsTable facts={facts} />)
    expect(screen.getByText('1,234,567.89')).toBeInTheDocument()
  })

  it('renders string values as-is', () => {
    const facts: FactRow[] = [
      {
        elementName: 'Note',
        elementQname: 'us-gaap:Note',
        periodStart: '2026-01-01',
        periodEnd: null,
        value: 'Some text block',
      },
    ]
    render(<FactsTable facts={facts} />)
    expect(screen.getByText('Some text block')).toBeInTheDocument()
  })

  it('shows empty state when no facts', () => {
    render(<FactsTable facts={[]} />)
    expect(screen.getByText('No facts available.')).toBeInTheDocument()
  })

  it('defaults unit to USD when not provided', () => {
    const facts: FactRow[] = [
      {
        elementName: 'Revenue',
        elementQname: 'us-gaap:Revenues',
        periodStart: '2026-01-01',
        periodEnd: null,
        value: 100.0,
      },
    ]
    render(<FactsTable facts={facts} />)
    expect(screen.getByText('USD')).toBeInTheDocument()
  })

  it('renders table headers', () => {
    const facts: FactRow[] = [
      {
        elementName: 'Revenue',
        elementQname: 'us-gaap:Revenues',
        periodStart: '2026-01-01',
        periodEnd: null,
        value: 100.0,
      },
    ]
    render(<FactsTable facts={facts} />)
    expect(screen.getByText('Element')).toBeInTheDocument()
    expect(screen.getByText('QName')).toBeInTheDocument()
    expect(screen.getByText('Period')).toBeInTheDocument()
    expect(screen.getByText('Value')).toBeInTheDocument()
    expect(screen.getByText('Unit')).toBeInTheDocument()
  })
})
