import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ConsolePageContent from '../content'

// The graph-aware example selection is exercised by the core
// graphAwareConfig.test.ts; here we only verify this app hands its branding to
// the shared hook and renders the resulting config.
const mockUseGraphAwareConsoleConfig = vi.fn()

vi.mock('@robosystems/core', async () => {
  const actual = await vi.importActual('@robosystems/core')
  return {
    ...actual,
    ConsoleContent: vi.fn(({ config }) => (
      <div data-testid="console-content">
        <h1>{config.header.title}</h1>
      </div>
    )),
    useGraphAwareConsoleConfig: (...args: any[]) =>
      mockUseGraphAwareConsoleConfig(...args),
  }
})

describe('RoboLedger ConsolePageContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseGraphAwareConsoleConfig.mockReturnValue({
      header: { title: 'RoboLedger Console' },
    })
  })

  it('passes RoboLedger branding to the graph-aware config hook', () => {
    render(<ConsolePageContent />)

    expect(mockUseGraphAwareConsoleConfig).toHaveBeenCalledTimes(1)
    const branding = mockUseGraphAwareConsoleConfig.mock.calls[0][0]
    expect(branding.title).toBe('RoboLedger Console')
    expect(branding.consoleName).toBe('RoboLedger Console')
    expect(branding.mcp.serverName).toBe('roboledger')
    expect(branding.mcp.packageName).toBe('@roboledger/mcp')
    // Dual-extension graphs should read as ledger graphs in this app.
    expect(branding.preferredKind).toBe('roboledger')
  })

  it('renders the console with the resolved config', () => {
    render(<ConsolePageContent />)
    expect(screen.getByTestId('console-content')).toBeInTheDocument()
    expect(screen.getByText('RoboLedger Console')).toBeInTheDocument()
  })
})
