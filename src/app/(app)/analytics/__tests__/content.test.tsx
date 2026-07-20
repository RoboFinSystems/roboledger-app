import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListInformationBlocks = vi.fn()
const mockGetInformationBlock = vi.fn()
const mockGetEntity = vi.fn()
const mockUseGraphContext = vi.fn()
const mockReplace = vi.fn()

// Mutable per-test URL params — content seeds selection/view from these.
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
  EmptyState: ({ title, description }: any) => (
    <div data-testid="empty-state">
      <h3>{title}</h3>
      {description}
    </div>
  ),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => searchParams,
}))

vi.mock('flowbite-react', () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Card: ({ children }: any) => <div>{children}</div>,
}))

vi.mock('react-icons/hi', () => ({
  HiChartBar: () => <span />,
  HiDownload: () => <span data-testid="icon-download" />,
  HiExclamationCircle: () => <span data-testid="icon-error" />,
}))

vi.mock('../../ledger/close/components/blockview/BlockView', () => ({
  default: ({ envelope, viewMode }: any) => (
    <div data-testid="block-view">
      {envelope.id}:{viewMode}
    </div>
  ),
}))

vi.mock('../../ledger/close/components/ViewModeToggle', () => ({
  default: ({ viewMode, onChange }: any) => (
    <button data-testid="view-toggle" onClick={() => onChange('facts')}>
      {viewMode}
    </button>
  ),
}))

vi.mock('../components/BlockPicker', () => ({
  default: ({ blocks, selectedId, onSelect }: any) => (
    <div data-testid="block-picker">
      {blocks.map((b: any) => (
        <button
          key={b.id}
          data-testid={`pick-${b.id}`}
          onClick={() => onSelect(b)}
        >
          {b.displayName}
        </button>
      ))}
      <div data-testid="picker-selected">{selectedId}</div>
    </div>
  ),
}))

vi.mock('../components/ComputePanel', () => ({
  default: ({ structureId }: any) => (
    <div data-testid="compute-panel">{structureId}</div>
  ),
}))

import AnalyticsContent from '../content'

const GRAPH = {
  graphId: 'kg1',
  graphType: 'entity',
  schemaExtensions: ['roboledger'],
}

// Balance sheet first so the metric-first default preference is what the
// test asserts, not list order.
const BLOCKS = [
  { id: 'struct_bs', blockType: 'balance_sheet', displayName: 'Balance Sheet' },
  {
    id: 'struct_metrics',
    blockType: 'metric',
    displayName: 'Key Financial Metrics',
  },
]

const metricEnvelope = {
  id: 'struct_metrics',
  blockType: 'metric',
  name: 'Key Financial Metrics',
  displayName: 'Key Financial Metrics',
  view: { rendering: { rows: [{ elementId: 'e1' }], periods: [] } },
}

const statementEnvelope = {
  id: 'struct_bs',
  blockType: 'balance_sheet',
  name: 'Balance Sheet',
  displayName: 'Balance Sheet',
  view: { rendering: { rows: [{ elementId: 'e1' }], periods: [] } },
}

describe('AnalyticsContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    searchParams = new URLSearchParams()
    mockUseGraphContext.mockReturnValue({
      state: { graphs: [GRAPH], currentGraphId: 'kg1', isLoading: false },
    })
    mockListInformationBlocks.mockResolvedValue(BLOCKS)
    mockGetEntity.mockResolvedValue({ name: 'Driftline Coffee' })
    mockGetInformationBlock.mockImplementation(
      async (_g: string, id: string) =>
        id === 'struct_metrics' ? metricEnvelope : statementEnvelope
    )
  })

  it('defaults selection to the first metric block and renders its envelope', async () => {
    render(<AnalyticsContent />)
    await waitFor(() =>
      expect(mockGetInformationBlock).toHaveBeenCalledWith(
        'kg1',
        'struct_metrics'
      )
    )
    expect(
      await screen.findByText('struct_metrics:rendered')
    ).toBeInTheDocument()
  })

  it('preselects the block from the ?block= URL param over the metric default', async () => {
    searchParams = new URLSearchParams('block=struct_bs')
    render(<AnalyticsContent />)
    await waitFor(() =>
      expect(mockGetInformationBlock).toHaveBeenCalledWith('kg1', 'struct_bs')
    )
    expect(mockGetInformationBlock).not.toHaveBeenCalledWith(
      'kg1',
      'struct_metrics'
    )
  })

  it('shows the compute panel for metric blocks only', async () => {
    render(<AnalyticsContent />)
    expect(await screen.findByTestId('compute-panel')).toHaveTextContent(
      'struct_metrics'
    )

    fireEvent.click(screen.getByTestId('pick-struct_bs'))
    await waitFor(() =>
      expect(screen.getByTestId('block-view')).toHaveTextContent(
        'struct_bs:rendered'
      )
    )
    expect(screen.queryByTestId('compute-panel')).not.toBeInTheDocument()
  })

  it('encodes selection into the URL on picker click', async () => {
    render(<AnalyticsContent />)
    await screen.findByTestId('block-view')

    fireEvent.click(screen.getByTestId('pick-struct_bs'))
    expect(mockReplace).toHaveBeenCalledWith('/analytics?block=struct_bs', {
      scroll: false,
    })
  })

  it('encodes a non-default view mode into the URL', async () => {
    render(<AnalyticsContent />)
    await screen.findByTestId('block-view')

    fireEvent.click(screen.getByTestId('view-toggle'))
    await waitFor(() =>
      expect(screen.getByTestId('block-view')).toHaveTextContent(
        'struct_metrics:facts'
      )
    )
    expect(mockReplace).toHaveBeenCalledWith(
      '/analytics?block=struct_metrics&view=facts',
      { scroll: false }
    )
  })

  it('surfaces a list-load failure', async () => {
    mockListInformationBlocks.mockRejectedValue(new Error('boom'))
    render(<AnalyticsContent />)
    expect(
      await screen.findByText('Failed to load information blocks.')
    ).toBeInTheDocument()
  })

  it('shows the empty state when no qualifying graph exists', () => {
    mockUseGraphContext.mockReturnValue({
      state: { graphs: [], currentGraphId: null, isLoading: false },
    })
    render(<AnalyticsContent />)
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    expect(mockListInformationBlocks).not.toHaveBeenCalled()
  })
})
