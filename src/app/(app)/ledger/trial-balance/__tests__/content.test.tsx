import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListMappings = vi.fn()
const mockGetTrialBalance = vi.fn()
const mockGetMappedTrialBalance = vi.fn()
const mockUseGraphContext = vi.fn()

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      listMappings: (...args: any[]) => mockListMappings(...args),
      getTrialBalance: (...args: any[]) => mockGetTrialBalance(...args),
      getMappedTrialBalance: (...args: any[]) =>
        mockGetMappedTrialBalance(...args),
    },
  },
  GraphFilters: {
    roboledger: (graph: any) =>
      graph.graphType === 'entity' &&
      graph.schemaExtensions?.includes('roboledger'),
  },
  useGraphContext: () => mockUseGraphContext(),
  PageLayout: ({ children }: any) => <div>{children}</div>,
  PageHeader: ({ title }: any) => <div data-testid="page-header">{title}</div>,
  LoadingState: ({ message }: any) => (
    <div data-testid="loading-state" role="status">
      {message ?? 'Loading'}
    </div>
  ),
  EmptyState: ({ title, description }: any) => (
    <div data-testid="empty-state">
      <h3>{title}</h3>
      {description}
    </div>
  ),
}))

vi.mock('flowbite-react', () => ({
  Alert: ({ children }: any) => <div data-testid="alert">{children}</div>,
  Badge: ({ children }: any) => <span>{children}</span>,
  Card: ({ children }: any) => <div>{children}</div>,
  Table: ({ children }: any) => <table>{children}</table>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableCell: ({ children }: any) => <td>{children}</td>,
  TableHead: ({ children }: any) => <thead>{children}</thead>,
  TableHeadCell: ({ children }: any) => <th>{children}</th>,
  TableRow: ({ children }: any) => <tr>{children}</tr>,
  TextInput: (props: any) => <input type="text" {...props} />,
  ToggleSwitch: ({ checked, onChange, label }: any) => (
    <button
      data-testid="view-mode-toggle"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
    >
      {label ?? 'toggle'}
    </button>
  ),
}))

vi.mock('react-icons/hi', () => ({
  HiCheckCircle: () => <span />,
  HiExclamationCircle: () => <span />,
  HiScale: () => <span />,
  HiSearch: () => <span />,
}))

vi.mock('react-icons/tb', () => ({
  TbReportMoney: () => <span />,
}))

import TrialBalanceContent from '../content'

function graph(graphId: string) {
  return {
    graphId,
    graphName: `Graph ${graphId}`,
    graphType: 'entity',
    schemaExtensions: ['roboledger'],
  }
}

function setGraph(graphId: string) {
  mockUseGraphContext.mockReturnValue({
    state: { graphs: [graph('kg_a'), graph('kg_b')], currentGraphId: graphId },
  })
}

function coaRows() {
  return {
    rows: [
      {
        accountId: 'acct_1',
        accountCode: '1000',
        accountName: 'Cash',
        trait: 'asset',
        accountType: 'Bank',
        totalDebits: 100,
        totalCredits: 0,
        netBalance: 100,
      },
    ],
  }
}

function mappedRows(name: string) {
  return {
    rows: [
      {
        reportingElementId: 'el_1',
        qname: `us-gaap:${name}`,
        reportingName: name,
        trait: 'asset',
        totalDebits: 100,
        totalCredits: 0,
        netBalance: 100,
      },
    ],
  }
}

