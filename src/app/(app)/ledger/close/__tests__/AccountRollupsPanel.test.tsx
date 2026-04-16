import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const mockGetAccountRollups = vi.fn()

vi.mock('@/lib/core', () => ({
  customTheme: { table: {} },
  clients: {
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

import type { LedgerAccountRollups } from '@robosystems/client/clients'
import AccountRollupsPanel from '../components/AccountRollupsPanel'

// Mock data shape mirrors the GraphQL `accountRollups` field (camelCase).
// The panel reads snake_case was replaced by camelCase in PR #617.
const makeResponse = (
  overrides?: Partial<LedgerAccountRollups>
): LedgerAccountRollups =>
  ({
    mappingId: 'struct_map_01',
    mappingName: 'GAAP Mapping',
    groups: [
      {
        reportingElementId: 'elem_cash',
        reportingName: 'Cash and Cash Equivalents',
        reportingQname: 'us-gaap:CashAndCashEquivalents',
        classification: 'asset',
        balanceType: 'debit',
        total: 15250.0,
        accounts: [
          {
            elementId: 'coa_checking',
            accountName: 'BofA Checking',
            accountCode: '1010',
            totalDebits: 100000.0,
            totalCredits: 90000.0,
            netBalance: 10000.0,
          },
          {
            elementId: 'coa_savings',
            accountName: 'Savings Account',
            accountCode: '1020',
            totalDebits: 5250.0,
            totalCredits: 0,
            netBalance: 5250.0,
          },
        ],
      },
      {
        reportingElementId: 'elem_rev',
        reportingName: 'Revenue',
        reportingQname: 'us-gaap:Revenues',
        classification: 'revenue',
        balanceType: 'credit',
        total: 8000.0,
        accounts: [
          {
            elementId: 'coa_sales',
            accountName: 'Sales Revenue',
            accountCode: '4000',
            totalDebits: 0,
            totalCredits: 8000.0,
            netBalance: 8000.0,
          },
        ],
      },
    ],
    totalMapped: 3,
    totalUnmapped: 2,
    ...overrides,
  }) as LedgerAccountRollups

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
      makeResponse({ groups: [], totalMapped: 0, totalUnmapped: 0 })
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
      makeResponse({ groups: [], totalMapped: 0, totalUnmapped: 0 })
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
            reportingElementId: 'elem_loss',
            reportingName: 'Net Loss',
            reportingQname: 'us-gaap:NetLoss',
            classification: 'expense',
            balanceType: 'debit',
            total: -500.0,
            accounts: [
              {
                elementId: 'coa_loss',
                accountName: 'Operating Loss',
                accountCode: '9000',
                totalDebits: 0,
                totalCredits: 500.0,
                netBalance: -500.0,
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
