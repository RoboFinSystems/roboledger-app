'use client'

import type {
  LibraryArc,
  LibraryClient,
  LibraryStructureDetail,
} from '@robosystems/client/clients'
import { Alert, Badge, Card, Spinner } from 'flowbite-react'
import { useEffect, useMemo, useState } from 'react'
import {
  HiChevronDown,
  HiChevronRight,
  HiInformationCircle,
} from 'react-icons/hi'
import { customTheme } from '../../theme'
import { arcTypeColor } from '../colors'

type LoadState = 'idle' | 'loading' | 'ready' | 'error'

const ARC_PAGE_SIZE = 500

interface ElementMeta {
  id: string
  qname: string | null
  name: string | null
}

interface RowSpec {
  /** Unique row id within the rendered tree (parentId/childId composite). */
  rowKey: string
  elementId: string
  qname: string | null
  name: string | null
  depth: number
  /** Arc that connects parent → this element. Null on roots. */
  arc: LibraryArc | null
  /** Children to expand under this row. Empty when leaf or cycle. */
  children: RowSpec[]
  /** Number of distinct parents this element appears under across the structure. */
  parentCount: number
  /** True when this row is the recurrence of an ancestor in the same DFS path. */
  isCycleEdge: boolean
}

interface BuildResult {
  roots: RowSpec[]
  totalNodes: number
  multiParentCount: number
  cycleCount: number
  hasArcs: boolean
}

function compareArcs(a: LibraryArc, b: LibraryArc): number {
  const av = a.orderValue ?? Number.POSITIVE_INFINITY
  const bv = b.orderValue ?? Number.POSITIVE_INFINITY
  if (av !== bv) return av - bv
  return (a.toElementQname ?? '').localeCompare(b.toElementQname ?? '')
}

function buildTree(arcs: LibraryArc[]): BuildResult {
  if (arcs.length === 0) {
    return {
      roots: [],
      totalNodes: 0,
      multiParentCount: 0,
      cycleCount: 0,
      hasArcs: false,
    }
  }

  const childrenByParent = new Map<string, LibraryArc[]>()
  const parentsOf = new Map<string, Set<string>>()
  const elementMeta = new Map<string, ElementMeta>()
  const allFromIds = new Set<string>()
  const allToIds = new Set<string>()

  for (const arc of arcs) {
    allFromIds.add(arc.fromElementId)
    allToIds.add(arc.toElementId)
    elementMeta.set(arc.fromElementId, {
      id: arc.fromElementId,
      qname: arc.fromElementQname ?? null,
      name: arc.fromElementName ?? null,
    })
    elementMeta.set(arc.toElementId, {
      id: arc.toElementId,
      qname: arc.toElementQname ?? null,
      name: arc.toElementName ?? null,
    })
    if (!childrenByParent.has(arc.fromElementId)) {
      childrenByParent.set(arc.fromElementId, [])
    }
    childrenByParent.get(arc.fromElementId)!.push(arc)
    if (!parentsOf.has(arc.toElementId)) {
      parentsOf.set(arc.toElementId, new Set())
    }
    parentsOf.get(arc.toElementId)!.add(arc.fromElementId)
  }

  for (const list of childrenByParent.values()) {
    list.sort(compareArcs)
  }

  const rootIds = [...allFromIds].filter((id) => !allToIds.has(id))
  rootIds.sort((a, b) => {
    const aq = elementMeta.get(a)?.qname ?? ''
    const bq = elementMeta.get(b)?.qname ?? ''
    return aq.localeCompare(bq)
  })

  let totalNodes = 0
  let cycleCount = 0
  const visitedNodes = new Set<string>()

  function buildRow(
    elementId: string,
    parentArc: LibraryArc | null,
    parentRowKey: string,
    depth: number,
    pathSoFar: Set<string>
  ): RowSpec {
    const meta = elementMeta.get(elementId)
    const rowKey = `${parentRowKey}/${elementId}`
    const isCycleEdge = pathSoFar.has(elementId)
    if (!visitedNodes.has(elementId)) {
      visitedNodes.add(elementId)
      totalNodes += 1
    }
    if (isCycleEdge) {
      cycleCount += 1
      return {
        rowKey,
        elementId,
        qname: meta?.qname ?? null,
        name: meta?.name ?? null,
        depth,
        arc: parentArc,
        children: [],
        parentCount: parentsOf.get(elementId)?.size ?? 0,
        isCycleEdge: true,
      }
    }
    const childArcs = childrenByParent.get(elementId) ?? []
    const nextPath = new Set(pathSoFar)
    nextPath.add(elementId)
    const children = childArcs.map((arc) =>
      buildRow(arc.toElementId, arc, rowKey, depth + 1, nextPath)
    )
    return {
      rowKey,
      elementId,
      qname: meta?.qname ?? null,
      name: meta?.name ?? null,
      depth,
      arc: parentArc,
      children,
      parentCount: parentsOf.get(elementId)?.size ?? 0,
      isCycleEdge: false,
    }
  }

  const roots = rootIds.map((id) => buildRow(id, null, '', 0, new Set()))

  let multiParentCount = 0
  for (const parents of parentsOf.values()) {
    if (parents.size > 1) multiParentCount += 1
  }

  return {
    roots,
    totalNodes,
    multiParentCount,
    cycleCount,
    hasArcs: true,
  }
}

