import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListEntities = vi.fn()
const mockUseGraphContext = vi.fn()
const mockUseEntity = vi.fn()
const mockSetCurrentGraph = vi.fn()
const mockSetCurrentEntity = vi.fn()

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      listEntities: (...args: any[]) => mockListEntities(...args),
    },
  },
  GraphFilters: {
    roboledger: (g: any) => g.schemaExtensions?.includes('roboledger'),
  },
  useGraphContext: () => mockUseGraphContext(),
  useEntity: () => mockUseEntity(),
}))

import {
  EntityScopeProvider,
  hierarchyDepth,
  orderByHierarchy,
  useEntityScope,
} from '../entity-scope'

const entity = (over: Record<string, unknown>) => ({
  id: 'ent',
  name: 'Entity',
  legalName: null,
  ticker: null,
  cik: null,
  industry: null,
  entityType: null,
  status: 'active',
  isParent: false,
  parentEntityId: null,
  ownershipPct: null,
  source: 'native',
  sourceGraphId: null,
  connectionId: null,
  createdAt: null,
  updatedAt: null,
  ...over,
})

const parent = entity({ id: 'ent_p', name: 'Harbinger', isParent: true })
const sub = entity({
  id: 'ent_s',
  name: 'Maple Court',
  parentEntityId: 'ent_p',
  ownershipPct: 100,
  ticker: 'MCL',
})
const grand = entity({
  id: 'ent_g',
  name: 'Maple Annex',
  parentEntityId: 'ent_s',
})
const bParent = entity({ id: 'ent_b', name: 'Beta Co', isParent: true })

const ledgerA = {
  graphId: 'kg_a',
  graphName: 'A',
  schemaExtensions: ['roboledger'],
}
const ledgerB = {
  graphId: 'kg_b',
  graphName: 'B',
  schemaExtensions: ['roboledger'],
}
const investor = {
  graphId: 'kg_i',
  graphName: 'I',
  schemaExtensions: ['roboinvestor'],
}

const withState = (graphs: any[], currentGraphId: string | null) =>
  mockUseGraphContext.mockReturnValue({
    state: { graphs, currentGraphId, isLoading: false },
    setCurrentGraph: mockSetCurrentGraph,
  })

const withPick = (currentEntity: Record<string, unknown> | null) =>
  mockUseEntity.mockReturnValue({
    currentEntity,
    setCurrentEntity: mockSetCurrentEntity,
    clearEntity: vi.fn(),
  })

const wrapper = ({ children }: PropsWithChildren) => (
  <EntityScopeProvider>{children}</EntityScopeProvider>
)

describe('orderByHierarchy', () => {
  it('puts the group parent first and each subsidiary under its parent', () => {
    expect(orderByHierarchy([grand, sub, parent]).map((e) => e.id)).toEqual([
      'ent_p',
      'ent_s',
      'ent_g',
    ])
  })

  it('files an entity whose parent is not in the list at the top level', () => {
    const orphan = entity({
      id: 'ent_o',
      name: 'Orphan',
      parentEntityId: 'gone',
    })
    expect(orderByHierarchy([orphan, parent]).map((e) => e.id)).toEqual([
      'ent_p',
      'ent_o',
    ])
    expect(hierarchyDepth(orphan, [orphan, parent])).toBe(0)
  })
})

describe('hierarchyDepth', () => {
  it('counts the parents above an entity', () => {
    const all = [parent, sub, grand]
    expect(hierarchyDepth(parent, all)).toBe(0)
    expect(hierarchyDepth(sub, all)).toBe(1)
    expect(hierarchyDepth(grand, all)).toBe(2)
  })
})

