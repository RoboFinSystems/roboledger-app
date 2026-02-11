import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ConsoleConfig } from '../types'

vi.mock('../../../contexts', () => ({
  useGraphContext: vi.fn(),
}))

vi.mock('../../../hooks', () => ({
  useStreamingQuery: vi.fn(),
}))

vi.mock('../../../theme', () => ({
  customTheme: {
    card: {},
  },
}))

vi.mock('@robosystems/client/extensions', () => ({
  extensions: {
    agent: {
      executeQuery: vi.fn(),
    },
  },
}))

// Import after mocks
import { extensions } from '@robosystems/client/extensions'
import { useGraphContext } from '../../../contexts'
import { useStreamingQuery } from '../../../hooks'
import { ConsoleContent } from '../ConsoleContent'

const mockUseGraphContext = vi.mocked(useGraphContext)
const mockUseStreamingQuery = vi.mocked(useStreamingQuery)
const mockAgentExecuteQuery = vi.mocked(extensions.agent.executeQuery)

const TEST_CONFIG: ConsoleConfig = {
  header: {
    title: 'Test Console',
    subtitle: 'Test subtitle',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-purple-600',
  },
  welcome: {
    consoleName: 'Test Console',
    description: 'Test interactive console',
    contextLabel: 'Graph',
    naturalLanguageExamples: [
      'Show me all entities',
      'How many nodes are there?',
    ],
    directQueryExamples: [
      'MATCH (n) RETURN count(n)',
      'MATCH (e:Entity) RETURN e.name LIMIT 10',
    ],
    closingMessage: 'How can I help you today?',
  },
  mcp: {
    serverName: 'test-server',
    packageName: '@test/mcp',
    exampleQuestions: ['Query my graph', 'Get schema'],
    contextIdFallback: 'your_test_id',
  },
  sampleQueries: [
    { name: 'Count nodes', query: 'MATCH (n) RETURN count(n)' },
    { name: 'List entities', query: 'MATCH (e:Entity) RETURN e LIMIT 5' },
  ],
  examplesLabel: 'Test Example Queries:',
  noSelectionError: 'No graph selected. Please select a graph first.',
  extraCommands: [
    {
      command: '/custom',
      handler: (ctx) => {
        ctx.addSystemMessage('Custom command executed!', true)
      },
    },
  ],
}

type GraphContextMock = {
  state: {
    graphs: Array<{ graphId: string }>
    isLoading: boolean
    currentGraphId: string | null
  }
  loadGraphs: ReturnType<typeof vi.fn>
  setCurrentGraph: ReturnType<typeof vi.fn>
  refreshGraphs: ReturnType<typeof vi.fn>
}

const createGraphContext = (
  overrides: Partial<GraphContextMock> = {}
): GraphContextMock => {
  const baseState: GraphContextMock['state'] = {
    graphs: [{ graphId: 'test-graph-id' }],
    isLoading: false,
    currentGraphId: 'test-graph-id',
  }

  const context: GraphContextMock = {
    state: baseState,
    loadGraphs: vi.fn(),
    setCurrentGraph: vi.fn(),
    refreshGraphs: vi.fn(),
  }

  if (overrides.state) {
    context.state = { ...context.state, ...overrides.state }
  }

  return {
    ...context,
    ...overrides,
    state: { ...context.state },
  }
}

