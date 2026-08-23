import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListInformationBlocks = vi.fn()
const mockGetInformationBlock = vi.fn()
const mockGetEntity = vi.fn()
const mockUseGraphContext = vi.fn()
const mockReplace = vi.fn()

let searchParams = new URLSearchParams()

vi.mock('@robosystems/core', () => ({
  customTheme: { card: {} },
  clients: {
    ledger: {
      listInformationBlocks: (...args: any[]) =>
        mockListInformationBlocks(...args),
      getInformationBlock: (...args: any[]) => mockGetInformationBlock(...args),
      getEntity: (...args: any[]) => mockGetEntity(...args),
    },
  },
  GraphFilters: {
    roboledger: (graph: any) =>
      graph.graphType === 'entity' &&
      graph.schemaExtensions?.includes('roboledger'),
  },
  PageLayout: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useGraphContext: () => mockUseGraphContext(),
  PageHeader: ({ title, actions }: any) => (
    <div data-testid="page-header">
      {title}
      {actions}
    </div>
  ),
  LoadingState: () => (
    <div data-testid="loading-state" role="status">
      Loading
    </div>
  ),
  EmptyState: ({ title, action }: any) => (
    <div data-testid="empty-state">
      {title}
      {action}
    </div>
  ),
}))

// Stable router identity — the content effect lists `router` in its
// deps (it heals stale ?scenario= URLs), and a fresh object per render
// would loop the effect forever. The real Next router is stable.
const mockRouter = { replace: mockReplace }

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => searchParams,
}))

vi.mock('next/link', () => ({
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}))

vi.mock('flowbite-react', () => ({
  Button: ({ children, onClick, disabled, ...rest }: any) => (
    <button onClick={onClick} disabled={disabled} {...rest}>
      {children}
    </button>
  ),
  Card: ({ children }: any) => <div>{children}</div>,
  Select: ({ children, onChange, value }: any) => (
    <select onChange={onChange} value={value} data-testid="scenario-select">
      {children}
    </select>
  ),
}))

vi.mock('react-icons/hi', () => ({
  HiTable: () => <span />,
  HiDownload: () => <span data-testid="icon-download" />,
  HiExclamationCircle: () => <span data-testid="icon-error" />,
  HiLockClosed: () => <span data-testid="icon-lock" />,
  HiRefresh: () => <span data-testid="icon-refresh" />,
}))

// Only the download side is stubbed — the serializers themselves run,
// so these tests assert the bytes the page hands the browser.
const mockDownloadCsv = vi.fn()
const mockDownloadJson = vi.fn()

vi.mock('../../explorer/components/serialize', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  downloadCsv: (...args: any[]) => mockDownloadCsv(...args),
  downloadJson: (...args: any[]) => mockDownloadJson(...args),
}))

// Stand-in for the Flowbite Dropdown (covered by ExportMenu's own
// test): one flat button per format, keyed by the format id the page
// hands back, so clicks assert the export wiring.
vi.mock('@/components/ExportMenu', () => ({
  default: ({ groups, onSelect, disabled }: any) => (
    <div data-testid="export-menu">
      {groups.map((group: any) =>
        group.items.map((item: any) => (
          <button
            key={item.key}
            data-testid={`export-${item.key}`}
            disabled={disabled}
            onClick={() => onSelect(item.key)}
          >
            {group.header}: {item.label}
          </button>
        ))
      )}
    </div>
  ),
}))

import PlanContent from '../content'

const GRAPH = {
  graphId: 'kg1',
  graphType: 'entity',
  schemaExtensions: ['roboledger'],
}

const BLOCKS = [
  {
    id: 'struct_is',
    blockType: 'income_statement',
    displayName: 'Income Statement',
    name: 'Income Statement',
    facts: [{ id: 'f_is' }],
  },
  {
    id: 'struct_bs',
    blockType: 'balance_sheet',
    displayName: 'Balance Sheet',
    name: 'Balance Sheet',
    facts: [{ id: 'f_bs' }],
  },
  {
    id: 'struct_cf',
    blockType: 'cash_flow_statement',
    displayName: 'Cash Flow Statement',
    name: 'Cash Flow Statement',
    facts: [{ id: 'f_cf' }],
  },
  {
    id: 'struct_budget',
    blockType: 'forecast',
    // The real list shape: displayName is the block-TYPE label, name is
    // the instance identity — the picker must show the latter.
    displayName: 'Forecast',
    name: 'FY27 Operating Budget',
    facts: [{ id: 'f_lever' }],
  },
]