describe('EntityScopeProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListEntities.mockImplementation((graphId: string) =>
      Promise.resolve(graphId === 'kg_a' ? [sub, parent] : [bParent])
    )
    mockSetCurrentGraph.mockResolvedValue(undefined)
  })

  it("reads each ledger graph's entities once and orders them parent first", async () => {
    withState([ledgerA, ledgerB, investor], 'kg_a')
    withPick(null)
    const { result } = renderHook(() => useEntityScope(), { wrapper })

    await waitFor(() => expect(result.current.entities).toHaveLength(2))
    expect(mockListEntities).toHaveBeenCalledTimes(2)
    expect(mockListEntities).toHaveBeenCalledWith('kg_a')
    expect(mockListEntities).toHaveBeenCalledWith('kg_b')
    expect(result.current.entities.map((e) => e.id)).toEqual(['ent_p', 'ent_s'])
    expect(result.current.parent?.id).toBe('ent_p')
    // Nothing picked: the group parent, which the server takes as null.
    expect(result.current.entity?.id).toBe('ent_p')
    expect(result.current.entityId).toBeNull()
    expect(result.current.entitiesByGraph.get('kg_b')?.[0].id).toBe('ent_b')
  })

  it("resolves the header's pick to a subsidiary's id", async () => {
    withState([ledgerA], 'kg_a')
    withPick({ identifier: 'ent_s', name: 'Maple Court', graphId: 'kg_a' })
    const { result } = renderHook(() => useEntityScope(), { wrapper })

    await waitFor(() => expect(result.current.entityId).toBe('ent_s'))
    expect(result.current.entity?.name).toBe('Maple Court')
  })

  it('falls back to the parent when the pick is from another graph, and re-persists it', async () => {
    withState([ledgerA, ledgerB], 'kg_a')
    withPick({ identifier: 'ent_b', name: 'Beta Co', graphId: 'kg_b' })
    const { result } = renderHook(() => useEntityScope(), { wrapper })

    await waitFor(() => expect(result.current.entities).toHaveLength(2))
    expect(result.current.entity?.id).toBe('ent_p')
    expect(result.current.entityId).toBeNull()
    expect(mockSetCurrentEntity).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: 'ent_p',
        name: 'Harbinger',
        isParent: true,
        graphId: 'kg_a',
      })
    )
  })

  it('fills in a cookie-restored pick that lacks the graph and parent fields', async () => {
    withState([ledgerA], 'kg_a')
    withPick({ identifier: 'ent_s', name: 'Maple Court' })
    const { result } = renderHook(() => useEntityScope(), { wrapper })

    await waitFor(() => expect(result.current.entityId).toBe('ent_s'))
    expect(mockSetCurrentEntity).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: 'ent_s',
        isParent: false,
        parentEntityId: 'ent_p',
        graphId: 'kg_a',
      })
    )
  })

  it('switches the graph before persisting a pick from another graph', async () => {
    withState([ledgerA, ledgerB], 'kg_a')
    withPick(null)
    const { result } = renderHook(() => useEntityScope(), { wrapper })
    await waitFor(() => expect(result.current.entities).toHaveLength(2))
    mockSetCurrentEntity.mockClear()

    await act(() => result.current.select(bParent, 'kg_b'))

    expect(mockSetCurrentGraph).toHaveBeenCalledWith('kg_b')
    expect(mockSetCurrentEntity).toHaveBeenCalledWith(
      expect.objectContaining({ identifier: 'ent_b', graphId: 'kg_b' })
    )
    expect(mockSetCurrentGraph.mock.invocationCallOrder[0]).toBeLessThan(
      mockSetCurrentEntity.mock.invocationCallOrder[0]
    )
  })

  it('does not switch the graph for a pick in the selected one', async () => {
    withState([ledgerA], 'kg_a')
    withPick(null)
    const { result } = renderHook(() => useEntityScope(), { wrapper })
    await waitFor(() => expect(result.current.entities).toHaveLength(2))

    await act(() => result.current.select(sub, 'kg_a'))

    expect(mockSetCurrentGraph).not.toHaveBeenCalled()
    expect(mockSetCurrentEntity).toHaveBeenLastCalledWith(
      expect.objectContaining({ identifier: 'ent_s', graphId: 'kg_a' })
    )
  })

  it('keeps the graphs that loaded when one read fails', async () => {
    mockListEntities.mockImplementation((graphId: string) =>
      graphId === 'kg_b'
        ? Promise.reject(new Error('boom'))
        : Promise.resolve([parent])
    )
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    withState([ledgerA, ledgerB], 'kg_a')
    withPick(null)
    const { result } = renderHook(() => useEntityScope(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.entities.map((e) => e.id)).toEqual(['ent_p'])
    expect(result.current.entitiesByGraph.has('kg_b')).toBe(false)
    consoleError.mockRestore()
  })

  it('is the group parent outside the provider', () => {
    const { result } = renderHook(() => useEntityScope())
    expect(result.current.entityId).toBeNull()
    expect(result.current.entities).toEqual([])
  })
})