interface TreeRowProps {
  row: RowSpec
  expanded: Set<string>
  toggle: (rowKey: string) => void
  onSelectElement?: (id: string) => void
  selectedElementId: string | null
}

function TreeRow({
  row,
  expanded,
  toggle,
  onSelectElement,
  selectedElementId,
}: TreeRowProps) {
  const isOpen = expanded.has(row.rowKey)
  const hasChildren = row.children.length > 0
  const isSelected = row.elementId === selectedElementId
  const arcType = row.arc?.associationType ?? null
  const weight = row.arc?.weight ?? null
  const orderValue = row.arc?.orderValue ?? null

  return (
    <li>
      <div
        className={`group flex items-start gap-2 rounded px-2 py-1 text-sm ${
          row.isCycleEdge
            ? 'bg-red-50 dark:bg-red-900/20'
            : isSelected
              ? 'bg-blue-100 dark:bg-blue-900/40'
              : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'
        }`}
        style={{ paddingLeft: `${row.depth * 16 + 4}px` }}
      >
        <button
          type="button"
          onClick={() => hasChildren && !row.isCycleEdge && toggle(row.rowKey)}
          className="mt-0.5 shrink-0 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          aria-label={isOpen ? 'Collapse' : 'Expand'}
          disabled={!hasChildren || row.isCycleEdge}
        >
          {hasChildren && !row.isCycleEdge ? (
            isOpen ? (
              <HiChevronDown className="h-4 w-4" />
            ) : (
              <HiChevronRight className="h-4 w-4" />
            )
          ) : (
            <span className="inline-block h-4 w-4" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onSelectElement?.(row.elementId)}
          className="flex flex-1 flex-col gap-0.5 text-left"
        >
          <div className="flex items-center gap-2">
            <span
              className="truncate font-mono text-sm text-gray-800 dark:text-gray-100"
              title={row.qname ?? row.elementId}
            >
              {row.qname ?? row.elementId}
            </span>
            {row.isCycleEdge && (
              <Badge color="failure" size="xs">
                cycle
              </Badge>
            )}
            {row.parentCount > 1 && !row.isCycleEdge && (
              <Badge
                color="gray"
                size="xs"
                title={`Contributes to ${row.parentCount} subtotals`}
              >
                contributes to {row.parentCount} subtotals
              </Badge>
            )}
          </div>
          {row.name && (
            <span
              className="truncate text-xs text-gray-500 dark:text-gray-400"
              title={row.name}
            >
              {row.name}
            </span>
          )}
        </button>

        <div className="flex shrink-0 items-center gap-1 text-xs">
          {arcType && (
            <Badge color={arcTypeColor(arcType)} size="xs">
              {arcType}
            </Badge>
          )}
          {weight !== null && weight !== undefined && (
            <span className="font-mono text-gray-600 tabular-nums dark:text-gray-300">
              {weight > 0 ? '+' : ''}
              {weight.toFixed(2)}
            </span>
          )}
          {orderValue !== null && orderValue !== undefined && (
            <span className="font-mono text-gray-400 dark:text-gray-500">
              #{orderValue}
            </span>
          )}
        </div>
      </div>

      {hasChildren && isOpen && (
        <ul>
          {row.children.map((child) => (
            <TreeRow
              key={child.rowKey}
              row={child}
              expanded={expanded}
              toggle={toggle}
              onSelectElement={onSelectElement}
              selectedElementId={selectedElementId}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

export function StructureTreeView({
  client,
  graphId,
  taxonomyId,
  structureId,
  onSelectElement,
  selectedElementId,
}: {
  client: LibraryClient
  graphId: string
  taxonomyId: string | null
  structureId: string | null
  onSelectElement?: (id: string) => void
  selectedElementId: string | null
}) {
  const [structure, setStructure] = useState<LibraryStructureDetail | null>(
    null
  )
  const [arcs, setArcs] = useState<LibraryArc[]>([])
  const [state, setState] = useState<LoadState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!structureId || !taxonomyId) {
      setStructure(null)
      setArcs([])
      setState('idle')
      return
    }
    let cancelled = false
    setState('loading')
    setError(null)

    const run = async () => {
      try {
        const allArcs: LibraryArc[] = []
        let offset = 0
        // Page through arcs until we've drained the structure.
        while (true) {
          const page = await client.listLibraryTaxonomyArcs(
            graphId,
            taxonomyId,
            { structureId, limit: ARC_PAGE_SIZE, offset }
          )
          allArcs.push(...page.arcs)
          if (page.arcs.length < ARC_PAGE_SIZE) break
          offset += ARC_PAGE_SIZE
        }
        const meta = await client.getLibraryStructure(graphId, structureId)
        if (cancelled) return
        setStructure(meta)
        setArcs(allArcs)
        setState('ready')
      } catch (err) {
        if (cancelled) return
        setError(
          err instanceof Error ? err.message : 'Failed to load structure'
        )
        setState('error')
      }
    }
    run()

    return () => {
      cancelled = true
    }
  }, [client, graphId, taxonomyId, structureId])

  const tree = useMemo(() => buildTree(arcs), [arcs])

  // Default-expand roots when the tree changes.
  useEffect(() => {
    if (tree.roots.length === 0) {
      setExpanded(new Set())
      return
    }
    setExpanded(new Set(tree.roots.map((r) => r.rowKey)))
  }, [tree])

  const toggle = (rowKey: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(rowKey)) next.delete(rowKey)
      else next.add(rowKey)
      return next
    })
  }

  return (
    <section className="col-span-12 min-h-0 md:col-span-6">
      <Card
        theme={customTheme.card}
        className="flex h-full flex-col overflow-hidden"
      >
        <div className="shrink-0">
          <h2 className="font-heading text-lg font-semibold text-gray-900 dark:text-white">
            {structure?.name ?? 'Structure tree'}
          </h2>
          {structure && (
            <p className="mt-0.5 truncate font-mono text-xs text-gray-500 dark:text-gray-400">
              {structure.roleUri ?? structure.id}
            </p>
          )}
        </div>

        {state === 'idle' && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Pick a structure to render its hierarchy.
          </p>
        )}
        {state === 'loading' && (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Spinner size="sm" /> Loading…
          </div>
        )}
        {state === 'error' && (
          <Alert color="failure" icon={HiInformationCircle}>
            {error}
          </Alert>
        )}

        {state === 'ready' && (
          <>
            <div className="shrink-0 border-y border-gray-200 py-1.5 text-xs text-gray-500 tabular-nums dark:border-gray-700 dark:text-gray-400">
              {tree.totalNodes} nodes • {tree.roots.length} roots •{' '}
              {tree.multiParentCount} multi-parent (DAG)
              {tree.cycleCount > 0 && (
                <span className="ml-1 font-medium text-red-600 dark:text-red-400">
                  • {tree.cycleCount} cycle{tree.cycleCount === 1 ? '' : 's'}
                </span>
              )}
            </div>

            {!tree.hasArcs && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This structure has no arcs.
              </p>
            )}

            {tree.roots.length === 0 && tree.hasArcs && (
              <Alert color="warning" icon={HiInformationCircle}>
                No roots found — every node is a target of some arc, suggesting
                a cycle at the structure root. Inspect arcs directly to debug.
              </Alert>
            )}

            <ul className="min-h-0 flex-1 overflow-y-auto">
              {tree.roots.map((root) => (
                <TreeRow
                  key={root.rowKey}
                  row={root}
                  expanded={expanded}
                  toggle={toggle}
                  onSelectElement={onSelectElement}
                  selectedElementId={selectedElementId}
                />
              ))}
            </ul>
          </>
        )}
      </Card>
    </section>
  )
}