const envelopeFor = (id: string) => ({
  id,
  view: {
    rendering: {
      periods: [
        { start: '2026-05-01', end: '2026-05-31', label: null, forecast: null },
        {
          start: '2026-06-01',
          end: '2026-06-30',
          label: 'Jun 2026 (forecast)',
          forecast: true,
        },
      ],
      rows: [
        {
          elementId: `${id}_row`,
          elementQname: null,
          elementName: `${id} row`,
          classification: null,
          balanceType: null,
          itemType: null,
          values: [1, 2],
          textValue: null,
          isSubtotal: false,
          depth: 0,
        },
      ],
      validation: null,
      unmappedCount: 0,
    },
    chart: null,
  },
})

// 14 monthly actuals — more history than the default 12-month window
// keeps, so the export menu splits into current-view vs. full-range.
const wideEnvelopeFor = (id: string) => {
  const periods = Array.from({ length: 14 }, (_, i) => {
    const year = 2025 + Math.floor(i / 12)
    const month = String((i % 12) + 1).padStart(2, '0')
    return {
      start: `${year}-${month}-01`,
      end: `${year}-${month}-28`,
      label: null,
      forecast: null,
    }
  })
  const envelope = envelopeFor(id)
  envelope.view.rendering.periods = periods as any
  envelope.view.rendering.rows[0].values = periods.map((_, i) => i + 1)
  return envelope
}

