'use client'

import type { LedgerEntitySummary } from '@robosystems/client/clients'
import {
  clients,
  GraphFilters,
  useEntity,
  useGraphContext,
} from '@robosystems/core'
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

/**
 * The entity a page is about, inside the selected RoboLedger graph.
 *
 * A graph is a reporting group: its first entity is the group parent and
 * every later one a subsidiary. The header's switcher picks one; this scope
 * resolves that pick against the graph's own entity list and hands the pages
 * the id the ledger facades take. The group parent is the server's default,
 * so it is passed as `null` — a single-entity graph never sends an entity id.
 */
export interface EntityScope {
  /** Every RoboLedger graph's entities, by graph id. */
  entitiesByGraph: ReadonlyMap<string, LedgerEntitySummary[]>
  /** The selected graph's entities, the group parent first; `[]` until loaded. */
  entities: LedgerEntitySummary[]
  /** The entity in scope, once the selected graph's list has loaded. */
  entity: LedgerEntitySummary | null
  /** The group parent of the selected graph, once loaded. */
  parent: LedgerEntitySummary | null
  /**
   * What the ledger facades take: a subsidiary's id, or `null` for the group
   * parent. Also `null` while the list loads, so a page reads the parent's
   * books and re-reads once a subsidiary resolves.
   */
  entityId: string | null
  /** True while any graph's entity list is loading. */
  isLoading: boolean
  /**
   * True once the selected graph's entity list has been read (or failed), or
   * when the selected graph is not a ledger graph. Until then `entityId` is
   * the parent by default, so a page that writes should wait for this.
   */
  isResolved: boolean
  /** Set when the selected graph's list failed and nothing is cached for it. */
  error: string | null
  /** Make an entity current, switching graph first when it is in another. */
  select: (entity: LedgerEntitySummary, graphId: string) => Promise<void>
  /** Reload every graph's entities, e.g. after one is created. */
  refresh: () => Promise<void>
}

const EntityScopeContext = createContext<EntityScope | null>(null)

/** Parent first, then each subsidiary under its parent, depth first. */
export function orderByHierarchy(
  entities: readonly LedgerEntitySummary[]
): LedgerEntitySummary[] {
  const byParent = new Map<string | null, LedgerEntitySummary[]>()
  const ids = new Set(entities.map((e) => e.id))
  for (const entity of entities) {
    // A parent the list does not hold (a linked entity's source graph, a
    // stale pointer) files the row at the top level rather than dropping it.
    const key =
      entity.parentEntityId && ids.has(entity.parentEntityId)
        ? entity.parentEntityId
        : null
    const siblings = byParent.get(key) ?? []
    siblings.push(entity)
    byParent.set(key, siblings)
  }
  const ordered: LedgerEntitySummary[] = []
  const visit = (parentId: string | null, seen: Set<string>) => {
    const children = byParent.get(parentId) ?? []
    children.sort((a, b) =>
      a.isParent === b.isParent
        ? a.name.localeCompare(b.name)
        : a.isParent
          ? -1
          : 1
    )
    for (const child of children) {
      if (seen.has(child.id)) continue
      seen.add(child.id)
      ordered.push(child)
      visit(child.id, seen)
    }
  }
  visit(null, new Set())
  return ordered
}

/** How many parents sit above an entity in its graph's list. */
export function hierarchyDepth(
  entity: LedgerEntitySummary,
  entities: readonly LedgerEntitySummary[]
): number {
  const byId = new Map(entities.map((e) => [e.id, e]))
  let depth = 0
  let cursor = entity
  const seen = new Set<string>([entity.id])
  while (cursor.parentEntityId && byId.has(cursor.parentEntityId)) {
    const parent = byId.get(cursor.parentEntityId)!
    if (seen.has(parent.id)) break
    seen.add(parent.id)
    depth += 1
    cursor = parent
  }
  return depth
}

