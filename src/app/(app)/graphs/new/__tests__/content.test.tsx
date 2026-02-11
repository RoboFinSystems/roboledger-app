import { useGraphContext, useUser, useUserLimits } from '@/lib/core'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { NewGraphContent } from '../content'

const mockGraphCreationPage = vi.hoisted(() =>
  vi.fn(
    ({
      onSuccess,
      backUrl,
      title,
    }: {
      onSuccess: (graphId: string) => void
      backUrl: string
      title: string
    }) => (
      <div>
        <h1>{title}</h1>
        <p>Back URL: {backUrl}</p>
        <button onClick={() => onSuccess('test-graph-id')}>
          Create Test Graph
        </button>
      </div>
    )
  )
)

vi.mock('@/lib/core/components/graph-creation', () => ({
  GraphCreationPage: mockGraphCreationPage,
}))

const mockGraphLimitModal = vi.hoisted(() =>
  vi.fn(() => <div>Graph Limit Modal</div>)
)

vi.mock('@/components/app/GraphLimitModal', () => ({
  __esModule: true,
  default: mockGraphLimitModal,
}))

vi.mock('@/lib/core', () => ({
  useGraphContext: vi.fn(),
  useUser: vi.fn(),
  useUserLimits: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

const mockUseGraphContext = vi.mocked(useGraphContext)
const mockUseUser = vi.mocked(useUser)
const mockUseUserLimits = vi.mocked(useUserLimits)
const mockUseRouter = vi.mocked(useRouter)

describe('NewGraphContent', () => {
  const mockPush = vi.fn()
  const mockReplace = vi.fn()
  const mockRefresh = vi.fn()
  const mockSetCurrentGraph = vi.fn()
  const mockRefreshGraphs = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockGraphCreationPage.mockImplementation(
      ({
        onSuccess,
        backUrl,
        title,
      }: {
        onSuccess: (graphId: string) => void
        backUrl: string
        title: string
      }) => (
        <div>
          <h1>{title}</h1>
          <p>Back URL: {backUrl}</p>
          <button onClick={() => onSuccess('test-graph-id')}>
            Create Test Graph
          </button>
        </div>
      )
    )

    mockUseGraphContext.mockReturnValue({
      setCurrentGraph: mockSetCurrentGraph,
      refreshGraphs: mockRefreshGraphs,
    })

    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: mockReplace,
      refresh: mockRefresh,
    })

    mockUseUser.mockReturnValue({
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      },
    })

    mockUseUserLimits.mockReturnValue({
      limits: { max_graphs: 10 },
      remainingGraphs: 7,
      canCreateGraph: true,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
  })

  test('renders GraphCreationPage with correct props', () => {
    render(<NewGraphContent />)

    expect(screen.getByText('Create New Knowledge Graph')).toBeInTheDocument()
    expect(screen.getByText('Back URL: /dashboard')).toBeInTheDocument()
    expect(screen.getByText('Create Test Graph')).toBeInTheDocument()
  })

  test('handles successful graph creation', async () => {
    render(<NewGraphContent />)

    fireEvent.click(screen.getByText('Create Test Graph'))

    await waitFor(() => {
      expect(mockRefreshGraphs).toHaveBeenCalled()
    })

    expect(mockSetCurrentGraph).toHaveBeenCalledWith('test-graph-id')
    expect(mockReplace).toHaveBeenCalledWith('/dashboard')
    expect(mockRefresh).toHaveBeenCalled()
  })

  test('handles graph creation without graphId', async () => {
    mockGraphCreationPage.mockImplementationOnce(
      ({ onSuccess }: { onSuccess: (graphId: string) => void }) => (
        <button onClick={() => onSuccess('')}>Create Without ID</button>
      )
    )

    render(<NewGraphContent />)

    fireEvent.click(screen.getByText('Create Without ID'))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })

    expect(mockRefreshGraphs).not.toHaveBeenCalled()
    expect(mockSetCurrentGraph).not.toHaveBeenCalled()
  })

  test('handles errors during graph creation', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})
    mockRefreshGraphs.mockRejectedValue(new Error('Test error'))

    render(<NewGraphContent />)

    fireEvent.click(screen.getByText('Create Test Graph'))

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to select new graph:',
        expect.any(Error)
      )
    })

    expect(mockPush).toHaveBeenCalledWith('/dashboard')
    consoleErrorSpy.mockRestore()
  })

  describe('Boundary Conditions', () => {
    test('shows limit modal when at graph limit (remainingGraphs = 0)', () => {
      mockUseUserLimits.mockReturnValue({
        limits: { max_graphs: 5 },
        remainingGraphs: 0,
        canCreateGraph: false,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<NewGraphContent />)

      expect(screen.getByText('Graph Limit Modal')).toBeInTheDocument()
    })

    test('allows creation when exactly 1 graph remaining', () => {
      mockUseUserLimits.mockReturnValue({
        limits: { max_graphs: 5 },
        remainingGraphs: 1,
        canCreateGraph: true,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<NewGraphContent />)

      expect(screen.getByText('Create New Knowledge Graph')).toBeInTheDocument()
      expect(screen.queryByText('Graph Limit Modal')).not.toBeInTheDocument()
    })

    test('shows warning when at warning threshold (3 graphs remaining)', () => {
      mockUseUserLimits.mockReturnValue({
        limits: { max_graphs: 10 },
        remainingGraphs: 3,
        canCreateGraph: true,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<NewGraphContent />)

      expect(screen.getByText('Create New Knowledge Graph')).toBeInTheDocument()
      expect(screen.queryByText('Graph Limit Modal')).not.toBeInTheDocument()
    })

    test('handles negative remainingGraphs gracefully', () => {
      mockUseUserLimits.mockReturnValue({
        limits: { max_graphs: 5 },
        remainingGraphs: -1,
        canCreateGraph: false,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<NewGraphContent />)

      expect(screen.getByText('Graph Limit Modal')).toBeInTheDocument()
    })

    test('handles unlimited graphs (very high limit)', () => {
      mockUseUserLimits.mockReturnValue({
        limits: { max_graphs: 999999 },
        remainingGraphs: 999990,
        canCreateGraph: true,
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<NewGraphContent />)

      expect(screen.getByText('Create New Knowledge Graph')).toBeInTheDocument()
      expect(screen.queryByText('Graph Limit Modal')).not.toBeInTheDocument()
    })

    test('handles loading state correctly', () => {
      mockUseUserLimits.mockReturnValue({
        limits: null,
        remainingGraphs: 0,
        canCreateGraph: false,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      })

      render(<NewGraphContent />)

      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    test('handles error state when limits fail to load', () => {
      mockUseUserLimits.mockReturnValue({
        limits: null,
        remainingGraphs: 0,
        canCreateGraph: false,
        isLoading: false,
        error: 'Failed to load limits',
        refetch: vi.fn(),
      })

      render(<NewGraphContent />)

      expect(screen.getByText('Graph Limit Modal')).toBeInTheDocument()
    })
  })
})