describe('TrialBalanceContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setGraph('kg_a')
    mockListMappings.mockResolvedValue([{ id: 'map_a', isActive: true }])
    mockGetTrialBalance.mockResolvedValue(coaRows())
    mockGetMappedTrialBalance.mockResolvedValue(mappedRows('Cash'))
  })

  it('loads the CoA trial balance for the current graph', async () => {
    render(<TrialBalanceContent />)

    await waitFor(() => {
      expect(mockGetTrialBalance).toHaveBeenCalledWith('kg_a')
    })
    expect(await screen.findByText('Cash')).toBeInTheDocument()
  })

  it('uses this graph‘s mapping for the US-GAAP view', async () => {
    render(<TrialBalanceContent />)

    await waitFor(() => expect(mockGetTrialBalance).toHaveBeenCalled())
    fireEvent.click(screen.getByTestId('view-mode-toggle'))

    await waitFor(() => {
      expect(mockGetMappedTrialBalance).toHaveBeenCalledWith('kg_a', 'map_a')
    })
  })

  describe('switching graphs', () => {
    it('never pairs the previous graph‘s mapping id with the new graph', async () => {
      const { rerender } = render(<TrialBalanceContent />)

      await waitFor(() => expect(mockGetTrialBalance).toHaveBeenCalled())
      fireEvent.click(screen.getByTestId('view-mode-toggle'))
      await waitFor(() => {
        expect(mockGetMappedTrialBalance).toHaveBeenCalledWith('kg_a', 'map_a')
      })

      // Switch to a graph whose own mapping is a different row. Before the fix
      // the trial-balance effect re-ran in the same commit as the mapping
      // loader, still holding map_a, and called (kg_b, map_a).
      mockGetMappedTrialBalance.mockClear()
      mockListMappings.mockResolvedValue([{ id: 'map_b', isActive: true }])
      mockGetMappedTrialBalance.mockResolvedValue(mappedRows('Inventory'))
      setGraph('kg_b')
      rerender(<TrialBalanceContent />)

      await waitFor(() => {
        expect(mockGetMappedTrialBalance).toHaveBeenCalledWith('kg_b', 'map_b')
      })
      expect(mockGetMappedTrialBalance).not.toHaveBeenCalledWith(
        'kg_b',
        'map_a'
      )
    })

    it('does not report "no mapping" while the new graph‘s mapping is resolving', async () => {
      const { rerender } = render(<TrialBalanceContent />)

      await waitFor(() => expect(mockGetTrialBalance).toHaveBeenCalled())
      fireEvent.click(screen.getByTestId('view-mode-toggle'))
      await waitFor(() => expect(mockGetMappedTrialBalance).toHaveBeenCalled())

      // kg_b's mapping resolves slowly. Until it does, the page must issue no
      // mapped read at all — not one carrying kg_a's id — and must not claim
      // the graph has no mapping configured.
      let resolveMappings: (value: any) => void = () => {}
      mockGetMappedTrialBalance.mockClear()
      mockListMappings.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveMappings = resolve
        })
      )
      mockGetMappedTrialBalance.mockResolvedValue(mappedRows('Inventory'))
      setGraph('kg_b')
      rerender(<TrialBalanceContent />)

      await waitFor(() => {
        expect(screen.getByTestId('loading-state')).toBeInTheDocument()
      })
      expect(mockGetMappedTrialBalance).not.toHaveBeenCalled()
      expect(screen.queryByText(/No active CoA/)).not.toBeInTheDocument()

      resolveMappings([{ id: 'map_b', isActive: true }])

      await waitFor(() => {
        expect(mockGetMappedTrialBalance).toHaveBeenCalledWith('kg_b', 'map_b')
      })
    })

    it('drops a CoA response that arrives after the graph moved on', async () => {
      let resolveSlow: (value: any) => void = () => {}
      mockGetTrialBalance.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveSlow = resolve
        })
      )

      const { rerender } = render(<TrialBalanceContent />)

      mockGetTrialBalance.mockResolvedValue({
        rows: [
          {
            accountId: 'acct_2',
            accountCode: '2000',
            accountName: 'Accounts Payable',
            trait: 'liability',
            accountType: 'Accounts Payable',
            totalDebits: 0,
            totalCredits: 50,
            netBalance: -50,
          },
        ],
      })
      setGraph('kg_b')
      rerender(<TrialBalanceContent />)

      await waitFor(() => {
        expect(screen.getByText('Accounts Payable')).toBeInTheDocument()
      })

      // kg_a's read lands late with its own rows — it must not replace kg_b's.
      resolveSlow(coaRows())

      await waitFor(() => {
        expect(screen.getByText('Accounts Payable')).toBeInTheDocument()
      })
      expect(screen.queryByText('Cash')).not.toBeInTheDocument()
    })
  })
})