export function EntityScopeProvider({ children }: PropsWithChildren) {
  const { state: graphState, setCurrentGraph } = useGraphContext()
  const { currentEntity, setCurrentEntity } = useEntity()
  const [entitiesByGraph, setEntitiesByGraph] = useState<
    Map<string, LedgerEntitySummary[]>
  >(new Map())
  const [isLoading, setIsLoading] = useState(false)
  // Whether each graph's last read landed or failed; absent until the first.
  const [statusByGraph, setStatusByGraph] = useState<
    Map<string, 'loaded' | 'failed'>
  >(new Map())

  const ledgerGraphs = useMemo(
    () => graphState.graphs.filter(GraphFilters.roboledger),
    [graphState.graphs]
  )
  const ledgerGraphIds = useMemo(
    () => ledgerGraphs.map((g) => g.graphId).join(','),
    [ledgerGraphs]
  )

  // One list per graph; a graph whose read fails keeps its previous rows so a
  // transient error does not empty the switcher.
  const loadSeq = useRef(0)
  const load = useCallback(async () => {
    const seq = ++loadSeq.current
    if (ledgerGraphs.length === 0) {
      setEntitiesByGraph(new Map())
      setStatusByGraph(new Map())
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    const results = await Promise.allSettled(
      ledgerGraphs.map((graph) =>
        clients.ledger
          .listEntities(graph.graphId)
          .then((entities) => ({ graphId: graph.graphId, entities }))
      )
    )
    if (seq !== loadSeq.current) return
    setEntitiesByGraph((previous) => {
      const next = new Map<string, LedgerEntitySummary[]>()
      for (const result of results) {
        if (result.status === 'fulfilled') {
          next.set(
            result.value.graphId,
            orderByHierarchy(result.value.entities)
          )
        }
      }
      for (const result of results) {
        if (result.status === 'rejected') {
          console.error('Failed to load entities:', result.reason)
        }
      }
      for (const graph of ledgerGraphs) {
        if (!next.has(graph.graphId) && previous.has(graph.graphId)) {
          next.set(graph.graphId, previous.get(graph.graphId)!)
        }
      }
      return next
    })
    setStatusByGraph(
      new Map(
        ledgerGraphs.map((graph, i) => [
          graph.graphId,
          results[i].status === 'fulfilled' ? 'loaded' : 'failed',
        ])
      )
    )
    setIsLoading(false)
    // The id list, not the array: the graph list is rebuilt on every context
    // refresh, and reloading entities each time would hammer the API.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ledgerGraphIds])

  useEffect(() => {
    void load()
  }, [load])

  const currentGraphId = graphState.currentGraphId
  const entities = useMemo(
    () => (currentGraphId ? (entitiesByGraph.get(currentGraphId) ?? []) : []),
    [entitiesByGraph, currentGraphId]
  )
  const parent = useMemo(
    () => entities.find((e) => e.isParent) ?? entities[0] ?? null,
    [entities]
  )
  // The header's pick, when it is one of this graph's entities. A pick from
  // another graph (the cookie remembers one per user, and the graph can be
  // switched from another app) falls back to the parent.
  const entity = useMemo(() => {
    const picked = currentEntity
      ? entities.find((e) => e.id === currentEntity.identifier)
      : undefined
    return picked ?? parent
  }, [currentEntity, entities, parent])
  const entityId = entity && !entity.isParent ? entity.id : null

  // A ledger page must not act on the parent's books because the list has not
  // arrived or could not be read: the gate holds the page on these.
  const isLedgerGraph =
    !!currentGraphId && ledgerGraphs.some((g) => g.graphId === currentGraphId)
  const status = currentGraphId ? statusByGraph.get(currentGraphId) : undefined
  const isResolved = !isLedgerGraph || status !== undefined
  const error =
    isLedgerGraph &&
    status === 'failed' &&
    currentGraphId &&
    !entitiesByGraph.has(currentGraphId)
      ? "This graph's entities could not be loaded."
      : null

  // Keep the persisted pick honest: it names an entity of the selected graph,
  // and it carries the fields the switcher and the pages read.
  useEffect(() => {
    if (!currentGraphId || entities.length === 0 || !entity) return
    const needsSync =
      !currentEntity ||
      currentEntity.identifier !== entity.id ||
      currentEntity.graphId !== currentGraphId ||
      currentEntity.name !== entity.name ||
      currentEntity.isParent !== entity.isParent
    if (needsSync) {
      setCurrentEntity(toContextEntity(entity, currentGraphId))
    }
    // currentEntity is read, not depended on: setting it re-runs the effect
    // once, finds nothing to sync, and stops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGraphId, entities, entity, setCurrentEntity])

  const select = useCallback(
    async (target: LedgerEntitySummary, graphId: string) => {
      if (graphId !== graphState.currentGraphId) {
        await setCurrentGraph(graphId)
      }
      setCurrentEntity(toContextEntity(target, graphId))
    },
    [graphState.currentGraphId, setCurrentGraph, setCurrentEntity]
  )

  const value = useMemo<EntityScope>(
    () => ({
      entitiesByGraph,
      entities,
      entity,
      parent,
      entityId,
      isLoading,
      isResolved,
      error,
      select,
      refresh: load,
    }),
    [
      entitiesByGraph,
      entities,
      entity,
      parent,
      entityId,
      isLoading,
      isResolved,
      error,
      select,
      load,
    ]
  )

  return (
    <EntityScopeContext.Provider value={value}>
      {children}
    </EntityScopeContext.Provider>
  )
}

function toContextEntity(entity: LedgerEntitySummary, graphId: string) {
  return {
    identifier: entity.id,
    name: entity.name,
    entityType: entity.entityType ?? undefined,
    parentEntityId: entity.parentEntityId,
    isParent: entity.isParent,
    graphId,
  }
}

/**
 * The entity scope of the selected graph. Outside the provider (a test, a
 * page rendered on its own) it is the group parent: no entity id is sent.
 */
export function useEntityScope(): EntityScope {
  const scope = useContext(EntityScopeContext)
  return scope ?? UNSCOPED
}

const UNSCOPED: EntityScope = {
  entitiesByGraph: new Map(),
  entities: [],
  entity: null,
  parent: null,
  entityId: null,
  isLoading: false,
  isResolved: true,
  error: null,
  select: async () => {},
  refresh: async () => {},
}
