import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const mockGetAccountRollups = vi.fn()

vi.mock('@/lib/core', () => ({
  customTheme: { table: {} },
  extensions: {
    ledger: {
      getAccountRollups: (...args: any[]) => mockGetAccountRollups(...args),
    },
  },
}))

vi.mock('flowbite-react', () => ({
  Badge: ({ children }: any) => <span data-testid="badge">{children}</span>,
  Spinner: () => <div data-testid="spinner" />,
  Table: ({ children }: any) => <table>{children}</table>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableCell: ({ children, className, style }: any) => (
    <td className={className} style={style}>
      {children}
    </td>
  ),
  TableHead: ({ children }: any) => <thead>{children}</thead>,
  TableHeadCell: ({ children }: any) => <th>{children}</th>,
  TableRow: ({ children, className }: any) => (
    <tr className={className}>{children}</tr>
  ),
}))

vi.mock('react-icons/hi', () => ({
  HiExclamationCircle: () => <span />,
}))

vi.mock('../components/FactsTable', () => ({
  default: ({ facts }: any) => (
    <div data-testid="facts-table">
      {facts.map((f: any, i: number) => (
        <span key={i}>{f.elementName}</span>
      ))}
    </div>
  ),
}))

import type { AccountRollupsResponse } from '@robosystems/client'
import AccountRollupsPanel from '../components/AccountRollupsPanel'

const makeResponse = (
  overrides?: Partial<AccountRollupsResponse>
): AccountRollupsResponse => ({
  mapping_id: 'struct_map_01',
  mapping_name: 'GAAP Mapping',
  groups: [
    {
      reporting_element_id: 'elem_cash',
      reporting_name: 'Cash and Cash Equivalents',
      reporting_qname: 'us-gaap:CashAndCashEquivalents',
      classification: 'asset',
      balance_type: 'debit',
      total: 15250.0,
      accounts: [
        {
          element_id: 'coa_checking',
          account_name: 'BofA Checking',
          account_code: '1010',
          total_debits: 100000.0,
          total_credits: 90000.0,
          net_balance: 10000.0,
        },
        {
          element_id: 'coa_savings',
          account_name: 'Savings Account',
          account_code: '1020',
          total_debits: 5250.0,
          total_credits: 0,
          net_balance: 5250.0,
        },
      ],
    },
    {
      reporting_element_id: 'elem_rev',
      reporting_name: 'Revenue',
      reporting_qname: 'us-gaap:Revenues',
      classification: 'revenue',
      balance_type: 'credit',
      total: 8000.0,
      accounts: [
        {
          element_id: 'coa_sales',
          account_name: 'Sales Revenue',
          account_code: '4000',
          total_debits: 0,
          total_credits: 8000.0,
          net_balance: 8000.0,
        },
      ],
    },
  ],
  total_mapped: 3,
  total_unmapped: 2,
  ...overrides,
})