describe('PlanContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    searchParams = new URLSearchParams()
    mockUseGraphContext.mockReturnValue({
      state: { graphs: [GRAPH], currentGraphId: 'kg1', isLoading: false },
    })
    mockListInformationBlocks.mockResolvedValue(BLOCKS)
    mockGetEntity.mockResolvedValue({ name: 'Driftline Coffee' })
    mockGetInformationBlock.mockImplementation(async (_g: string, id: string) =>
      envelopeFor(id)
    )
  })

  it('labels the scenario picker with the instance name, not the type label', async () => {
    render(<PlanContent />)
    const select = await screen.findByTestId('scenario-select')
    expect(select).toHaveTextContent('FY27 Operating Budget')
    expect(select).not.toHaveTextContent(/^Forecast$/)
  })

  it('defaults to the first forecast scenario and loads every section in series mode', async () => {
    render(<PlanContent />)

    // The scenario's own envelope = the assumptions grid (no series),
    // windowed like the statements so its month axis lands in register
    // with the windowed statement columns (robosystems#944).
    await waitFor(() =>
      expect(mockGetInformationBlock).toHaveBeenCalledWith(
        'kg1',
        'struct_budget',
        { seriesHistory: 12 }
      )
    )
    // Every statement family reads in series mode with the scenario,
    // windowed server-side to the default 12-month history (forecast
    // defaults to 'all' — no seriesForecast sent).
    for (const id of ['struct_is', 'struct_bs', 'struct_cf']) {
      expect(mockGetInformationBlock).toHaveBeenCalledWith('kg1', id, {
        scenarioId: 'struct_budget',
        series: true,
        seriesHistory: 12,
      })
    }
    expect(await screen.findByTestId('plan-grid')).toBeInTheDocument()
    expect(screen.getByTestId('plan-section-Assumptions')).toBeInTheDocument()
    expect(
      screen.getByTestId('plan-section-Income Statement')
    ).toBeInTheDocument()
  })

  it('?scenario=actuals reads statements without a scenario or assumptions', async () => {
    searchParams = new URLSearchParams('scenario=actuals')
    render(<PlanContent />)

    await waitFor(() =>
      expect(mockGetInformationBlock).toHaveBeenCalledWith('kg1', 'struct_is', {
        series: true,
        seriesHistory: 12,
      })
    )
    expect(mockGetInformationBlock).not.toHaveBeenCalledWith(
      'kg1',
      'struct_budget'
    )
    await screen.findByTestId('plan-grid')
    expect(
      screen.queryByTestId('plan-section-Assumptions')
    ).not.toBeInTheDocument()
  })

  it('falls back to the default scenario when the URL id is stale', async () => {
    searchParams = new URLSearchParams('scenario=struct_deleted')
    render(<PlanContent />)

    // The stale id never reaches an envelope read; the default scenario
    // loads instead and the URL heals.
    await waitFor(() =>
      expect(mockGetInformationBlock).toHaveBeenCalledWith(
        'kg1',
        'struct_budget',
        { seriesHistory: 12 }
      )
    )
    expect(mockReplace).toHaveBeenCalledWith('/plan?scenario=struct_budget', {
      scroll: false,
    })
    expect(mockGetInformationBlock).not.toHaveBeenCalledWith(
      'kg1',
      'struct_deleted'
    )
  })

  it('shows the close-first call-to-action when no statement blocks exist', async () => {
    mockListInformationBlocks.mockResolvedValue([
      BLOCKS[3], // the forecast block only — no statement family
    ])
    render(<PlanContent />)

    expect(await screen.findByText('No Closed Months Yet')).toBeInTheDocument()
    const link = screen.getByText('Go to Closing Book').closest('a')
    expect(link).toHaveAttribute('href', '/ledger/close')
  })

  it('renders an actuals-only hint when the graph has no forecast scenario', async () => {
    mockListInformationBlocks.mockResolvedValue(BLOCKS.slice(0, 3))
    render(<PlanContent />)

    expect(await screen.findByTestId('plan-grid')).toBeInTheDocument()
    expect(screen.getByText(/No forecast scenario yet/)).toBeInTheDocument()
    // No scenario to bind — statements read actuals series only (the
    // default 12-month history window still applies).
    expect(mockGetInformationBlock).toHaveBeenCalledWith('kg1', 'struct_is', {
      series: true,
      seriesHistory: 12,
    })
  })

  it('keeps the grid mounted while a scenario switch loads', async () => {
    render(<PlanContent />)
    await screen.findByTestId('plan-grid')

    // The next envelope batch hangs — the grid must stay mounted (the
    // overlay spinner replaces the old full-page blank).
    mockGetInformationBlock.mockImplementation(() => new Promise(() => {}))
    fireEvent.change(screen.getByTestId('scenario-select'), {
      target: { value: '' },
    })

    expect(screen.getByTestId('plan-grid')).toBeInTheDocument()
  })

  it('exports the visible grid as CSV under an entity-slugged filename', async () => {
    render(<PlanContent />)
    await screen.findByTestId('plan-grid')
    fireEvent.click(screen.getByTestId('export-csv:view'))

    expect(mockDownloadCsv).toHaveBeenCalledTimes(1)
    const [csv, filename] = mockDownloadCsv.mock.calls[0]
    expect(filename).toBe('operating-plan-driftline-coffee.csv')
    expect(csv.split('\n')[0]).toContain('Line Item')
  })

  it('tags the JSON export with the selected scenario', async () => {
    render(<PlanContent />)
    await screen.findByTestId('plan-grid')
    fireEvent.click(screen.getByTestId('export-json:view'))

    const [json, filename] = mockDownloadJson.mock.calls[0]
    expect(filename).toBe('operating-plan-driftline-coffee.json')
    const parsed = JSON.parse(json)
    expect(parsed.entity).toBe('Driftline Coffee')
    expect(parsed.scenario).toBe('FY27 Operating Budget')
    // The seam is what JSON exists to carry.
    expect(
      parsed.columns.map((c: { forecast: boolean }) => c.forecast)
    ).toEqual([false, true])
  })

  it('offers a full-range export only when the window hides columns', async () => {
    // 14 actual months against the default 12-month history window.
    mockGetInformationBlock.mockImplementation(async (_g: string, id: string) =>
      wideEnvelopeFor(id)
    )
    render(<PlanContent />)
    await screen.findByTestId('plan-grid')

    fireEvent.click(screen.getByTestId('export-csv:view'))
    fireEvent.click(screen.getByTestId('export-csv:full'))

    const [viewCsv, viewName] = mockDownloadCsv.mock.calls[0]
    const [fullCsv, fullName] = mockDownloadCsv.mock.calls[1]
    expect(viewName).toBe('operating-plan-driftline-coffee.csv')
    expect(fullName).toBe('operating-plan-driftline-coffee-full.csv')
    // Label column + windowed months vs. label column + every month.
    expect(viewCsv.split('\n')[0].split(',')).toHaveLength(13)
    expect(fullCsv.split('\n')[0].split(',')).toHaveLength(15)
  })

  it('refetches with the selected server window when a window changes', async () => {
    // 14 actual months so the window control renders at all.
    mockGetInformationBlock.mockImplementation(async (_g: string, id: string) =>
      wideEnvelopeFor(id)
    )
    render(<PlanContent />)
    await screen.findByTestId('plan-grid')
    mockGetInformationBlock.mockClear()

    fireEvent.click(
      within(screen.getByTestId('plan-window-history')).getByText('3M')
    )

    // The statement reads carry the narrowed history window server-side;
    // forecast stays 'all' → no seriesForecast argument.
    await waitFor(() =>
      expect(mockGetInformationBlock).toHaveBeenCalledWith('kg1', 'struct_is', {
        scenarioId: 'struct_budget',
        series: true,
        seriesHistory: 3,
      })
    )
  })

  it('full-range export refetches unwindowed when the model is server-trimmed', async () => {
    // The mock honors the window like a #935 backend: the returned
    // series is exactly the requested history depth, so the composed
    // model equals the view and a full export MUST refetch.
    mockGetInformationBlock.mockImplementation(
      async (_g: string, id: string, options?: { seriesHistory?: number }) => {
        if (options?.seriesHistory === undefined) return wideEnvelopeFor(id)
        const envelope = wideEnvelopeFor(id)
        const rendering = envelope.view.rendering
        rendering.periods = rendering.periods.slice(-options.seriesHistory)
        rendering.rows[0].values = rendering.rows[0].values.slice(
          -options.seriesHistory
        )
        return envelope
      }
    )
    render(<PlanContent />)
    await screen.findByTestId('plan-grid')

    fireEvent.click(screen.getByTestId('export-csv:full'))
    await waitFor(() => expect(mockDownloadCsv).toHaveBeenCalled())

    // Label column + all 14 months — the unwindowed refetch, not the
    // 12 the grid holds.
    const [fullCsv] = mockDownloadCsv.mock.calls[0]
    expect(fullCsv.split('\n')[0].split(',')).toHaveLength(15)
  })

  it('collapses to a single export group when nothing is windowed', async () => {
    render(<PlanContent />)
    await screen.findByTestId('plan-grid')
    expect(screen.getByTestId('export-csv:view')).toBeInTheDocument()
    expect(screen.queryByTestId('export-csv:full')).not.toBeInTheDocument()
  })

  it('shows the empty state when no qualifying graph exists', () => {
    mockUseGraphContext.mockReturnValue({
      state: { graphs: [], currentGraphId: null, isLoading: false },
    })
    render(<PlanContent />)
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    expect(mockListInformationBlocks).not.toHaveBeenCalled()
  })

  it('refreshes the block list and envelopes without changing scenario or window', async () => {
    render(<PlanContent />)
    await screen.findByTestId('plan-grid')
    expect(screen.getByTestId('fetched-at')).toHaveTextContent(
      'Fetched just now'
    )

    const listCalls = mockListInformationBlocks.mock.calls.length
    mockGetInformationBlock.mockClear()

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))

    await waitFor(() =>
      expect(mockListInformationBlocks.mock.calls.length).toBeGreaterThan(
        listCalls
      )
    )
    await waitFor(() =>
      expect(mockGetInformationBlock).toHaveBeenCalledWith(
        'kg1',
        'struct_budget',
        { seriesHistory: 12 }
      )
    )
    for (const id of ['struct_is', 'struct_bs', 'struct_cf']) {
      expect(mockGetInformationBlock).toHaveBeenCalledWith('kg1', id, {
        scenarioId: 'struct_budget',
        series: true,
        seriesHistory: 12,
      })
    }
    expect(screen.getByTestId('plan-grid')).toBeInTheDocument()
  })

  it('keeps the grid mounted while a refresh loads', async () => {
    render(<PlanContent />)
    await screen.findByTestId('plan-grid')

    mockListInformationBlocks.mockImplementation(() => new Promise(() => {}))
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))

    expect(screen.getByTestId('plan-grid')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeDisabled()
  })

  it('surfaces a list-load failure', async () => {
    mockListInformationBlocks.mockRejectedValue(new Error('boom'))
    render(<PlanContent />)
    expect(
      await screen.findByText('Failed to load information blocks.')
    ).toBeInTheDocument()
  })
})
