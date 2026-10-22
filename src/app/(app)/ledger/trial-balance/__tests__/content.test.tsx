import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListMappings = vi.fn()
const mockGetTrialBalance = vi.fn()
const mockGetMappedTrialBalance = vi.fn()
const mockGetDimensions = vi.fn()
const mockUseGraphContext = vi.fn()

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      listMappings: (...args: any[]) => mockListMappings(...args),
      getTrialBalance: (...args: any[]) => mockGetTrialBalance(...args),
      getMappedTrialBalance: (...args: any[]) =>
        mockGetMappedTrialBalance(...args),
      getDimensions: (...args: any[]) => mockGetDimensions(...args),
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

const mockScope = vi.fn(() => ({
  entityId: null as string | null,
  parent: null as { id: string } | null,
}))
vi.mock('@/lib/entity-scope', () => ({ useEntityScope: () => mockScope() }))

vi.mock('flowbite-react', () => ({
  Alert: ({ children }: any) => <div data-testid="alert">{children}</div>,
  Badge: ({ children }: any) => <span>{children}</span>,
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Card: ({ children }: any) => <div>{children}</div>,
  Label: ({ children, htmlFor }: any) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
  Select: ({ children, sizing: _sizing, ...props }: any) => (
    <select {...props}>{children}</select>
  ),
  Table: ({ children }: any) => <table>{children}</table>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableCell: ({ children }: any) => <td>{children}</td>,
  TableHead: ({ children }: any) => <thead>{children}</thead>,
  TableHeadCell: ({ children }: any) => <th>{children}</th>,
  TableRow: ({ children }: any) => <tr>{children}</tr>,
  TextInput: (props: any) => <input type="text" {...props} />,
}))

vi.mock('react-icons/hi', () => ({
  HiDownload: () => <span />,
  HiChevronDown: () => <span />,
  HiChevronUp: () => <span />,
  HiCheckCircle: () => <span />,
  HiExclamationCircle: () => <span />,
  HiSelector: () => <span />,
  HiScale: () => <span />,
  HiSearch: () => <span />,
}))

vi.mock('react-icons/tb', () => ({
  TbReportMoney: () => <span />,
}))

