'use client'

import DocsLink from '@/components/DocsLink'
import {
  FilterActions,
  FilterBar,
  FilterField,
  SearchField,
} from '@/components/FilterBar'
import SegmentedControl from '@/components/SegmentedControl'
import { useEntityScope } from '@/lib/entity-scope'
import type { ElementClassification } from '@/lib/ledger'
import { useLedgerGraph } from '@/lib/useLedgerGraph'
import type {
  LedgerMapping,
  LedgerMappingCoverage,
  LedgerMappingInfo,
} from '@robosystems/client/clients'
import {
  clients,
  EmptyState,
  LoadingState,
  PageHeader,
  PageLayout,
} from '@robosystems/core'
import {
  Badge,
  Button,
  Card,
  Progress,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from '@robosystems/core/ui'
import type { FC } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  HiCheckCircle,
  HiCollection,
  HiExclamationCircle,
  HiPencil,
  HiPlus,
  HiSparkles,
  HiViewList,
  HiX,
} from 'react-icons/hi'
import { MdOutlineAccountBalanceWallet } from 'react-icons/md'

import { apiErrorMessage } from '@/lib/ledger/errors'
import {
  type ChartAccount,
  type EditableChart,
  pickEditableChart,
} from './chartEditing'
import AccountEditorModal from './components/AccountEditorModal'
import { ChartTemplatePicker } from './components/ChartTemplatePicker'

const ELEMENTS_PAGE = 1000

/** Every element of one taxonomy, retired ones included. */
async function listAllElements(graphId: string, taxonomyId: string) {
  const elements = []
  for (let offset = 0; ; offset += ELEMENTS_PAGE) {
    const page = await clients.ledger.listElements(graphId, {
      taxonomyId,
      limit: ELEMENTS_PAGE,
      offset,
      // Left out by default; without them nothing can be reactivated.
      includeInactive: true,
    })
    elements.push(...(page?.elements ?? []))
    if (!page?.pagination.hasMore) return elements
  }
}

/**
 * The chart the account tree came from, read whole so its qnames, parents
 * and retired accounts are in hand. No read names an entity's chart, so it is
 * the graph's chart taxonomy that holds the tree's accounts.
 */
async function loadEditableChart(
  graphId: string,
  treeAccountIds: ReadonlySet<string>
): Promise<EditableChart | 'synced' | null> {
  const taxonomies = await clients.ledger.listTaxonomies(graphId, {
    taxonomyType: 'chart_of_accounts',
  })
  const candidates = await Promise.all(
    taxonomies.map(async (taxonomy) => ({
      taxonomyId: taxonomy.id,
      elements: await listAllElements(graphId, taxonomy.id),
    }))
  )
  return pickEditableChart(candidates, treeAccountIds)
}

const collectIds = (nodes: TreeNode[], into: Set<string>): Set<string> => {
  for (const node of nodes) {
    into.add(node.id)
    if (node.children) collectIds(node.children, into)
  }
  return into
}

const CLASSIFICATION_COLORS: Record<ElementClassification, string> = {
  asset: 'success',
  liability: 'failure',
  equity: 'purple',
  revenue: 'info',
  expense: 'warning',
}

const CLASSIFICATION_LABELS: Record<ElementClassification, string> = {
  asset: 'Asset',
  liability: 'Liability',
  equity: 'Equity',
  revenue: 'Revenue',
  expense: 'Expense',
}

/** "Asset 42" — the count rides along muted, in either segment state. */
const CountLabel: FC<{ text: string; count: number }> = ({ text, count }) => (
  <>
    {text} <span className="ml-0.5 opacity-60">{count}</span>
  </>
)

const ALL_CLASSIFICATIONS: ElementClassification[] = [
  'asset',
  'liability',
  'equity',
  'revenue',
  'expense',
]

interface AccountRow {
  id: string
  code: string | null
  name: string
  classification: ElementClassification
  balance_type: string
  depth: number
  is_active: boolean
  _graphId: string
  _graphName: string
}

interface TreeNode {
  id: string
  code?: string | null
  name: string
  // GraphQL returns the FASB elementsOfFinancialStatements identifier
  // as `trait` ('asset' / 'liability' / ...). The UI surfaces it as
  // `classification` to match the user-facing column header.
  trait: string | null
  accountType?: string | null
  balanceType: string
  depth: number
  isActive: boolean
  children?: TreeNode[]
}

interface GaapMapping {
  gaapName: string
  gaapQname: string
  confidence: number
  associationId: string
  fromElementId: string
  toElementId: string
}

interface AccountMappings {
  rsGaap: GaapMapping | null
}

