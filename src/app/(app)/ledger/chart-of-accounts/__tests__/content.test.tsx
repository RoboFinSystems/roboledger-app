import { render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetAccountTree = vi.fn()
const mockListMappings = vi.fn()
const mockGetMapping = vi.fn()

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      getAccountTree: (...args: any[]) => mockGetAccountTree(...args),
      listMappings: (...args: any[]) => mockListMappings(...args),
      getMapping: (...args: any[]) => mockGetMapping(...args),
      listChartTemplates: vi.fn(async () => []),
    },
  },
  PageLayout: ({ children }: any) => <div>{children}</div>,
  PageHeader: ({ title }: any) => <div>{title}</div>,
  LoadingState: () => <div role="status" />,
  EmptyState: ({ title }: any) => <div>{title}</div>,
}))

vi.mock('@/components/DocsLink', () => ({ default: () => null }))

const { GRAPH } = vi.hoisted(() => ({
  GRAPH: { graphId: 'kg_a', graphName: 'Group' },
}))
vi.mock('@/lib/useLedgerGraph', () => ({
  useLedgerGraph: () => ({ graph: GRAPH }),
}))

const mockScope = vi.fn()
vi.mock('@/lib/entity-scope', () => ({ useEntityScope: () => mockScope() }))

import ChartOfAccountsContent from '../content'

describe('ChartOfAccountsContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAccountTree.mockResolvedValue({ roots: [] })
    mockListMappings.mockResolvedValue([])
  })

  it.each([
    [
      'a subsidiary',
      { entityId: 'ent_sub', parent: { id: 'ent_parent' } },
      'ent_sub',
    ],
    [
      'the group parent',
      { entityId: null, parent: { id: 'ent_parent' } },
      'ent_parent',
    ],
  ])(
    "maps %s's accounts into its own mapping",
    async (_who, scope, expected) => {
      mockScope.mockReturnValue(scope)
      render(<ChartOfAccountsContent />)
      await waitFor(() =>
        expect(mockListMappings).toHaveBeenCalledWith('kg_a', {
          entityId: expected,
        })
      )
    }
  )
})
