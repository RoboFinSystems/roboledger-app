'use client'

import type {
  LibraryArc,
  LibraryClient,
  LibraryStructure,
  LibraryTaxonomy,
} from '@robosystems/client/clients'
import { Alert, Badge, Card, Select, Spinner } from 'flowbite-react'
import { useEffect, useMemo, useState } from 'react'
import {
  HiChevronDown,
  HiChevronRight,
  HiInformationCircle,
} from 'react-icons/hi'
import { customTheme } from '../../theme'
import { classificationColor } from '../colors'

type ArcType = 'calculation' | 'presentation' | 'general-special'
type LoadState = 'idle' | 'loading' | 'ready' | 'error'

/**
 * Arc types the hierarchy view can walk, with the taxonomy-standard
 * suffix that owns each. The calc DAG lives in ``{base}-calculations``,
 * presentation networks in ``{base}-presentation``, the general-special
 * (type/subtype) lattice in ``{base}-type-subtype`` — the arcs are NOT on
 * the base reporting taxonomy, so we resolve the owning taxonomy by name.
 */
const ARC_TYPES: { value: ArcType; label: string; suffix: string }[] = [
  { value: 'calculation', label: 'Calculation', suffix: 'calculations' },
  { value: 'presentation', label: 'Presentation', suffix: 'presentation' },
  { value: 'general-special', label: 'Type–subtype', suffix: 'type-subtype' },
]

const INITIAL_EXPAND_DEPTH = 2
const FETCH_PAGE = 1000

interface TreeNode {
  id: string
  qname: string | null
  name: string | null
  trait: string | null
  isAbstract: boolean
  /** Calc weight on the edge from this node's parent (+1 / -1). */
  weight: number | null
  order: number | null
  children: TreeNode[]
}

/** Fetch every arc for a taxonomy+type(+structure), paging past the cap. */
async function fetchAllArcs(
  client: LibraryClient,
  graphId: string,
  taxonomyId: string,
  associationType: ArcType,
  structureId: string | null
): Promise<LibraryArc[]> {
  const all: LibraryArc[] = []
  let offset = 0
  // Guard against a runaway loop if count is ever inconsistent.
  for (let page = 0; page < 50; page++) {
    const { arcs, count } = await client.listLibraryTaxonomyArcs(
      graphId,
      taxonomyId,
      {
        associationType,
        structureId: structureId ?? undefined,
        limit: FETCH_PAGE,
        offset,
      }
    )
    all.push(...arcs)
    if (arcs.length === 0 || all.length >= count) break
    offset += FETCH_PAGE
  }
  return all
}

/** Assemble a forest from a flat arc list (roots = a `from` that's never a `to`). */
function buildForest(arcs: LibraryArc[]): TreeNode[] {
  const meta = new Map<
    string,
    {
      qname: string | null
      name: string | null
      trait: string | null
      isAbstract: boolean
    }
  >()
  const childEdges = new Map<
    string,
    { childId: string; weight: number | null; order: number | null }[]
  >()
  const froms = new Set<string>()
  const tos = new Set<string>()

  for (const a of arcs) {
    if (!a.fromElementId || !a.toElementId) continue
    meta.set(a.fromElementId, {
      qname: a.fromElementQname,
      name: a.fromElementName,
      trait: a.fromElementTrait,
      isAbstract: a.fromElementIsAbstract ?? false,
    })
    meta.set(a.toElementId, {
      qname: a.toElementQname,
      name: a.toElementName,
      trait: a.toElementTrait,
      isAbstract: a.toElementIsAbstract ?? false,
    })
    froms.add(a.fromElementId)
    tos.add(a.toElementId)
    const edges = childEdges.get(a.fromElementId) ?? []
    // Dedupe by target — the same parent→child arc recurs across structures
    // (the "All structures" blend), which would otherwise render duplicate
    // sibling nodes (and collide on React keys).
    if (!edges.some((e) => e.childId === a.toElementId)) {
      edges.push({
        childId: a.toElementId,
        weight: a.weight,
        order: a.orderValue,
      })
      childEdges.set(a.fromElementId, edges)
    }
  }

  const node = (
    id: string,
    weight: number | null,
    order: number | null,
    seen: Set<string>
  ): TreeNode => {
    const m = meta.get(id)
    const self: TreeNode = {
      id,
      qname: m?.qname ?? null,
      name: m?.name ?? null,
      trait: m?.trait ?? null,
      isAbstract: m?.isAbstract ?? false,
      weight,
      order,
      children: [],
    }
    if (seen.has(id)) return self // cycle guard
    const next = new Set(seen)
    next.add(id)
    const edges = [...(childEdges.get(id) ?? [])].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0)
    )
    self.children = edges.map((e) => node(e.childId, e.weight, e.order, next))
    return self
  }

  const roots = [...froms]
    .filter((id) => !tos.has(id))
    .sort((a, b) =>
      (meta.get(a)?.qname ?? '').localeCompare(meta.get(b)?.qname ?? '')
    )
  return roots.map((id) => node(id, null, null, new Set()))
}

