'use client'

import type {
  LibraryArc,
  LibraryClient,
  LibraryStructure,
  LibraryTaxonomy,
} from '@robosystems/client/clients'
import { clients } from '@robosystems/client/clients'
import { Alert, Badge, Card, Select, Spinner } from 'flowbite-react'
import { useEffect, useMemo, useState } from 'react'
import {
  HiChevronDown,
  HiChevronRight,
  HiInformationCircle,
} from 'react-icons/hi'
import { customTheme } from '../../theme'
import { classificationColor } from '../colors'

type ArcType = 'calculation' | 'presentation'
type LoadState = 'idle' | 'loading' | 'ready' | 'error'

/**
 * Arc types the hierarchy view can walk, with the taxonomy-standard suffix
 * that owns each. The calc DAG lives in ``{base}-calculations`` and the
 * presentation networks in ``{base}-presentation`` — the arcs are NOT on the
 * base reporting taxonomy, so we resolve the owning taxonomy by name. The
 * general-special / type-subtype lattice is intentionally not exposed here:
 * it's substrate (render fallback + classification), not a curated browse.
 */
const ARC_TYPES: { value: ArcType; label: string; suffix: string }[] = [
  { value: 'presentation', label: 'Presentation', suffix: 'presentation' },
  { value: 'calculation', label: 'Calculation', suffix: 'calculations' },
]

/**
 * Keep only genuine reporting styles in the structure picker. The arc-owning
 * taxonomy also carries two kinds of structure that aren't styles:
 *  • the empty seed-time catch-all (blockType 'custom', 0 arcs); and
 *  • the auto-derived base networks — the type-subtype lattice projected as
 *    presentation (role '…-pres-bs|is|cf'), an exhaustive, unordered substrate
 *    the curated styles are carved from, not a statement layout.
 * Both are substrate, not something to scope a view to.
 */
function isReportingStyle(s: LibraryStructure): boolean {
  if (s.blockType === 'custom') return false
  return !/-pres-(bs|is|cf)$/i.test(s.roleUri ?? '')
}

/**
 * Order reporting styles by financial-statement sequence (BS → IS → SE → CF)
 * instead of the backend's name order. ``block_type`` encodes the statement;
 * the sort is stable, so styles within one statement keep their seed order and
 * non-statement structures (calc rules, disclosure tables) keep theirs.
 */
const STATEMENT_ORDER: Record<string, number> = {
  balance_sheet: 0,
  income_statement: 1,
  equity_statement: 2,
  cash_flow_statement: 3,
}

function byStatementOrder(a: LibraryStructure, b: LibraryStructure): number {
  return (
    (STATEMENT_ORDER[a.blockType] ?? 99) - (STATEMENT_ORDER[b.blockType] ?? 99)
  )
}

/**
 * The structure to land on for a given arc type. Presentation opens on a
 * coherent statement — the balance sheet — rather than "All structures",
 * whose union blends every statement (and the base networks) into an
 * incoherent multi-root tree. Calculation defaults to "All structures"
 * (null): there the union IS the single coherent calc DAG.
 */
function defaultStructureId(
  arcType: ArcType,
  structures: LibraryStructure[]
): string | null {
  if (arcType !== 'presentation') return null
  return structures.find((s) => s.blockType === 'balance_sheet')?.id ?? null
}

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

/**
 * A Chart of Accounts has no presentation/calc arcs — its hierarchy is the
 * account parent/sub-account tree. The backend's ``getAccountTree`` returns it
 * fully built and filtered to active accounts, so we map its nodes onto the
 * shared ``TreeNode`` shape and order them the same way the Chart of Accounts
 * page does. (Typed loosely because the GraphQL codegen caps the recursive
 * ``children`` type at a fixed depth, which a recursive map can't satisfy.)
 */
interface AccountTreeNodeLike {
  id: string
  code?: string | null
  name?: string | null
  trait?: string | null
  accountType?: string | null
  children?: AccountTreeNodeLike[] | null
}

// QB's standard CoA ordering by AccountType — kept in lockstep with the Chart
// of Accounts page (ledger/chart-of-accounts). Type-first (not code-first)
// because QB returns code == account name when account-numbering is off (the
// sandbox default), which would otherwise degrade to alphabetic-by-name and
// lose the asset → liability → equity → income → expense grouping.
const ACCOUNT_TYPE_ORDER: Record<string, number> = {
  Bank: 0,
  'Accounts Receivable': 1,
  'Other Current Asset': 2,
  'Fixed Asset': 3,
  'Other Asset': 4,
  'Accounts Payable': 5,
  'Credit Card': 6,
  'Other Current Liability': 7,
  'Long Term Liability': 8,
  Equity: 9,
  Income: 10,
  'Cost of Goods Sold': 11,
  Expense: 12,
  'Other Income': 13,
  'Other Expense': 14,
}

function compareAccountNodes(
  a: AccountTreeNodeLike,
  b: AccountTreeNodeLike
): number {
  const ta = ACCOUNT_TYPE_ORDER[a.accountType || ''] ?? 99
  const tb = ACCOUNT_TYPE_ORDER[b.accountType || ''] ?? 99
  if (ta !== tb) return ta - tb
  const ca = a.code ?? ''
  const cb = b.code ?? ''
  if (ca !== cb) return ca.localeCompare(cb, undefined, { numeric: true })
  return (a.name ?? '').localeCompare(b.name ?? '')
}