interface GaapElement {
  id: string
  name: string
  qname: string
  classification: string
}

// QB's standard Chart of Accounts ordering by AccountType
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

// Sort accounts by CoA account_type first (Asset → Liability → Equity →
// Income → COGS → Expense, matching QB's native CoA grouping), then by
// numeric code if the user has set up account numbering (1xxx/2xxx/...),
// then by name as the final tiebreaker.
//
// Account-type comes before code because QB itself returns text codes
// equal to the account name when account-numbering is disabled (the
// default for new sandboxes). In that case sorting by code degenerates
// to alphabetic-by-name and customers lose the asset-then-liability
// grouping they expect from a CoA. With type-first, both numbered and
// unnumbered books land on the same shape.
function compareAccountNodes(a: TreeNode, b: TreeNode): number {
  const ta = ACCOUNT_TYPE_ORDER[a.accountType || ''] ?? 99
  const tb = ACCOUNT_TYPE_ORDER[b.accountType || ''] ?? 99
  if (ta !== tb) return ta - tb
  const ca = a.code ?? ''
  const cb = b.code ?? ''
  if (ca !== cb) {
    return ca.localeCompare(cb, undefined, { numeric: true })
  }
  return a.name.localeCompare(b.name)
}

function flattenTree(
  nodes: TreeNode[],
  graphId: string,
  graphName: string
): AccountRow[] {
  const result: AccountRow[] = []
  for (const node of nodes) {
    result.push({
      id: node.id,
      code: node.code ?? null,
      name: node.name,
      classification: (node.trait ?? '') as ElementClassification,
      balance_type: node.balanceType,
      depth: node.depth,
      is_active: node.isActive,
      _graphId: graphId,
      _graphName: graphName,
    })
    if (node.children && node.children.length > 0) {
      const sortedChildren = [...node.children].sort(compareAccountNodes)
      result.push(...flattenTree(sortedChildren, graphId, graphName))
    }
  }
  return result
}

// ── Inline GAAP Dropdown ──────────────────────────────────────────────────

