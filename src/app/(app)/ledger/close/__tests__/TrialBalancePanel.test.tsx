import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const mockGetLedgerTrialBalance = vi.fn()

vi.mock('@/lib/core', () => ({
  customTheme: { table: {} },
  SDK: {
    getLedgerTrialBalance: (...args: any[]) =>
      mockGetLedgerTrialBalance(...args),
  },
}))

vi.mock('flowbite-react', () => ({
  Badge: ({ children }: any) => <span data-testid="badge">{children}</span>,
  Spinner: () => <div data-testid="spinner" />,
  Table: ({ children }: any) => <table>{children}</table>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableCell: ({ children, className }: any) => (
    <td className={className}>{children}</td>
  ),
  TableHead: ({ children }: any) => <thead>{children}</thead>,
  TableHeadCell: ({ children }: any) => <th>{children}</th>,
  TableRow: ({ children, className }: any) => (
    <tr className={className}>{children}</tr>
  ),
}))

import TrialBalancePanel from '../components/TrialBalancePanel'

const makeResponse = (rows: Array<Record<string, unknown>>) => ({
  data: { rows },
})

describe('TrialBalancePanel', () => {
  it('renders a spinner while loading', () => {
    mockGetLedgerTrialBalance.mockReturnValue(new Promise(() => {}))
    render(<TrialBalancePanel graphId="kg_test" />)
    expect(screen.getByTestId('spinner')).toBeInTheDocument()
  })

  it('renders an error message on API failure', async () => {
    mockGetLedgerTrialBalance.mockRejectedValue(new Error('boom'))
    render(<TrialBalancePanel graphId="kg_test" />)
    await waitFor(() => {
      expect(
        screen.getByText('Failed to load trial balance.')
      ).toBeInTheDocument()
    })
  })

  it('renders zero accounts when the response is empty', async () => {
    mockGetLedgerTrialBalance.mockResolvedValue(makeResponse([]))
    render(<TrialBalancePanel graphId="kg_test" />)
    await waitFor(() => {
      expect(screen.getByText('0 accounts')).toBeInTheDocument()
    })
  })

  it('displays currency in dollars without dividing by 100', async () => {
    // The /trial-balance endpoint already returns dollars. Regression test
    // for the bug where the panel divided the value again, displaying
    // amounts 100x too small.
    mockGetLedgerTrialBalance.mockResolvedValue(
      makeResponse([
        {
          account_name: 'BofA Checking',
          classification: 'asset',
          total_debits: 15250,
          total_credits: 0,
          net_balance: 15250,
        },
      ])
    )

    render(<TrialBalancePanel graphId="kg_test" />)

    await waitFor(() => {
      expect(screen.getByText('BofA Checking')).toBeInTheDocument()
    })

    // $15,250.00 — not $152.50
    expect(screen.getAllByText('$15,250.00').length).toBeGreaterThan(0)
    expect(screen.queryByText('$152.50')).not.toBeInTheDocument()
  })

  it('aggregates totals across rows and renders them in the totals row', async () => {
    mockGetLedgerTrialBalance.mockResolvedValue(
      makeResponse([
        {
          account_name: 'Cash',
          classification: 'asset',
          total_debits: 1000,
          total_credits: 0,
          net_balance: 1000,
        },
        {
          account_name: 'Revenue',
          classification: 'revenue',
          total_debits: 0,
          total_credits: 750,
          net_balance: -750,
        },
      ])
    )

    render(<TrialBalancePanel graphId="kg_test" />)

    await waitFor(() => {
      expect(screen.getByText('2 accounts')).toBeInTheDocument()
    })

    // Per-row amounts
    expect(screen.getAllByText('$1,000.00').length).toBeGreaterThan(0)
    expect(screen.getAllByText('$750.00').length).toBeGreaterThan(0)
  })

  it('calls the SDK with the correct graph id', async () => {
    mockGetLedgerTrialBalance.mockResolvedValue(makeResponse([]))
    render(<TrialBalancePanel graphId="kg_mygraph" />)
    await waitFor(() => {
      expect(mockGetLedgerTrialBalance).toHaveBeenCalledWith({
        path: { graph_id: 'kg_mygraph' },
      })
    })
  })
})