function mapAccountNode(n: AccountTreeNodeLike): TreeNode {
  return {
    id: n.id,
    qname: n.code ?? null,
    name: n.name ?? null,
    trait: n.trait ?? null,
    isAbstract: false,
    weight: null,
    order: null,
    children: [...(n.children ?? [])]
      .sort(compareAccountNodes)
      .map(mapAccountNode),
  }
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
  selectedTaxonomyId,
  selectedElementId,
  onSelectElement,
}: {
  client: LibraryClient
  graphId: string
  /** All taxonomies visible at this graph_id — used to resolve the arc-owning taxonomy. */
  taxonomies: LibraryTaxonomy[]
  /** Base reporting standard whose hierarchy to show (e.g. "rs-gaap", "fac"). */
  baseStandard: string | null
  /** The selected taxonomy id — drives the Chart-of-Accounts parent_id tree. */
  selectedTaxonomyId: string | null
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
  // The taxonomy id the current `structures` + `structureId` belong to. Gates
  // arc-loading until the structure list (and its default selection) catches up
  // with a new arc type, so we never fetch the "All structures" union as an
  // intermediate state when entering Presentation.
  const [structuresTaxonomyId, setStructuresTaxonomyId] = useState<
    string | null
  >(null)
  const [coaForest, setCoaForest] = useState<TreeNode[]>([])

  // A Chart of Accounts has no presentation/calc arcs — its hierarchy is the
  // account parent/sub-account tree carried on each element's parentId. Detect
  // it from the selected taxonomy's type and render that tree instead.
  const isCoa = useMemo(
    () =>
      taxonomies.find((t) => t.id === selectedTaxonomyId)?.taxonomyType ===
      'chart_of_accounts',
    [taxonomies, selectedTaxonomyId]
  )

  // Resolve the taxonomy that owns this arc type for the chosen base standard.
  const arcTaxonomy = useMemo(() => {
    if (!baseStandard) return null
    const suffix = ARC_TYPES.find((t) => t.value === arcType)?.suffix
    return (
      taxonomies.find((t) => t.standard === `${baseStandard}-${suffix}`) ?? null
    )
  }, [taxonomies, baseStandard, arcType])

  // Load the structure list for the picker whenever the owning taxonomy
  // changes, then select the per-arc-type default structure.
  useEffect(() => {
    if (!arcTaxonomy) {
      setStructures([])
      setStructureId(null)
      setStructuresTaxonomyId(null)
      return
    }
    let cancelled = false
    client
      .listLibraryStructures(graphId, { taxonomyId: arcTaxonomy.id })
      .then((rows) => {
        if (cancelled) return
        const filtered = rows.filter(isReportingStyle).sort(byStatementOrder)
        setStructures(filtered)
        setStructureId(defaultStructureId(arcType, filtered))
        setStructuresTaxonomyId(arcTaxonomy.id)
      })
      .catch((err) => {
        // Non-fatal: the tree still loads with "All structures"; the picker
        // just won't appear. Log so the absence is diagnosable.
        if (!cancelled) {
          console.error('[LibraryHierarchy] failed to load structures', err)
          setStructures([])
          setStructureId(null)
          setStructuresTaxonomyId(arcTaxonomy.id)
        }
      })
    return () => {
      cancelled = true
    }
  }, [client, graphId, arcTaxonomy, arcType])

  // Load arcs for the selected taxonomy + arc type (+ optional structure scope).
  useEffect(() => {
    if (isCoa) return // CoA uses the parentId tree below, not arcs.
    if (!arcTaxonomy) {
      setArcs([])
      setState('ready')
      return
    }
    // Wait until the structure list (and its default selection) matches this
    // taxonomy — otherwise switching arc types would briefly fetch with a
    // stale / "All structures" scope before the default lands.
    if (structuresTaxonomyId !== arcTaxonomy.id) {
      setState('loading')
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
  }, [
    client,
    graphId,
    arcTaxonomy,
    arcType,
    structureId,
    structuresTaxonomyId,
    isCoa,
  ])

  // Load the Chart of Accounts tree — the backend returns it built and
  // active-only (same source as the Chart of Accounts page); we re-order it by
  // AccountType so the layout matches that page rather than the backend's code
  // order (which degrades to alphabetic-by-name when account numbering is off).
  useEffect(() => {
    if (!isCoa) {
      setCoaForest([])
      return
    }
    let cancelled = false
    setState('loading')
    setError(null)
    clients.ledger
      .getAccountTree(graphId)
      .then((tree) => {
        if (cancelled) return
        const roots = (tree?.roots ?? []) as AccountTreeNodeLike[]
        setCoaForest([...roots].sort(compareAccountNodes).map(mapAccountNode))
        setState('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load accounts')
        setState('error')
      })
    return () => {
      cancelled = true
    }
  }, [isCoa, graphId])

  const forest = useMemo(
    () => (isCoa ? coaForest : buildForest(arcs)),
    [isCoa, coaForest, arcs]
  )

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

  const showWeights = !isCoa && arcType === 'calculation'

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
          {!isCoa && (
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
          )}
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
        {state === 'ready' && !isCoa && !arcTaxonomy && (
          <Alert color="info" icon={HiInformationCircle}>
            No {ARC_TYPES.find((t) => t.value === arcType)?.label.toLowerCase()}{' '}
            hierarchy is published for{' '}
            <span className="font-mono">{baseStandard ?? 'this taxonomy'}</span>
            .
          </Alert>
        )}
        {state === 'ready' && !isCoa && arcTaxonomy && forest.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No arcs in this hierarchy.
          </p>
        )}
        {state === 'ready' && isCoa && forest.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No accounts in this chart of accounts.
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
            aria-label={isCollapsed ? `Expand ${label}` : `Collapse ${label}`}
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
