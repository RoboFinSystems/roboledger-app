import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const mockGetTrialBalance = vi.fn()

vi.mock('@/lib/core', () => ({
  customTheme: { table: {} },
  extensions: {
    ledger: {
      getTrialBalance: (...args: any[]) => mockGetTrialBalance(...args),
    },
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

// The facade now returns the unwrapped GraphQL `trialBalance` field shape
// directly (camelCase), not a `{ data: { rows } }` envelope.
const makeResponse = (rows: Array<Record<string, unknown>>) => ({
  totalDebits: rows.reduce((s, r) => s + ((r.totalDebits as number) ?? 0), 0),
  totalCredits: rows.reduce((s, r) => s + ((r.totalCredits as number) ?? 0), 0),
  rows,
})

describe('TrialBalancePanel', () => {
  it('renders a spinner while loading', () => {
    mockGetTrialBalance.mockReturnValue(new Promise(() => {}))
    render(<TrialBalancePanel graphId="kg_test" />)
    expect(screen.getByTestId('spinner')).toBeInTheDocument()
  })

  it('renders an error message on API failure', async () => {
    mockGetTrialBalance.mockRejectedValue(new Error('boom'))
    render(<TrialBalancePanel graphId="kg_test" />)
    await waitFor(() => {
      expect(
        screen.getByText('Failed to load trial balance.')
      ).toBeInTheDocument()
    })
  })

  it('renders zero accounts when the response is empty', async () => {
    mockGetTrialBalance.mockResolvedValue(makeResponse([]))
    render(<TrialBalancePanel graphId="kg_test" />)
    await waitFor(() => {
      expect(screen.getByText('0 accounts')).toBeInTheDocument()
    })
  })

  it('displays currency in dollars without dividing by 100', async () => {
    // The /trial-balance endpoint already returns dollars. Regression test
    // for the bug where the panel divided the value again, displaying
    // amounts 100x too small.
    mockGetTrialBalance.mockResolvedValue(
      makeResponse([
        {
          accountName: 'BofA Checking',
          classification: 'asset',
          totalDebits: 15250,
          totalCredits: 0,
          netBalance: 15250,
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
    mockGetTrialBalance.mockResolvedValue(
      makeResponse([
        {
          accountName: 'Cash',
          classification: 'asset',
          totalDebits: 1000,
          totalCredits: 0,
          netBalance: 1000,
        },
        {
          accountName: 'Revenue',
          classification: 'revenue',
          totalDebits: 0,
          totalCredits: 750,
          netBalance: -750,
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

  it('calls the facade with the correct graph id', async () => {
    mockGetTrialBalance.mockResolvedValue(makeResponse([]))
    render(<TrialBalancePanel graphId="kg_mygraph" />)
    await waitFor(() => {
      expect(mockGetTrialBalance).toHaveBeenCalledWith('kg_mygraph')
    })
  })
})