function GaapDropdown({
  accountClassification,
  gaapElements,
  currentMapping,
  onSelect,
  onClear,
  onClose,
}: {
  accountClassification: string
  gaapElements: GaapElement[]
  currentMapping: GaapMapping | null
  onSelect: (element: GaapElement) => void
  onClear: () => void
  onClose: () => void
}) {
  const [search, setSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  // Group and sort: matching classification first, then alphabetical by class name
  const grouped = useMemo(() => {
    const filtered = gaapElements.filter(
      (el) =>
        search === '' ||
        el.name.toLowerCase().includes(search.toLowerCase()) ||
        el.qname.toLowerCase().includes(search.toLowerCase())
    )

    // Collect all unique classifications present in this element set
    const allClasses = Array.from(
      new Set(filtered.map((el) => el.classification).filter(Boolean))
    ).sort((a, b) => {
      if (a === accountClassification) return -1
      if (b === accountClassification) return 1
      return a.localeCompare(b)
    })

    return allClasses
      .map((cls) => ({
        classification: cls,
        elements: filtered
          .filter((el) => el.classification === cls)
          .sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .filter((g) => g.elements.length > 0)
  }, [gaapElements, search, accountClassification])

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 z-30 mt-1 w-96 rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-600 dark:bg-gray-800"
    >
      <div className="border-b border-gray-200 p-2 dark:border-gray-700">
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search GAAP concepts..."
          className="focus:ring-secondary-500 w-full rounded border-0 bg-gray-50 px-3 py-1.5 text-sm focus:ring-1 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
        />
      </div>

      <div className="max-h-64 overflow-y-auto">
        {grouped.map((group) => (
          <div key={group.classification}>
            <div className="sticky top-0 bg-gray-100 px-3 py-1 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:bg-gray-700 dark:text-gray-400">
              {CLASSIFICATION_LABELS[
                group.classification as ElementClassification
              ] ||
                group.classification.charAt(0).toUpperCase() +
                  group.classification.slice(1)}
              {group.classification === accountClassification && (
                <span className="text-secondary-500 ml-1"> — Best Match</span>
              )}
            </div>
            {group.elements.map((el) => (
              <button
                key={el.id}
                type="button"
                onClick={() => onSelect(el)}
                className="hover:bg-secondary-50 dark:hover:bg-secondary-900/20 w-full px-3 py-2 text-left transition-colors"
              >
                <span className="block text-sm font-medium text-gray-900 dark:text-white">
                  {el.name}
                </span>
                <span className="block font-mono text-xs text-gray-400">
                  {el.qname}
                </span>
              </button>
            ))}
          </div>
        ))}
        {grouped.length === 0 && (
          <div className="px-3 py-4 text-center text-sm text-gray-400">
            No matching concepts
          </div>
        )}
      </div>

      {currentMapping && (
        <div className="border-t border-gray-200 p-2 dark:border-gray-700">
          <button
            type="button"
            onClick={onClear}
            className="flex w-full items-center justify-center gap-1 rounded px-3 py-1.5 text-sm text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <HiX className="h-3 w-3" />
            Clear Mapping
          </button>
        </div>
      )}
    </div>
  )
}

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

const monthLabel = (period: string): string => {
  const [year, month] = period.split('-')
  const name = MONTH_NAMES[Number(month) - 1]
  return name ? `${name} ${year}` : period
}

/**
 * What a move within the statement did to the closed months it reached: live
 * statements read the account on its new line, while the statements saved at
 * each close keep the answer as closed.
 */
export function describeReclassification(
  conceptName: string,
  periods: string[]
): string {
  const sorted = [...periods].sort()
  const span =
    sorted.length === 1
      ? monthLabel(sorted[0])
      : `${monthLabel(sorted[0])} to ${monthLabel(sorted[sorted.length - 1])}`
  const months = sorted.length === 1 ? 'closed month' : 'closed months'
  return (
    `Reclassified. ${sorted.length} ${months} (${span}) now read as ` +
    `${conceptName} on live statements; the statements saved at each ` +
    `close keep the answer as closed.`
  )
}

// ── Main Content ──────────────────────────────────────────────────────────

const ChartOfAccountsContent: FC = function () {
  const [accounts, setAccounts] = useState<AccountRow[]>([])
  // Bumped after `initialize-chart-of-accounts` so the loader below re-runs
  // for the same graph and the new chart replaces the empty state.
  const [reloadKey, setReloadKey] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClassification, setSelectedClassification] =
    useState<ElementClassification | null>(null)

  // Mapping state
  const [mappings, setMappings] = useState<LedgerMappingInfo[]>([])
  const [selectedMappingId, setSelectedMappingId] = useState<string | null>(
    null
  )
  // Which graph the current selectedMappingId came from. Mapping ids are
  // per-graph, so the detail loader uses this to ignore a selection left over
  // from the previously active graph rather than requesting it against the new
  // one.
  const selectedMappingGraphRef = useRef<string | null>(null)
  const [mappingDetail, setMappingDetail] = useState<LedgerMapping | null>(null)
  const [mappingCoverage, setMappingCoverage] =
    useState<LedgerMappingCoverage | null>(null)
  const [isAutoMapping, setIsAutoMapping] = useState(false)
  // Mappings are an audit/curation concern, not an everyday browse one.
  // Default the GAAP Mapping column to hidden so the CoA reads as a clean
  // list of accounts; the user opens it via the toggle when they need to
  // review or edit the FAC / rs-GAAP relationships.
  const [showMappings, setShowMappings] = useState(false)

  // Inline editing state. Mapping is CoA → rs-gaap only; the FAC level is
  // inferred (reverse fac-to-rs-gaap equivalence), never edited here.
  const [rsGaapElements, setRsGaapElements] = useState<GaapElement[]>([])
  const [editingState, setEditingState] = useState<{
    accountId: string
  } | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // The chart editor: the entity's own chart, 'synced' when QuickBooks owns
  // it, null while unresolved or when there is none to edit.
  const [chart, setChart] = useState<EditableChart | 'synced' | null>(null)
  const [editor, setEditor] = useState<{
    account: ChartAccount | null
    step: 'form' | 'retire'
  } | null>(null)

  const { graph: currentGraph } = useLedgerGraph()
  const { entityId, parent } = useEntityScope()
  // The entity whose mapping this chart writes to: unnamed, the list holds
  // every entity's, and a subsidiary's account would land in the parent's.
  const mappingEntityId = entityId ?? parent?.id ?? null
  // The mapping a refresh may write back: an auto-map or a save started on
  // one entity's mapping must not land on the next entity's page.
  const selectedMappingRef = useRef<string | null>(null)
  useEffect(() => {
    selectedMappingRef.current = selectedMappingId
  }, [selectedMappingId])
  // Moves on with the graph or the mapping, so an auto-map still in flight
  // can tell it was started somewhere else — a switch away and back included.
  const autoMapEpochRef = useRef(0)
  useEffect(() => {
    autoMapEpochRef.current++
  }, [currentGraph?.graphId, selectedMappingId])
  // The graph and entity the page last loaded, to tell a switch from a reload.
  const loadedScopeRef = useRef<string | null>(null)

  // Load accounts and mappings
  useEffect(() => {
    if (!currentGraph) {
      setAccounts([])
      setMappings([])
      setSelectedMappingId(null)
      selectedMappingGraphRef.current = null
      setRsGaapElements([])
      setIsLoading(false)
      return
    }

    let cancelled = false
    // Element ids are per-graph rows, so a cached candidate list from another
    // graph must not be reused — mapping a concept from it would write a
    // foreign to_element_id.
    setRsGaapElements([])
    // A switch drops the previous entity's mapping at once, so nothing acts on
    // it while this entity's list loads; a reload keeps it on screen.
    const scopeKey = `${currentGraph.graphId}:${entityId}`
    if (loadedScopeRef.current !== scopeKey) {
      loadedScopeRef.current = scopeKey
      setNotice(null)
      setChart(null)
      setEditor(null)
      setSelectedMappingId(null)
      setMappingDetail(null)
      setMappingCoverage(null)
      setEditingState(null)
      setIsAutoMapping(false)
    }

    const loadData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Load account tree and mappings in parallel
        const [accountTree, mappingList] = await Promise.all([
          clients.ledger.getAccountTree(currentGraph.graphId, { entityId }),
          clients.ledger
            .listMappings(currentGraph.graphId, { entityId: mappingEntityId })
            .catch(() => [] as LedgerMappingInfo[]),
        ])
        if (cancelled) return

        // Process accounts — sort by CoA code first so the list matches
        // the user's CoA numbering scheme (1xxx assets, 2xxx liabilities,
        // 3xxx equity, 4xxx revenue, 5-7xxx expenses). Fall back to QB's
        // account_type ordering when the code is missing, and name as a
        // final tiebreaker.
        if (accountTree) {
          const roots = (accountTree.roots || []) as unknown as TreeNode[]
          roots.sort(compareAccountNodes)
          setAccounts(
            flattenTree(roots, currentGraph.graphId, currentGraph.graphName)
          )
          const treeIds = collectIds(roots, new Set())
          if (treeIds.size > 0) {
            loadEditableChart(currentGraph.graphId, treeIds)
              .then((found) => {
                if (!cancelled) setChart(found)
              })
              .catch((err: unknown) => {
                if (cancelled) return
                console.error('Error loading the chart for editing:', err)
                setChart(null)
              })
          } else {
            setChart(null)
          }
        } else {
          // A graph with no ledger yet returns null; without this the previous
          // graph's accounts stayed on screen under the new selection.
          setAccounts([])
          setChart(null)
        }

        // Process mappings. Always re-seed the selection from this graph's own
        // list — carrying the previous graph's id over pointed getMapping,
        // auto-map and association writes at a mapping from another graph.
        setMappings(mappingList)
        selectedMappingGraphRef.current = currentGraph.graphId
        setSelectedMappingId(mappingList[0]?.id ?? null)
      } catch (err) {
        if (cancelled) return
        console.error('Error loading data:', err)
        setError('Failed to load chart of accounts. Please try again.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadData()
    return () => {
      cancelled = true
    }
  }, [currentGraph, entityId, mappingEntityId, reloadKey])

  // Load mapping detail, coverage, and elements when selected mapping changes
  useEffect(() => {
    // Skip while the selection still refers to the previously active graph:
    // the loader above re-seeds it, and firing now would request this graph's
    // detail using another graph's mapping id.
    if (
      !currentGraph ||
      !selectedMappingId ||
      selectedMappingGraphRef.current !== currentGraph.graphId
    ) {
      setMappingDetail(null)
      setMappingCoverage(null)
      return
    }

    let cancelled = false
    const loadMappingData = async () => {
      try {
        const [detail, coverage, rsGaapResult] = await Promise.all([
          clients.ledger.getMapping(currentGraph.graphId, selectedMappingId),
          clients.ledger
            .getMappingCoverage(currentGraph.graphId, selectedMappingId)
            .catch(() => null),
          // Candidate concepts per EFS classification, limited to those that
          // render under the active Reporting Style (mappingCandidates wraps
          // suggest_mapping_candidates, minus subtotals). One call per trait,
          // combined into the flat list the dropdown groups client-side.
          // Mapping outside this set would land a fact on an unreachable branch.
          // The trait set must match the backend MappingOperator's (it groups
          // CoA elements by their EFS trait); gain/loss are valid CoA traits
          // with their own rs-gaap concepts, so they're fetched too.
          rsGaapElements.length === 0
            ? Promise.all(
                (
                  [
                    'asset',
                    'liability',
                    'equity',
                    'revenue',
                    'expense',
                    'gain',
                    'loss',
                  ] as const
                ).map((cls) =>
                  clients.ledger
                    .getMappingCandidates(currentGraph.graphId, cls, {
                      entityId,
                    })
                    .catch(() => [])
                )
              ).then((lists) => ({ elements: lists.flat() }))
            : null,
        ])
        if (cancelled) return

        setMappingDetail(detail)
        setMappingCoverage(coverage)

        const toGaapElements = (result: unknown) => {
          const data = result as { elements?: Array<Record<string, unknown>> }
          return (data?.elements ?? []).map((e) => ({
            id: e.id as string,
            name: e.name as string,
            qname: (e.qname as string) ?? '',
            // EFS class lives on `trait` (asset/liability/equity/revenue/expense);
            // the legacy `classification` field was removed from the Element type.
            // The dropdown groups by this value, so reading the wrong field left
            // every concept ungrouped → "No matching concepts".
            classification: (e.trait as string) ?? '',
          }))
        }
        if (rsGaapResult) setRsGaapElements(toGaapElements(rsGaapResult))
      } catch (err) {
        if (cancelled) return
        console.error('Error loading mapping detail:', err)
        setMappingDetail(null)
        setMappingCoverage(null)
      }
    }

    loadMappingData()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rsGaapElements intentionally excluded to avoid re-fetching
  }, [currentGraph, entityId, selectedMappingId])

  // Build GAAP lookup from mapping associations, keyed by from_element_id.
  // Mapping is CoA → rs-gaap only. Legacy fac:* associations are skipped so
  // they don't show in the rs-gaap slot; the FAC level is inferred, not edited.
  const gaapByElementId = useMemo(() => {
    const map = new Map<string, AccountMappings>()
    if (!mappingDetail?.associations) return map

    for (const assoc of mappingDetail.associations) {
      const fromId = assoc.fromElementId
      if (!fromId) continue
      if (assoc.toElementQname?.startsWith('fac:')) continue
      const existing = map.get(fromId) ?? { rsGaap: null }
      const mapping: GaapMapping = {
        gaapName: assoc.toElementName ?? '',
        gaapQname: assoc.toElementQname ?? '',
        confidence: assoc.confidence ?? 0,
        associationId: assoc.id,
        fromElementId: fromId,
        toElementId: assoc.toElementId,
      }
      map.set(fromId, { ...existing, rsGaap: mapping })
    }
    return map
  }, [mappingDetail])

  // Refresh mapping detail + coverage
  const refreshMappingData = useCallback(async () => {
    if (!currentGraph || !selectedMappingId) return
    try {
      const [detail, coverage] = await Promise.all([
        clients.ledger.getMapping(currentGraph.graphId, selectedMappingId),
        clients.ledger
          .getMappingCoverage(currentGraph.graphId, selectedMappingId)
          .catch(() => null),
      ])
      if (selectedMappingRef.current !== selectedMappingId) return
      setMappingDetail(detail)
      setMappingCoverage(coverage)
    } catch {
      // ignore
    }
  }, [currentGraph, selectedMappingId])

  // Handle GAAP element selection (fac or rsGaap slot)
  const handleSelectGaap = useCallback(
    async (accountId: string, gaapElement: GaapElement) => {
      if (!currentGraph || !selectedMappingId) return

      setIsSaving(true)
      setError(null)
      setNotice(null)
      try {
        const existing = gaapByElementId.get(accountId)?.rsGaap
        // One write: the old arc goes and the new one is written together, so
        // an account with activity in a closed month is judged as a move (a
        // reclassification within its statement) instead of being refused at
        // a delete that would leave it unmapped.
        const result = await clients.ledger.createMappingAssociation(
          currentGraph.graphId,
          {
            mapping_id: selectedMappingId,
            from_element_id: accountId,
            to_element_id: gaapElement.id,
            confidence: 1.0,
            ...(existing
              ? { replaces_association_id: existing.associationId }
              : {}),
          }
        )
        // A server that does not know the replace field writes the new arc
        // and reports no replacement; the old arc then goes the way it did
        // before, so the page is right against either server.
        if (existing && !result.replaced_association_id) {
          await clients.ledger.deleteMappingAssociation(currentGraph.graphId, {
            mapping_id: selectedMappingId,
            association_id: existing.associationId,
          })
        }
        const reclassified = result.reclassified_periods ?? []
        if (reclassified.length > 0) {
          setNotice(describeReclassification(gaapElement.name, reclassified))
        }

        await refreshMappingData()
        setEditingState(null)
      } catch (err) {
        console.error('Failed to save mapping:', err)
        setError(apiErrorMessage(err, 'Failed to save mapping.'))
        await refreshMappingData()
      } finally {
        setIsSaving(false)
      }
    },
    [currentGraph, selectedMappingId, gaapByElementId, refreshMappingData]
  )

  // Handle clear mapping (rs-gaap)
  const handleClearMapping = useCallback(
    async (accountId: string) => {
      if (!currentGraph || !selectedMappingId) return

      const accountMappings = gaapByElementId.get(accountId)
      const existing = accountMappings?.rsGaap
      if (!existing) return

      setIsSaving(true)
      try {
        await clients.ledger.deleteMappingAssociation(currentGraph.graphId, {
          mapping_id: selectedMappingId,
          association_id: existing.associationId,
        })
        await refreshMappingData()
        setEditingState(null)
      } catch (err) {
        console.error('Failed to clear mapping:', err)
        setError(apiErrorMessage(err, 'Failed to clear mapping.'))
      } finally {
        setIsSaving(false)
      }
    },
    [currentGraph, selectedMappingId, gaapByElementId, refreshMappingData]
  )

  // Auto-map handler
  const handleAutoMap = useCallback(async () => {
    if (!currentGraph || !selectedMappingId) return
    // The scope this run belongs to; a result that lands after the graph or
    // mapping moved on is dropped, not shown under the new one.
    const epoch = autoMapEpochRef.current
    const stale = () => autoMapEpochRef.current !== epoch

    try {
      setIsAutoMapping(true)
      setError(null)
      const { operationId, status } = await clients.ledger.autoMapElements(
        currentGraph.graphId,
        { mapping_id: selectedMappingId }
      )
      if (stale()) return
      if (status !== 'completed') {
        const outcome = await clients.operations.monitorOperation(operationId)
        if (stale()) return
        if (!outcome.success) {
          setError(outcome.error || 'Auto-mapping failed. Please try again.')
        }
      }
      await refreshMappingData()
    } catch (err) {
      if (stale()) return
      console.error('Auto-map failed:', err)
      setError('Auto-mapping failed. Please try again.')
    } finally {
      setIsAutoMapping(false)
    }
  }, [currentGraph, selectedMappingId, refreshMappingData])

  // Filter accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const q = searchTerm.toLowerCase()
      const matchesSearch =
        searchTerm === '' ||
        account.name.toLowerCase().includes(q) ||
        (account.code?.toLowerCase().includes(q) ?? false)

      const matchesClassification =
        selectedClassification === null ||
        account.classification === selectedClassification

      return matchesSearch && matchesClassification
    })
  }, [accounts, searchTerm, selectedClassification])

  // Count by classification
  const classificationCounts = useMemo(() => {
    const counts: Record<ElementClassification, number> = {
      asset: 0,
      liability: 0,
      equity: 0,
      revenue: 0,
      expense: 0,
    }
    accounts.forEach((account) => {
      if (
        account.classification &&
        counts[account.classification] !== undefined
      ) {
        counts[account.classification]++
      }
    })
    return counts
  }, [accounts])

  const handleClassificationFilter = useCallback(
    (classification: ElementClassification | null) => {
      setSelectedClassification(classification)
    },
    []
  )

  const hasMappings = mappings.length > 0
  const editable = chart !== null && chart !== 'synced' ? chart : null
  const chartAccountById = useMemo(
    () => new Map((editable?.accounts ?? []).map((a) => [a.id, a])),
    [editable]
  )
  const retiredAccounts = useMemo(
    () =>
      (editable?.accounts ?? [])
        .filter((account) => !account.isActive)
        .sort((a, b) =>
          (a.code ?? a.name).localeCompare(b.code ?? b.name, undefined, {
            numeric: true,
          })
        ),
    [editable]
  )

  return (
    <PageLayout>
      <PageHeader
        icon={HiCollection}
        title="Chart of Accounts"
        subtitle={
          <>
            View accounts and GAAP mappings for the selected entity.{' '}
            <DocsLink href="/docs/map-your-chart-of-accounts" />
          </>
        }
      />

      {/* Mapping header bar */}
      {hasMappings && (
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {mappings.length > 1 ? (
                <select
                  value={selectedMappingId || ''}
                  onChange={(e) => setSelectedMappingId(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  {mappings.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-sm font-medium dark:text-white">
                  {mappings[0]?.name}
                </span>
              )}
              {mappingCoverage && (
                <div className="flex items-center gap-2">
                  <div className="w-32">
                    <Progress
                      progress={mappingCoverage.coveragePercent}
                      color={
                        mappingCoverage.coveragePercent >= 80
                          ? 'green'
                          : 'yellow'
                      }
                      size="sm"
                    />
                  </div>
                  <Badge
                    color={
                      mappingCoverage.coveragePercent >= 80
                        ? 'success'
                        : 'warning'
                    }
                    size="sm"
                  >
                    {mappingCoverage.mappedCount}/
                    {mappingCoverage.totalCoaElements}
                  </Badge>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                color="light"
                size="xs"
                onClick={() => setShowMappings((v) => !v)}
              >
                {showMappings ? 'Hide mappings' : 'Show mappings'}
              </Button>
              <Button
                color="purple"
                size="xs"
                onClick={handleAutoMap}
                disabled={isAutoMapping}
              >
                {isAutoMapping ? (
                  <>
                    <Spinner size="xs" className="mr-1" />
                    Mapping...
                  </>
                ) : (
                  <>
                    <HiSparkles className="mr-1 h-3 w-3" />
                    Auto-Map
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <FilterBar>
        <SearchField
          id="search"
          placeholder="Search accounts…"
          value={searchTerm}
          onChange={setSearchTerm}
          className="sm:w-72"
        />
        <FilterField label="Classification">
          <SegmentedControl
            options={[
              {
                value: 'all' as const,
                label: <CountLabel text="All" count={accounts.length} />,
              },
              ...ALL_CLASSIFICATIONS.map((classification) => ({
                value: classification,
                label: (
                  <CountLabel
                    text={CLASSIFICATION_LABELS[classification]}
                    count={classificationCounts[classification]}
                  />
                ),
              })),
            ]}
            value={selectedClassification ?? 'all'}
            onChange={(value) =>
              handleClassificationFilter(value === 'all' ? null : value)
            }
            ariaLabel="Classification"
          />
        </FilterField>
        {editable && (
          <FilterActions>
            <Button
              size="sm"
              color="light"
              onClick={() => setEditor({ account: null, step: 'form' })}
            >
              <HiPlus className="mr-2 h-4 w-4" />
              Add account
            </Button>
          </FilterActions>
        )}
      </FilterBar>

      {chart === 'synced' && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          This chart is synced from QuickBooks: add, rename and retire accounts
          there, and the next sync brings the change here.
        </p>
      )}

      {error && (
        <Card>
          <div className="flex items-center gap-2 text-red-500">
            <HiExclamationCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </Card>
      )}

      {notice && (
        <Card>
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <HiCheckCircle className="h-5 w-5" />
            <span>{notice}</span>
          </div>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          {isLoading ? (
            <LoadingState />
          ) : accounts.length === 0 ? (
            // A load failure also leaves `accounts` empty; the red card above
            // already says so, and inviting a new chart under it would be
            // wrong for a graph whose chart merely failed to load.
            currentGraph && !error ? (
              <ChartTemplatePicker
                key={`${currentGraph.graphId}:${entityId ?? ''}`}
                graphId={currentGraph.graphId}
                entityId={entityId}
                onInitialized={(result) => {
                  setNotice(
                    `Chart created: ${result.elementsCreated} accounts, ` +
                      `${result.mappingsCreated} mapped for reporting.`
                  )
                  setReloadKey((k) => k + 1)
                }}
              />
            ) : (
              <EmptyState
                icon={MdOutlineAccountBalanceWallet}
                title="No Accounts Found"
                description="Select a graph to see its chart of accounts."
                className="p-8"
              />
            )
          ) : filteredAccounts.length === 0 ? (
            <EmptyState
              icon={HiViewList}
              title="No Matching Accounts"
              description="Try adjusting your search or filters."
              className="p-8"
            />
          ) : (
            <Table>
              <TableHead>
                <tr>
                  <TableHeadCell>Account Name</TableHeadCell>
                  <TableHeadCell>Classification</TableHeadCell>
                  <TableHeadCell>Normal Balance</TableHeadCell>
                  {hasMappings && showMappings && (
                    <TableHeadCell>GAAP Mapping</TableHeadCell>
                  )}
                  {editable && (
                    <TableHeadCell>
                      <span className="sr-only">Edit</span>
                    </TableHeadCell>
                  )}
                </tr>
              </TableHead>
              <TableBody>
                {filteredAccounts.map((account) => {
                  const accountMappings =
                    gaapByElementId.get(account.id) ?? null
                  const isEditing = editingState?.accountId === account.id

                  return (
                    <TableRow key={`${account._graphId}-${account.id}`}>
                      <TableCell className="font-medium text-gray-900 dark:text-white">
                        <span
                          className="font-semibold"
                          style={{ paddingLeft: `${account.depth * 24}px` }}
                        >
                          {account.depth > 0 && (
                            <span className="mr-1 text-gray-400">└</span>
                          )}
                          {account.code &&
                            account.code.split(':').pop() !== account.name && (
                              <span className="mr-2 font-mono text-xs text-gray-500 dark:text-gray-400">
                                {account.code}
                              </span>
                            )}
                          {account.name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          color={
                            CLASSIFICATION_COLORS[account.classification] ||
                            'gray'
                          }
                          size="sm"
                        >
                          {CLASSIFICATION_LABELS[account.classification] ||
                            account.classification}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-sm font-medium ${
                            account.balance_type === 'debit'
                              ? 'text-primary-600 dark:text-primary-400'
                              : 'text-green-600 dark:text-green-400'
                          }`}
                        >
                          {account.balance_type === 'debit'
                            ? 'Debit'
                            : 'Credit'}
                        </span>
                      </TableCell>
                      {hasMappings && showMappings && (
                        <TableCell className="relative">
                          {isSaving && isEditing ? (
                            <Spinner size="sm" />
                          ) : isEditing ? (
                            <GaapDropdown
                              accountClassification={account.classification}
                              gaapElements={rsGaapElements}
                              currentMapping={accountMappings?.rsGaap ?? null}
                              onSelect={(el) =>
                                handleSelectGaap(account.id, el)
                              }
                              onClear={() => handleClearMapping(account.id)}
                              onClose={() => setEditingState(null)}
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setEditingState({ accountId: account.id })
                              }
                              className="group flex w-full cursor-pointer items-center justify-between rounded px-1 py-0.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                            >
                              <div className="flex max-w-md min-w-0 flex-col">
                                {accountMappings?.rsGaap ? (
                                  <>
                                    <span
                                      className="text-secondary-500 dark:text-secondary-400 truncate text-sm font-medium"
                                      title={accountMappings.rsGaap.gaapName}
                                    >
                                      {accountMappings.rsGaap.gaapName}
                                    </span>
                                    <span
                                      className="truncate font-mono text-xs text-gray-500 dark:text-gray-400"
                                      title={accountMappings.rsGaap.gaapQname}
                                    >
                                      {accountMappings.rsGaap.gaapQname}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-xs text-gray-400">
                                    Unmapped
                                  </span>
                                )}
                              </div>
                              <HiPencil className="group-hover:text-secondary-400 dark:group-hover:text-secondary-400 ml-1 h-3 w-3 shrink-0 text-gray-300 transition-colors dark:text-gray-600" />
                            </button>
                          )}
                        </TableCell>
                      )}
                      {editable && (
                        <TableCell className="text-right">
                          {chartAccountById.has(account.id) && (
                            <Button
                              size="xs"
                              color="light"
                              aria-label={`Edit ${account.name}`}
                              onClick={() =>
                                setEditor({
                                  account:
                                    chartAccountById.get(account.id) ?? null,
                                  step: 'form',
                                })
                              }
                            >
                              <HiPencil className="h-3 w-3" />
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {retiredAccounts.length > 0 && (
          <details className="border-t border-gray-200 p-4 dark:border-gray-700">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
              Retired accounts ({retiredAccounts.length})
            </summary>
            <ul className="mt-2 divide-y divide-gray-100 dark:divide-gray-700">
              {retiredAccounts.map((account) => (
                <li
                  key={account.id}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <span className="text-gray-600 dark:text-gray-400">
                    {account.code && (
                      <span className="mr-2 font-mono text-xs">
                        {account.code}
                      </span>
                    )}
                    {account.name}
                  </span>
                  <Button
                    size="xs"
                    color="light"
                    onClick={() => setEditor({ account, step: 'retire' })}
                  >
                    Reactivate…
                  </Button>
                </li>
              ))}
            </ul>
          </details>
        )}

        {/* Summary Footer */}
        {!isLoading && filteredAccounts.length > 0 && (
          <div className="border-t border-gray-200 p-4 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {filteredAccounts.length} of {accounts.length} accounts
            </p>
          </div>
        )}
      </Card>

      {editor && editable && currentGraph && (
        <AccountEditorModal
          graphId={currentGraph.graphId}
          entityId={entityId}
          chart={editable}
          account={editor.account}
          initialStep={editor.step}
          onClose={() => setEditor(null)}
          onSaved={(message) => {
            setEditor(null)
            setNotice(message)
            setReloadKey((k) => k + 1)
          }}
        />
      )}
    </PageLayout>
  )
}

export default ChartOfAccountsContent