/** Node ids deeper than INITIAL_EXPAND_DEPTH — collapsed on first render. */
function deepNodeIds(forest: TreeNode[]): Set<string> {
  const out = new Set<string>()
  const walk = (n: TreeNode, depth: number) => {
    if (depth >= INITIAL_EXPAND_DEPTH && n.children.length > 0) out.add(n.id)
    n.children.forEach((c) => walk(c, depth + 1))
  }
  forest.forEach((r) => walk(r, 0))
  return out
}

export function LibraryHierarchy({
  client,
  graphId,
  taxonomies,
  baseStandard,
  selectedElementId,
  onSelectElement,
}: {
  client: LibraryClient
  graphId: string
  /** All taxonomies visible at this graph_id — used to resolve the arc-owning taxonomy. */
  taxonomies: LibraryTaxonomy[]
  /** Base reporting standard whose hierarchy to show (e.g. "rs-gaap", "fac"). */
  baseStandard: string | null
  selectedElementId: string | null
  onSelectElement: (id: string) => void
}) {
  const [arcType, setArcType] = useState<ArcType>('presentation')
  const [structures, setStructures] = useState<LibraryStructure[]>([])
  const [structureId, setStructureId] = useState<string | null>(null)
  const [arcs, setArcs] = useState<LibraryArc[]>([])
  const [state, setState] = useState<LoadState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  // Resolve the taxonomy that owns this arc type for the chosen base standard.
  const arcTaxonomy = useMemo(() => {
    if (!baseStandard) return null
    const suffix = ARC_TYPES.find((t) => t.value === arcType)?.suffix
    return (
      taxonomies.find((t) => t.standard === `${baseStandard}-${suffix}`) ?? null
    )
  }, [taxonomies, baseStandard, arcType])

  // Load the structure list for the picker whenever the owning taxonomy changes.
  useEffect(() => {
    setStructureId(null)
    if (!arcTaxonomy) {
      setStructures([])
      return
    }
    let cancelled = false
    client
      .listLibraryStructures(graphId, { taxonomyId: arcTaxonomy.id })
      .then((rows) => {
        if (!cancelled) setStructures(rows)
      })
      .catch((err) => {
        // Non-fatal: the tree still loads with "All structures"; the picker
        // just won't appear. Log so the absence is diagnosable.
        if (!cancelled) {
          console.error('[LibraryHierarchy] failed to load structures', err)
          setStructures([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [client, graphId, arcTaxonomy])

  // Load arcs for the selected taxonomy + arc type (+ optional structure scope).
  useEffect(() => {
    if (!arcTaxonomy) {
      setArcs([])
      setState('ready')
      return
    }
    let cancelled = false
    setState('loading')
    setError(null)
    fetchAllArcs(client, graphId, arcTaxonomy.id, arcType, structureId)
      .then((rows) => {
        if (cancelled) return
        setArcs(rows)
        setState('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setError(
          err instanceof Error ? err.message : 'Failed to load hierarchy'
        )
        setState('error')
      })
    return () => {
      cancelled = true
    }
  }, [client, graphId, arcTaxonomy, arcType, structureId])

  const forest = useMemo(() => buildForest(arcs), [arcs])

  // Reset the collapse state to the default expand depth on each new forest.
  useEffect(() => {
    setCollapsed(deepNodeIds(forest))
  }, [forest])

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const showWeights = arcType === 'calculation'

  return (
    <section className="col-span-12 min-h-0 md:col-span-5">
      <Card
        theme={customTheme.card}
        className="flex h-full flex-col overflow-hidden"
      >
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-lg font-semibold text-gray-900 dark:text-white">
            Hierarchy
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <div
              className="flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
              role="group"
              aria-label="Arc type"
            >
              {ARC_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setArcType(t.value)}
                  aria-pressed={arcType === t.value}
                  className={`px-3 py-1 text-xs font-medium transition-colors ${
                    arcType === t.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {structures.length > 0 && (
              <Select
                sizing="sm"
                value={structureId ?? ''}
                onChange={(e) => setStructureId(e.target.value || null)}
                aria-label="Structure"
              >
                <option value="">All structures</option>
                {structures.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            )}
          </div>
        </div>

        {state === 'loading' && (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Spinner size="sm" /> Loading hierarchy…
          </div>
        )}
        {state === 'error' && (
          <Alert color="failure" icon={HiInformationCircle}>
            {error}
          </Alert>
        )}
        {state === 'ready' && !arcTaxonomy && (
          <Alert color="info" icon={HiInformationCircle}>
            No {ARC_TYPES.find((t) => t.value === arcType)?.label.toLowerCase()}{' '}
            hierarchy is published for{' '}
            <span className="font-mono">{baseStandard ?? 'this taxonomy'}</span>
            .
          </Alert>
        )}
        {state === 'ready' && arcTaxonomy && forest.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No arcs in this hierarchy.
          </p>
        )}

        {state === 'ready' && forest.length > 0 && (
          <div
            role="tree"
            aria-label="Taxonomy hierarchy"
            className="min-h-0 flex-1 overflow-auto pr-1 font-mono text-sm"
          >
            {forest.map((root) => (
              <HierarchyRow
                key={root.id}
                path={root.id}
                node={root}
                depth={0}
                showWeights={showWeights}
                collapsed={collapsed}
                onToggle={toggle}
                selectedElementId={selectedElementId}
                onSelectElement={onSelectElement}
              />
            ))}
          </div>
        )}
      </Card>
    </section>
  )
}

function HierarchyRow({
  node,
  path,
  depth,
  showWeights,
  collapsed,
  onToggle,
  selectedElementId,
  onSelectElement,
}: {
  node: TreeNode
  /** Unique root-to-node path — stable React key in a DAG where an element
   * can appear under multiple parents. */
  path: string
  depth: number
  showWeights: boolean
  collapsed: Set<string>
  onToggle: (id: string) => void
  selectedElementId: string | null
  onSelectElement: (id: string) => void
}) {
  const hasChildren = node.children.length > 0
  const isCollapsed = collapsed.has(node.id)
  const isSelected = node.id === selectedElementId
  const label = node.name ?? node.qname ?? node.id

  return (
    <div
      role="treeitem"
      aria-level={depth + 1}
      aria-selected={isSelected}
      aria-expanded={hasChildren ? !isCollapsed : undefined}
    >
      <div
        className={`flex items-center gap-1 rounded px-1 py-0.5 ${
          isSelected
            ? 'bg-blue-100 dark:bg-blue-900/50'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        style={{ paddingLeft: `${depth * 16}px` }}
      >
        {hasChildren ? (
          <button
            onClick={() => onToggle(node.id)}
            className="shrink-0 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            aria-label={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? (
              <HiChevronRight className="h-4 w-4" />
            ) : (
              <HiChevronDown className="h-4 w-4" />
            )}
          </button>
        ) : (
          <span className="inline-block w-4 shrink-0" />
        )}

        {showWeights && node.weight != null && (
          <span
            className={`w-3 shrink-0 text-center font-bold ${
              node.weight >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
            title={`calc weight ${node.weight}`}
          >
            {node.weight >= 0 ? '+' : '−'}
          </span>
        )}

        <button
          onClick={() => onSelectElement(node.id)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          title={node.qname ?? undefined}
        >
          <span
            className={`truncate ${
              isSelected
                ? 'text-blue-900 dark:text-blue-100'
                : 'text-gray-800 dark:text-gray-100'
            }`}
          >
            {label}
          </span>
          {node.isAbstract ? (
            <Badge color="purple" size="xs" className="shrink-0">
              abstract
            </Badge>
          ) : node.trait ? (
            <Badge
              color={classificationColor(node.trait)}
              size="xs"
              className="shrink-0"
            >
              {node.trait}
            </Badge>
          ) : null}
        </button>
      </div>

      {hasChildren && !isCollapsed && (
        <div role="group">
          {node.children.map((c) => (
            <HierarchyRow
              key={`${path}/${c.id}`}
              path={`${path}/${c.id}`}
              node={c}
              depth={depth + 1}
              showWeights={showWeights}
              collapsed={collapsed}
              onToggle={onToggle}
              selectedElementId={selectedElementId}
              onSelectElement={onSelectElement}
            />
          ))}
        </div>
      )}
    </div>
  )
}