describe('AccountRollupsPanel', () => {
  it('shows spinner while loading', () => {
    mockGetAccountRollups.mockReturnValue(new Promise(() => {})) // never resolves
    render(
      <AccountRollupsPanel
        graphId="kg_test"
        mappingId="struct_map_01"
        viewMode="rendered"
      />
    )
    expect(screen.getByTestId('spinner')).toBeInTheDocument()
  })

  it('renders reporting element group headers', async () => {
    mockGetAccountRollups.mockResolvedValue(makeResponse())
    render(
      <AccountRollupsPanel
        graphId="kg_test"
        mappingId="struct_map_01"
        viewMode="rendered"
      />
    )
    await waitFor(() => {
      expect(screen.getByText('Cash and Cash Equivalents')).toBeInTheDocument()
      expect(screen.getByText('Revenue')).toBeInTheDocument()
    })
  })

  it('renders CoA account detail rows', async () => {
    mockGetAccountRollups.mockResolvedValue(makeResponse())
    render(
      <AccountRollupsPanel
        graphId="kg_test"
        mappingId="struct_map_01"
        viewMode="rendered"
      />
    )
    await waitFor(() => {
      expect(screen.getByText('BofA Checking')).toBeInTheDocument()
      expect(screen.getByText('Savings Account')).toBeInTheDocument()
      expect(screen.getByText('Sales Revenue')).toBeInTheDocument()
    })
  })

  it('renders account codes', async () => {
    mockGetAccountRollups.mockResolvedValue(makeResponse())
    render(
      <AccountRollupsPanel
        graphId="kg_test"
        mappingId="struct_map_01"
        viewMode="rendered"
      />
    )
    await waitFor(() => {
      expect(screen.getByText('1010')).toBeInTheDocument()
      expect(screen.getByText('1020')).toBeInTheDocument()
      expect(screen.getByText('4000')).toBeInTheDocument()
    })
  })

  it('renders group totals formatted as currency', async () => {
    mockGetAccountRollups.mockResolvedValue(makeResponse())
    render(
      <AccountRollupsPanel
        graphId="kg_test"
        mappingId="struct_map_01"
        viewMode="rendered"
      />
    )
    await waitFor(() => {
      expect(screen.getByText('15,250.00')).toBeInTheDocument()
      // 8,000.00 appears twice — group total and account balance (same value)
      expect(screen.getAllByText('8,000.00')).toHaveLength(2)
    })
  })

  it('renders individual account balances', async () => {
    mockGetAccountRollups.mockResolvedValue(makeResponse())
    render(
      <AccountRollupsPanel
        graphId="kg_test"
        mappingId="struct_map_01"
        viewMode="rendered"
      />
    )
    await waitFor(() => {
      expect(screen.getByText('10,000.00')).toBeInTheDocument()
      expect(screen.getByText('5,250.00')).toBeInTheDocument()
    })
  })

  it('renders classification badges', async () => {
    mockGetAccountRollups.mockResolvedValue(makeResponse())
    render(
      <AccountRollupsPanel
        graphId="kg_test"
        mappingId="struct_map_01"
        viewMode="rendered"
      />
    )
    await waitFor(() => {
      expect(screen.getByText('asset')).toBeInTheDocument()
      expect(screen.getByText('revenue')).toBeInTheDocument()
    })
  })

  it('renders mapping summary with mapped and unmapped counts', async () => {
    mockGetAccountRollups.mockResolvedValue(makeResponse())
    render(
      <AccountRollupsPanel
        graphId="kg_test"
        mappingId="struct_map_01"
        viewMode="rendered"
      />
    )
    await waitFor(() => {
      expect(screen.getByText(/GAAP Mapping/)).toBeInTheDocument()
      expect(screen.getByText(/3 mapped/)).toBeInTheDocument()
      expect(screen.getByText(/2 unmapped/)).toBeInTheDocument()
    })
  })

  it('shows empty state when no groups', async () => {
    mockGetAccountRollups.mockResolvedValue(
      makeResponse({ groups: [], total_mapped: 0, total_unmapped: 0 })
    )
    render(
      <AccountRollupsPanel
        graphId="kg_test"
        mappingId="struct_map_01"
        viewMode="rendered"
      />
    )
    await waitFor(() => {
      expect(
        screen.getByText('No account rollups available.')
      ).toBeInTheDocument()
    })
  })

  it('shows error state on API failure', async () => {
    mockGetAccountRollups.mockRejectedValue(new Error('Network error'))
    render(
      <AccountRollupsPanel
        graphId="kg_test"
        mappingId="struct_map_01"
        viewMode="rendered"
      />
    )
    await waitFor(() => {
      expect(
        screen.getByText('Failed to load account rollups.')
      ).toBeInTheDocument()
    })
  })

  it('renders FactsTable in facts view mode', async () => {
    mockGetAccountRollups.mockResolvedValue(makeResponse())
    render(
      <AccountRollupsPanel
        graphId="kg_test"
        mappingId="struct_map_01"
        viewMode="facts"
      />
    )
    await waitFor(() => {
      const factsTable = screen.getByTestId('facts-table')
      expect(factsTable).toBeInTheDocument()
      // Flattened: 3 accounts across 2 groups
      expect(screen.getByText('BofA Checking')).toBeInTheDocument()
      expect(screen.getByText('Savings Account')).toBeInTheDocument()
      expect(screen.getByText('Sales Revenue')).toBeInTheDocument()
    })
  })

  it('calls getAccountRollups with correct params', async () => {
    mockGetAccountRollups.mockResolvedValue(
      makeResponse({ groups: [], total_mapped: 0, total_unmapped: 0 })
    )
    render(
      <AccountRollupsPanel
        graphId="kg_mygraph"
        mappingId="struct_map_99"
        viewMode="rendered"
      />
    )
    await waitFor(() => {
      expect(mockGetAccountRollups).toHaveBeenCalledWith('kg_mygraph', {
        mappingId: 'struct_map_99',
      })
    })
  })

  it('formats negative balances with parentheses', async () => {
    mockGetAccountRollups.mockResolvedValue(
      makeResponse({
        groups: [
          {
            reporting_element_id: 'elem_loss',
            reporting_name: 'Net Loss',
            reporting_qname: 'us-gaap:NetLoss',
            classification: 'expense',
            balance_type: 'debit',
            total: -500.0,
            accounts: [
              {
                element_id: 'coa_loss',
                account_name: 'Operating Loss',
                account_code: '9000',
                total_debits: 0,
                total_credits: 500.0,
                net_balance: -500.0,
              },
            ],
          },
        ],
      })
    )
    render(
      <AccountRollupsPanel
        graphId="kg_test"
        mappingId="struct_map_01"
        viewMode="rendered"
      />
    )
    await waitFor(() => {
      const cells = screen.getAllByText('(500.00)')
      expect(cells.length).toBeGreaterThanOrEqual(1)
    })
  })
})
