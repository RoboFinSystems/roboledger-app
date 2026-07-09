import type { GraphInfo } from '@robosystems/client'
import { describe, expect, it } from 'vitest'

import {
  buildGraphAwareConsoleConfig,
  getGraphExampleKind,
  type ConsoleBranding,
} from '../graphAwareConfig'

const BRANDING: ConsoleBranding = {
  title: 'Test Console',
  consoleName: 'Test',
  gradientFrom: 'from-x-500',
  gradientTo: 'to-y-600',
  closingMessage: 'hello',
  mcp: {
    serverName: 'svc',
    packageName: '@svc/mcp',
    contextIdFallback: 'your_graph_id',
  },
}

function graph(partial: Partial<GraphInfo>): GraphInfo {
  return {
    graphId: 'g1',
    graphName: 'My Graph',
    role: 'owner',
    isSelected: true,
    createdAt: '2026-01-01T00:00:00Z',
    ...partial,
  } as GraphInfo
}

const SEC = graph({ isRepository: true, repositoryType: 'sec' })
const LEDGER = graph({ schemaExtensions: ['roboledger'] })
const INVESTOR = graph({ schemaExtensions: ['roboinvestor'] })
const GENERIC = graph({ schemaExtensions: [] })
const BOTH = graph({ schemaExtensions: ['roboledger', 'roboinvestor'] })

describe('getGraphExampleKind', () => {
  it('classifies an SEC repository', () => {
    expect(getGraphExampleKind(SEC)).toBe('sec')
  })

  it('classifies entity graphs by schema extension', () => {
    expect(getGraphExampleKind(LEDGER)).toBe('roboledger')
    expect(getGraphExampleKind(INVESTOR)).toBe('roboinvestor')
  })

  it('falls back to generic with no known extension', () => {
    expect(getGraphExampleKind(GENERIC)).toBe('generic')
  })

  it('treats a non-SEC repository as generic', () => {
    expect(
      getGraphExampleKind(
        graph({ isRepository: true, repositoryType: 'other' })
      )
    ).toBe('generic')
  })

  it('uses preferredKind as the tiebreak for dual-extension graphs', () => {
    expect(getGraphExampleKind(BOTH)).toBe('roboinvestor') // default priority
    expect(getGraphExampleKind(BOTH, 'roboledger')).toBe('roboledger')
    expect(getGraphExampleKind(BOTH, 'roboinvestor')).toBe('roboinvestor')
  })

  it('handles an undefined graph', () => {
    expect(getGraphExampleKind(undefined)).toBe('generic')
    expect(getGraphExampleKind(undefined, 'roboledger')).toBe('roboledger')
  })
})

describe('buildGraphAwareConsoleConfig', () => {
  it('merges branding with the SEC example set', () => {
    const config = buildGraphAwareConsoleConfig(SEC, BRANDING)

    // Branding wins for chrome…
    expect(config.header.title).toBe('Test Console')
    expect(config.header.gradientFrom).toBe('from-x-500')
    expect(config.welcome.consoleName).toBe('Test')
    expect(config.mcp.packageName).toBe('@svc/mcp')
    // …the example set drives the graph-specific content.
    expect(config.header.subtitle).toContain('public companies')
    expect(config.welcome.contextLabel).toBe('Repository')
    expect(
      config.sampleQueries.some((q) => q.name === 'NVIDIA income statement')
    ).toBe(true)
    expect(config.examplesLabel).toBe('Example Cypher Queries:')
  })

  it('selects the ledger set with a Graph context label', () => {
    const config = buildGraphAwareConsoleConfig(LEDGER, BRANDING)
    expect(config.welcome.contextLabel).toBe('Graph')
    const trialBalance = config.sampleQueries.find(
      (q) => q.name === 'Trial balance'
    )
    expect(trialBalance).toBeDefined()
    // Ledger sums must filter live rows, not the cancelled/replaced audit rows.
    expect(trialBalance?.query).toContain('is_live')
  })

  it('selects the portfolio set for a roboinvestor graph', () => {
    const config = buildGraphAwareConsoleConfig(INVESTOR, BRANDING)
    expect(config.sampleQueries.some((q) => q.name === 'Portfolio value')).toBe(
      true
    )
  })

  it('selects the generic set and injects the graph name', () => {
    const config = buildGraphAwareConsoleConfig(
      graph({ graphName: 'Acme', schemaExtensions: [] }),
      BRANDING
    )
    expect(config.sampleQueries.some((q) => q.name === 'Node types')).toBe(true)
    expect(config.welcome.description).toContain('"Acme"')
  })

  it('respects the preferredKind branding tiebreak', () => {
    const config = buildGraphAwareConsoleConfig(BOTH, {
      ...BRANDING,
      preferredKind: 'roboledger',
    })
    expect(config.sampleQueries.some((q) => q.name === 'Trial balance')).toBe(
      true
    )
  })

  it('allows an examplesLabel override', () => {
    const config = buildGraphAwareConsoleConfig(GENERIC, {
      ...BRANDING,
      examplesLabel: 'Example Financial Queries:',
    })
    expect(config.examplesLabel).toBe('Example Financial Queries:')
  })
})