import TrialBalanceContent, { trialBalanceCsv } from '../content'

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
    mockGetDimensions.mockResolvedValue({ types: [], dimensions: [] })
  })

  it('loads the CoA trial balance for the current graph', async () => {
    render(<TrialBalanceContent />)

    await waitFor(() => {
      // No entity in scope: the group parent is the server's default.
      expect(mockGetTrialBalance).toHaveBeenCalledWith('kg_a', {
        entityId: null,
      })
    })
    expect(await screen.findByText('Cash')).toBeInTheDocument()
  })

  it('names the parent when the parent is in scope', async () => {
    mockScope.mockReturnValue({ entityId: null, parent: { id: 'ent_parent' } })
    render(<TrialBalanceContent />)
    await waitFor(() =>
      expect(mockListMappings).toHaveBeenCalledWith('kg_a', {
        entityId: 'ent_parent',
      })
    )
    mockScope.mockReturnValue({ entityId: null, parent: null })
  })

  it("maps a subsidiary's trial balance with its own mapping", async () => {
    mockScope.mockReturnValue({
      entityId: 'ent_sub',
      parent: { id: 'ent_parent' },
    })
    mockListMappings.mockResolvedValue([{ id: 'map_sub', isActive: true }])
    render(<TrialBalanceContent />)

    await waitFor(() =>
      expect(mockListMappings).toHaveBeenCalledWith('kg_a', {
        entityId: 'ent_sub',
      })
    )
    mockScope.mockReturnValue({ entityId: null, parent: null })
  })

  it('sorts by a column on click and keeps TOTALS pinned last', async () => {
    const account = (code: string, name: string, net: number) => ({
      accountId: `acct_${code}`,
      accountCode: code,
      accountName: name,
      trait: 'asset',
      accountType: 'Bank',
      totalDebits: net,
      totalCredits: 0,
      netBalance: net,
    })
    mockGetTrialBalance.mockResolvedValue({
      rows: [
        account('1000', 'Cash', 100),
        account('1100', 'Savings', 9000),
        account('1200', 'Receivables', 500),
      ],
    })
    render(<TrialBalanceContent />)
    await screen.findByText('Savings')

    const accountOrder = () =>
      screen
        .getAllByRole('row')
        .slice(1) // header
        .map((row) => row.textContent ?? '')
        .map((text) =>
          ['Cash', 'Savings', 'Receivables', 'TOTALS'].find((n) =>
            text.includes(n)
          )
        )

    expect(accountOrder()).toEqual(['Cash', 'Savings', 'Receivables', 'TOTALS'])

    // A balance column opens largest-first.
    fireEvent.click(screen.getByRole('button', { name: 'Net Balance' }))
    expect(accountOrder()).toEqual(['Savings', 'Receivables', 'Cash', 'TOTALS'])

    // …reverses, then returns to the chart-of-accounts order.
    fireEvent.click(screen.getByRole('button', { name: 'Net Balance' }))
    expect(accountOrder()).toEqual(['Cash', 'Receivables', 'Savings', 'TOTALS'])
    fireEvent.click(screen.getByRole('button', { name: 'Net Balance' }))
    expect(accountOrder()).toEqual(['Cash', 'Savings', 'Receivables', 'TOTALS'])
  })

  it('uses this graph‘s mapping for the US-GAAP view', async () => {
    render(<TrialBalanceContent />)

    await waitFor(() => expect(mockGetTrialBalance).toHaveBeenCalled())
    fireEvent.click(screen.getByRole('button', { name: 'US-GAAP' }))

    await waitFor(() => {
      expect(mockGetMappedTrialBalance).toHaveBeenCalledWith('kg_a', 'map_a')
    })
  })

  describe('switching graphs', () => {
    it('never pairs the previous graph‘s mapping id with the new graph', async () => {
      const { rerender } = render(<TrialBalanceContent />)

      await waitFor(() => expect(mockGetTrialBalance).toHaveBeenCalled())
      fireEvent.click(screen.getByRole('button', { name: 'US-GAAP' }))
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
      fireEvent.click(screen.getByRole('button', { name: 'US-GAAP' }))
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

describe('trialBalanceCsv', () => {
  it('writes one row per account, then the totals', () => {
    const row = (
      code: string,
      name: string,
      debits: number,
      credits: number
    ) => ({
      accountId: code,
      accountCode: code,
      accountName: name,
      classification: 'asset' as const,
      accountType: null,
      totalDebits: debits,
      totalCredits: credits,
      netBalance: debits - credits,
      _graphId: 'kg_a',
      _graphName: 'A',
    })
    const csv = trialBalanceCsv(
      [row('1000', 'Cash', 100.5, 0), row('1100', '=Receivables', 0, 40)],
      'coa'
    ).split('\n')

    expect(csv).toEqual([
      'Code,Account,Classification,Debits,Credits,Net balance',
      '1000,Cash,Asset,100.50,0.00,100.50',
      "1100,'=Receivables,Asset,0.00,40.00,-40.00",
      ',Total,,100.50,40.00,60.50',
    ])
  })
})

describe('TrialBalanceContent — one member', () => {
  const department = (id: string, name: string, isActive = true) => ({
    id,
    dimensionType: 'department',
    name,
    value: name.toLowerCase(),
    source: 'native',
    isActive,
    lineCount: 3,
    createdAt: null,
  })

  beforeEach(() => {
    vi.clearAllMocks()
    setGraph('kg_a')
    mockScope.mockReturnValue({ entityId: null, parent: null })
    mockListMappings.mockResolvedValue([{ id: 'map_a', isActive: true }])
    mockGetTrialBalance.mockResolvedValue(coaRows())
    mockGetDimensions.mockResolvedValue({
      types: ['department'],
      dimensions: [
        department('dim_sales', 'Sales'),
        department('dim_ops', 'Operations', false),
      ],
    })
  })

  it('offers no member picker on a graph with no dimensions', async () => {
    mockGetDimensions.mockResolvedValue({ types: [], dimensions: [] })
    render(<TrialBalanceContent />)
    expect(await screen.findByText('Cash')).toBeInTheDocument()
    expect(screen.queryByLabelText('Member')).not.toBeInTheDocument()
  })

  it("sums one member's lines and says it need not foot", async () => {
    mockGetTrialBalance.mockImplementation(
      async (_graphId: string, options: { dimension?: unknown }) => ({
        ...coaRows(),
        totalDebits: 100,
        totalCredits: 0,
        sliced: !!options.dimension,
      })
    )
    render(<TrialBalanceContent />)
    const picker = (await screen.findByLabelText('Member')) as HTMLSelectElement
    expect(mockGetDimensions).toHaveBeenCalledWith('kg_a', {
      includeInactive: true,
    })
    expect(Array.from(picker.options).map((o) => o.textContent)).toEqual([
      'All lines',
      'Sales',
      'Operations (retired)',
      'Unallocated',
    ])

    fireEvent.change(picker, { target: { value: 'department::dim_sales' } })
    await waitFor(() =>
      expect(mockGetTrialBalance).toHaveBeenLastCalledWith('kg_a', {
        entityId: null,
        dimension: { type: 'department', memberId: 'dim_sales' },
      })
    )
    expect(
      await screen.findByText(/this balance need not foot/)
    ).toBeInTheDocument()
    expect(screen.getByText('Department: Sales.')).toBeInTheDocument()
    expect(screen.getByText('Cash').closest('a')?.getAttribute('href')).toBe(
      '/ledger/account-register?accountId=acct_1&dimensionType=department&dimensionMemberId=dim_sales'
    )

    fireEvent.change(picker, { target: { value: 'department::unallocated' } })
    await waitFor(() =>
      expect(mockGetTrialBalance).toHaveBeenLastCalledWith('kg_a', {
        entityId: null,
        dimension: { type: 'department', memberId: 'unallocated' },
      })
    )
    expect(
      await screen.findByText('Department: Unallocated.')
    ).toBeInTheDocument()

    fireEvent.change(picker, { target: { value: '' } })
    await waitFor(() =>
      expect(mockGetTrialBalance).toHaveBeenLastCalledWith('kg_a', {
        entityId: null,
      })
    )
    expect(screen.queryByText(/need not foot/)).not.toBeInTheDocument()
  })

  it('drops the member on a graph switch', async () => {
    const { rerender } = render(<TrialBalanceContent />)
    fireEvent.change(await screen.findByLabelText('Member'), {
      target: { value: 'department::dim_sales' },
    })
    await waitFor(() =>
      expect(mockGetTrialBalance).toHaveBeenLastCalledWith('kg_a', {
        entityId: null,
        dimension: { type: 'department', memberId: 'dim_sales' },
      })
    )
    setGraph('kg_b')
    rerender(<TrialBalanceContent />)
    await waitFor(() =>
      expect(mockGetTrialBalance).toHaveBeenLastCalledWith('kg_b', {
        entityId: null,
      })
    )
    expect(mockGetTrialBalance).not.toHaveBeenCalledWith(
      'kg_b',
      expect.objectContaining({ dimension: expect.anything() })
    )
  })

  it('the US-GAAP view reads every line', async () => {
    render(<TrialBalanceContent />)
    fireEvent.change(await screen.findByLabelText('Member'), {
      target: { value: 'department::dim_sales' },
    })
    await screen.findByText(/need not foot/)
    fireEvent.click(screen.getByText('US-GAAP'))
    await waitFor(() => expect(mockGetMappedTrialBalance).toHaveBeenCalled())
    expect(screen.queryByLabelText('Member')).not.toBeInTheDocument()
    expect(screen.queryByText(/need not foot/)).not.toBeInTheDocument()
  })
})
