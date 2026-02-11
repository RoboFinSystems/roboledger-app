import { render, screen } from '@testing-library/react'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryInterfaceContent } from '../content'

vi.mock('@/lib/core', async () => {
  const actual = await vi.importActual('@/lib/core')
  return {
    ...actual,
    ConsoleContent: vi.fn(({ config }) => (
      <div data-testid="console-content" data-config={JSON.stringify(config)}>
        <h1>{config.header.title}</h1>
      </div>
    )),
    customTheme: { card: {} },
    useGraphContext: vi.fn(() => ({
      state: {
        graphs: [{ graphId: 'test-graph-id' }],
        isLoading: false,
        currentGraphId: 'test-graph-id',
      },
      loadGraphs: vi.fn(),
      setCurrentGraph: vi.fn(),
      refreshGraphs: vi.fn(),
    })),
  }
})

vi.mock('@/lib/core/hooks', () => ({
  useStreamingQuery: vi.fn(() => ({
    executeQuery: vi.fn(),
    cancelQuery: vi.fn(),
    reset: vi.fn(),
    isStreaming: false,
    status: 'idle',
    results: [],
    error: null,
    creditsUsed: null,
  })),
}))

describe('QueryInterfaceContent', () => {
  beforeAll(() => {
    Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
      writable: true,
      value: vi.fn(),
    })
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render ConsoleContent with RoboSystems config', () => {
    render(<QueryInterfaceContent />)

    const consoleContent = screen.getByTestId('console-content')
    const config = JSON.parse(consoleContent.getAttribute('data-config')!)

    expect(config.header.title).toBe('Console')
    expect(config.welcome.consoleName).toBe('RoboSystems Console')
    expect(config.mcp.serverName).toBe('robosystems')
    expect(config.mcp.packageName).toBe('@robosystems/mcp')
    expect(config.examplesLabel).toBe('Example Cypher Queries:')
    expect(config.noSelectionError).toBe(
      'No graph selected. Please select a graph first.'
    )
  })

  it('should include the /api-keys extra command', () => {
    render(<QueryInterfaceContent />)

    const consoleContent = screen.getByTestId('console-content')
    const config = JSON.parse(consoleContent.getAttribute('data-config')!)

    // Functions are not serializable, so check the command names
    expect(config.extraCommands).toHaveLength(1)
    expect(config.extraCommands[0].command).toBe('/api-keys')
  })

  it('should include sample queries', () => {
    render(<QueryInterfaceContent />)

    const consoleContent = screen.getByTestId('console-content')
    const config = JSON.parse(consoleContent.getAttribute('data-config')!)

    expect(config.sampleQueries.length).toBe(7)
    expect(config.sampleQueries[0].name).toBe('What entity is in the graph?')
  })
})