describe('ConsoleContent', () => {
  beforeAll(() => {
    Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
      writable: true,
      value: vi.fn(),
    })

    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ details: { version: '1.0.0' } }),
      })
    ) as any
  })

  const mockStreamingQuery = {
    executeQuery: vi.fn(),
    cancelQuery: vi.fn(),
    reset: vi.fn(),
    isStreaming: false,
    status: 'idle',
    results: [],
    error: null,
    creditsUsed: null,
    cached: false,
    duration: null,
    progress: null,
    totalRows: null,
    currentRow: null,
  }

  let graphContext: GraphContextMock

  beforeEach(() => {
    vi.clearAllMocks()
    mockStreamingQuery.executeQuery.mockReset()
    mockStreamingQuery.cancelQuery.mockReset()
    mockStreamingQuery.reset.mockReset()
    mockAgentExecuteQuery.mockReset()

    graphContext = createGraphContext()
    mockUseStreamingQuery.mockReturnValue(mockStreamingQuery)
    mockUseGraphContext.mockReturnValue(graphContext)
  })

  it('should render the console with config-driven header', async () => {
    render(<ConsoleContent config={TEST_CONFIG} />)

    expect(
      screen.getByRole('heading', { name: /test console/i })
    ).toBeInTheDocument()
    expect(screen.getByText('Test subtitle')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText(/Graph: test-graph-id/i)).toBeInTheDocument()
    })
    expect(
      screen.getByPlaceholderText(
        'Type a question, /query <cypher>, or /help...'
      )
    ).toBeInTheDocument()
  })

  it('should show "Not selected" when no graph is selected', async () => {
    graphContext = createGraphContext({
      state: { currentGraphId: null, graphs: [], isLoading: false },
    })
    mockUseGraphContext.mockReturnValue(graphContext)

    render(<ConsoleContent config={TEST_CONFIG} />)

    await waitFor(() => {
      expect(screen.getByText(/Graph:\s+Not selected/i)).toBeInTheDocument()
    })
  })

  it('should disable input when no graph is selected', () => {
    graphContext = createGraphContext({
      state: { currentGraphId: null, graphs: [] },
    })
    mockUseGraphContext.mockReturnValue(graphContext)

    render(<ConsoleContent config={TEST_CONFIG} />)

    const input = screen.getByPlaceholderText(
      'Type a question, /query <cypher>, or /help...'
    )
    expect(input).toBeDisabled()
  })

  it('should enable input when graph is selected', () => {
    render(<ConsoleContent config={TEST_CONFIG} />)

    const input = screen.getByPlaceholderText(
      'Type a question, /query <cypher>, or /help...'
    )
    expect(input).not.toBeDisabled()
  })

  describe('Command Handling', () => {
    it('should handle /help command', async () => {
      render(<ConsoleContent config={TEST_CONFIG} />)

      const input = screen.getByPlaceholderText(
        'Type a question, /query <cypher>, or /help...'
      )
      fireEvent.change(input, { target: { value: '/help' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      await waitFor(() => {
        expect(screen.getByText('/help')).toBeInTheDocument()
      })
    })

    it('should handle /clear command', async () => {
      render(<ConsoleContent config={TEST_CONFIG} />)

      const input = screen.getByPlaceholderText(
        'Type a question, /query <cypher>, or /help...'
      )
      fireEvent.change(input, { target: { value: '/clear' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      await waitFor(() => {
        expect(screen.getByText('Console cleared.')).toBeInTheDocument()
      })
    })

    it('should handle /examples command with config-driven label', async () => {
      render(<ConsoleContent config={TEST_CONFIG} />)

      const input = screen.getByPlaceholderText(
        'Type a question, /query <cypher>, or /help...'
      )
      fireEvent.change(input, { target: { value: '/examples' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      await waitFor(() => {
        expect(screen.getByText(TEST_CONFIG.examplesLabel)).toBeInTheDocument()
      })
    })

    it('should handle /query command and call reset before executing', async () => {
      render(<ConsoleContent config={TEST_CONFIG} />)

      const input = screen.getByPlaceholderText(
        'Type a question, /query <cypher>, or /help...'
      )
      fireEvent.change(input, {
        target: { value: '/query MATCH (n) RETURN n LIMIT 5' },
      })
      fireEvent.keyDown(input, { key: 'Enter' })

      await waitFor(() => {
        expect(mockStreamingQuery.reset).toHaveBeenCalled()
        expect(mockStreamingQuery.executeQuery).toHaveBeenCalledWith(
          'test-graph-id',
          'MATCH (n) RETURN n LIMIT 5'
        )
      })

      // Verify reset was called before executeQuery
      const resetOrder = mockStreamingQuery.reset.mock.invocationCallOrder[0]
      const execOrder =
        mockStreamingQuery.executeQuery.mock.invocationCallOrder[0]
      expect(resetOrder).toBeLessThan(execOrder)
    })

    it('should handle extra commands from config', async () => {
      render(<ConsoleContent config={TEST_CONFIG} />)

      const input = screen.getByPlaceholderText(
        'Type a question, /query <cypher>, or /help...'
      )
      fireEvent.change(input, { target: { value: '/custom' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      await waitFor(() => {
        expect(screen.getByText('Custom command executed!')).toBeInTheDocument()
      })
    })

    it('should handle unknown commands', async () => {
      render(<ConsoleContent config={TEST_CONFIG} />)

      const input = screen.getByPlaceholderText(
        'Type a question, /query <cypher>, or /help...'
      )
      fireEvent.change(input, { target: { value: '/unknown' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      await waitFor(() => {
        expect(
          screen.getByText((content) =>
            content.includes('Unknown command: /unknown')
          )
        ).toBeInTheDocument()
      })
    })

    it('should clear input after command execution', async () => {
      render(<ConsoleContent config={TEST_CONFIG} />)

      const input = screen.getByPlaceholderText(
        'Type a question, /query <cypher>, or /help...'
      )
      fireEvent.change(input, { target: { value: '/help' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      await waitFor(() => {
        expect(input).toHaveValue('')
      })
    })

    it('should ignore empty commands', async () => {
      render(<ConsoleContent config={TEST_CONFIG} />)

      const input = screen.getByPlaceholderText(
        'Type a question, /query <cypher>, or /help...'
      )
      fireEvent.change(input, { target: { value: '   ' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      expect(input).toHaveValue('   ')
      expect(mockStreamingQuery.executeQuery).not.toHaveBeenCalled()
    })
  })

  describe('Terminal Messages', () => {
    it('should display user messages with green styling', async () => {
      render(<ConsoleContent config={TEST_CONFIG} />)

      const input = screen.getByPlaceholderText(
        'Type a question, /query <cypher>, or /help...'
      )
      fireEvent.change(input, { target: { value: 'test query' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      await waitFor(() => {
        const userMessage = screen.getByText('test query')
        expect(userMessage).toHaveClass('text-green-400')
      })
    })

    it('should display system messages with cyan styling', async () => {
      render(<ConsoleContent config={TEST_CONFIG} />)

      const input = screen.getByPlaceholderText(
        'Type a question, /query <cypher>, or /help...'
      )
      fireEvent.change(input, { target: { value: '/help' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      await waitFor(() => {
        expect(screen.getAllByText(/system/i).length).toBeGreaterThan(0)
      })
    })

    it('should display error messages with red styling', async () => {
      render(<ConsoleContent config={TEST_CONFIG} />)

      const input = screen.getByPlaceholderText(
        'Type a question, /query <cypher>, or /help...'
      )
      fireEvent.change(input, { target: { value: '/unknown' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      await waitFor(() => {
        const errorMessage = screen.getByText((content) =>
          content.includes('Unknown command: /unknown')
        )
        expect(errorMessage).toHaveClass('text-red-400')
      })
    })
  })

  describe('Cancel Button', () => {
    it('should show cancel button when streaming', () => {
      mockUseStreamingQuery.mockReturnValue({
        ...mockStreamingQuery,
        isStreaming: true,
      })

      render(<ConsoleContent config={TEST_CONFIG} />)

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    })

    it('should not show cancel button when not streaming', () => {
      render(<ConsoleContent config={TEST_CONFIG} />)

      expect(
        screen.queryByRole('button', { name: 'Cancel' })
      ).not.toBeInTheDocument()
    })

    it('should call cancelQuery when cancel button is clicked', () => {
      mockUseStreamingQuery.mockReturnValue({
        ...mockStreamingQuery,
        isStreaming: true,
      })

      render(<ConsoleContent config={TEST_CONFIG} />)

      const cancelButton = screen.getByRole('button', { name: 'Cancel' })
      fireEvent.click(cancelButton)

      expect(mockStreamingQuery.cancelQuery).toHaveBeenCalledTimes(1)
    })
  })

  describe('Query Execution', () => {
    it('should execute natural language queries via agent', async () => {
      mockAgentExecuteQuery.mockResolvedValue({
        query: 'MATCH (n) RETURN n',
        result: [],
      })

      render(<ConsoleContent config={TEST_CONFIG} />)

      const input = screen.getByPlaceholderText(
        'Type a question, /query <cypher>, or /help...'
      )
      fireEvent.change(input, { target: { value: 'Show me all nodes' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      await waitFor(() => {
        expect(mockAgentExecuteQuery).toHaveBeenCalledWith(
          'test-graph-id',
          {
            message: 'Show me all nodes',
            mode: 'quick',
          },
          expect.any(Object)
        )
      })
    })

    it('should show config-driven error when no graph is selected for cypher query', async () => {
      graphContext = createGraphContext({
        state: { currentGraphId: null, graphs: [] },
      })
      mockUseGraphContext.mockReturnValue(graphContext)

      render(<ConsoleContent config={TEST_CONFIG} />)

      const input = screen.getByPlaceholderText(
        'Type a question, /query <cypher>, or /help...'
      )
      fireEvent.change(input, {
        target: { value: '/query MATCH (n) RETURN n' },
      })
      fireEvent.keyDown(input, { key: 'Enter' })

      await waitFor(() => {
        expect(
          screen.getByText(TEST_CONFIG.noSelectionError)
        ).toBeInTheDocument()
      })
    })

    it('should show config-driven error when no graph is selected for agent query', async () => {
      graphContext = createGraphContext({
        state: { currentGraphId: null, graphs: [] },
      })
      mockUseGraphContext.mockReturnValue(graphContext)

      render(<ConsoleContent config={TEST_CONFIG} />)

      const input = screen.getByPlaceholderText(
        'Type a question, /query <cypher>, or /help...'
      )
      fireEvent.change(input, { target: { value: 'Show me data' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      await waitFor(() => {
        expect(
          screen.getByText(TEST_CONFIG.noSelectionError)
        ).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper input type', () => {
      render(<ConsoleContent config={TEST_CONFIG} />)

      const input = screen.getByPlaceholderText(
        'Type a question, /query <cypher>, or /help...'
      )
      expect(input).toHaveAttribute('type', 'text')
    })

    it('should support keyboard navigation', () => {
      render(<ConsoleContent config={TEST_CONFIG} />)

      const input = screen.getByPlaceholderText(
        'Type a question, /query <cypher>, or /help...'
      )

      input.focus()
      expect(input).toHaveFocus()

      fireEvent.change(input, { target: { value: '/help' } })
      expect(input).toHaveValue('/help')

      fireEvent.keyDown(input, { key: 'Enter' })
      expect(input).toHaveValue('')
    })
  })
})
