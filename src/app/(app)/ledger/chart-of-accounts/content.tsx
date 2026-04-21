'use client'

import { PageHeader } from '@/components/PageHeader'
import {
  clients,
  customTheme,
  GraphFilters,
  PageLayout,
  useGraphContext,
} from '@/lib/core'
import type { ElementClassification } from '@/lib/ledger'
import type {
  LedgerMapping,
  LedgerMappingCoverage,
  LedgerMappingInfo,
} from '@robosystems/client/clients'
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
  TextInput,
} from 'flowbite-react'
import type { FC } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  HiCollection,
  HiExclamationCircle,
  HiPencil,
  HiSearch,
  HiSparkles,
  HiViewList,
  HiX,
} from 'react-icons/hi'
import { MdOutlineAccountBalanceWallet } from 'react-icons/md'

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
  classification: string
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
  fac: GaapMapping | null
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

// Sort accounts by CoA code first (1xxx/2xxx/... ordering), falling back to
// QB account_type order, then name. Applied at every tree level so child
// accounts within a parent follow the same ordering as the roots.
function compareAccountNodes(a: TreeNode, b: TreeNode): number {
  const ca = a.code ?? ''
  const cb = b.code ?? ''
  if (ca !== cb) {
    return ca.localeCompare(cb, undefined, { numeric: true })
  }
  const ta = ACCOUNT_TYPE_ORDER[a.accountType || ''] ?? 99
  const tb = ACCOUNT_TYPE_ORDER[b.accountType || ''] ?? 99
  if (ta !== tb) return ta - tb
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
      classification: node.classification as ElementClassification,
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
          className="w-full rounded border-0 bg-gray-50 px-3 py-1.5 text-sm focus:ring-1 focus:ring-purple-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
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
                <span className="ml-1 text-purple-500"> — Best Match</span>
              )}
            </div>
            {group.elements.map((el) => (
              <button
                key={el.id}
                type="button"
                onClick={() => onSelect(el)}
                className="w-full px-3 py-2 text-left transition-colors hover:bg-purple-50 dark:hover:bg-purple-900/20"
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

// ── Main Content ──────────────────────────────────────────────────────────

const ChartOfAccountsContent: FC = function () {
  const { state: graphState } = useGraphContext()
  const [accounts, setAccounts] = useState<AccountRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClassification, setSelectedClassification] =
    useState<ElementClassification | null>(null)

  // Mapping state
  const [mappings, setMappings] = useState<LedgerMappingInfo[]>([])
  const [selectedMappingId, setSelectedMappingId] = useState<string | null>(
    null
  )
  const [mappingDetail, setMappingDetail] = useState<LedgerMapping | null>(null)
  const [mappingCoverage, setMappingCoverage] =
    useState<LedgerMappingCoverage | null>(null)
  const [isAutoMapping, setIsAutoMapping] = useState(false)

  // Inline editing state
  const [facElements, setFacElements] = useState<GaapElement[]>([])
  const [rsGaapElements, setRsGaapElements] = useState<GaapElement[]>([])
  const [editingState, setEditingState] = useState<{
    accountId: string
    mode: 'fac' | 'rsGaap'
  } | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const currentGraph = useMemo(() => {
    const roboledgerGraphs = graphState.graphs.filter(GraphFilters.roboledger)
    return (
      roboledgerGraphs.find((g) => g.graphId === graphState.currentGraphId) ??
      roboledgerGraphs[0]
    )
  }, [graphState.graphs, graphState.currentGraphId])

  // Load accounts and mappings
  useEffect(() => {
    const loadData = async () => {
      if (!currentGraph) {
        setAccounts([])
        setMappings([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Load account tree and mappings in parallel
        const [accountTree, mappingList] = await Promise.all([
          clients.ledger.getAccountTree(currentGraph.graphId),
          clients.ledger
            .listMappings(currentGraph.graphId)
            .catch(() => [] as LedgerMappingInfo[]),
        ])

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
        }

        // Process mappings
        setMappings(mappingList)
        if (mappingList.length > 0 && !selectedMappingId) {
          setSelectedMappingId(mappingList[0].id)
        }
      } catch (err) {
        console.error('Error loading data:', err)
        setError('Failed to load chart of accounts. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- don't re-trigger on selectedMappingId change
  }, [currentGraph])

  // Load mapping detail, coverage, and elements when selected mapping changes
  useEffect(() => {
    const loadMappingData = async () => {
      if (!currentGraph || !selectedMappingId) {
        setMappingDetail(null)
        setMappingCoverage(null)
        return
      }

      try {
        const [detail, coverage, facResult, rsGaapResult] = await Promise.all([
          clients.ledger.getMapping(currentGraph.graphId, selectedMappingId),
          clients.ledger
            .getMappingCoverage(currentGraph.graphId, selectedMappingId)
            .catch(() => null),
          // Load FAC elements for the dropdown (once)
          facElements.length === 0
            ? clients.ledger
                .listElements(currentGraph.graphId, {
                  source: 'fac',
                  isAbstract: false,
                  limit: 200,
                })
                .catch(() => ({ elements: [] }))
            : null,
          // Load rs-gaap elements in two pages (API max is 1000; ~1863 total)
          rsGaapElements.length === 0
            ? Promise.all([
                clients.ledger
                  .listElements(currentGraph.graphId, {
                    source: 'rs-gaap',
                    isAbstract: false,
                    limit: 1000,
                    offset: 0,
                  })
                  .catch(() => ({ elements: [] })),
                clients.ledger
                  .listElements(currentGraph.graphId, {
                    source: 'rs-gaap',
                    isAbstract: false,
                    limit: 1000,
                    offset: 1000,
                  })
                  .catch(() => ({ elements: [] })),
              ]).then(([p1, p2]) => ({
                elements: [
                  ...((p1 as { elements?: unknown[] })?.elements ?? []),
                  ...((p2 as { elements?: unknown[] })?.elements ?? []),
                ],
              }))
            : null,
        ])

        setMappingDetail(detail)
        setMappingCoverage(coverage)

        const toGaapElements = (result: unknown) => {
          const data = result as { elements?: Array<Record<string, unknown>> }
          return (data?.elements ?? []).map((e) => ({
            id: e.id as string,
            name: e.name as string,
            qname: (e.qname as string) ?? '',
            classification: (e.classification as string) ?? '',
          }))
        }
        if (facResult) setFacElements(toGaapElements(facResult))
        if (rsGaapResult) setRsGaapElements(toGaapElements(rsGaapResult))
      } catch (err) {
        console.error('Error loading mapping detail:', err)
        setMappingDetail(null)
        setMappingCoverage(null)
      }
    }

    loadMappingData()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- facElements/rsGaapElements intentionally excluded to avoid re-fetching
  }, [currentGraph, selectedMappingId])

  // Build GAAP lookup from mapping associations, keyed by from_element_id.
  // Each account can have both a FAC mapping (fac:*) and an rs-gaap mapping (rs-gaap:*).
  const gaapByElementId = useMemo(() => {
    const map = new Map<string, AccountMappings>()
    if (!mappingDetail?.associations) return map

    for (const assoc of mappingDetail.associations) {
      const fromId = assoc.fromElementId
      if (!fromId) continue
      const existing = map.get(fromId) ?? { fac: null, rsGaap: null }
      const mapping: GaapMapping = {
        gaapName: assoc.toElementName ?? '',
        gaapQname: assoc.toElementQname ?? '',
        confidence: assoc.confidence ?? 0,
        associationId: assoc.id,
        fromElementId: fromId,
        toElementId: assoc.toElementId,
      }
      if (assoc.toElementQname?.startsWith('fac:')) {
        map.set(fromId, { ...existing, fac: mapping })
      } else {
        map.set(fromId, { ...existing, rsGaap: mapping })
      }
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
      setMappingDetail(detail)
      setMappingCoverage(coverage)
    } catch {
      // ignore
    }
  }, [currentGraph, selectedMappingId])

  // Handle GAAP element selection (fac or rsGaap slot)
  const handleSelectGaap = useCallback(
    async (
      accountId: string,
      gaapElement: GaapElement,
      mode: 'fac' | 'rsGaap'
    ) => {
      if (!currentGraph || !selectedMappingId) return

      setIsSaving(true)
      try {
        const accountMappings = gaapByElementId.get(accountId)
        const existing =
          mode === 'fac' ? accountMappings?.fac : accountMappings?.rsGaap
        if (existing) {
          await clients.ledger.deleteMappingAssociation(currentGraph.graphId, {
            mapping_id: selectedMappingId,
            association_id: existing.associationId,
          })
        }

        await clients.ledger.createMappingAssociation(currentGraph.graphId, {
          mapping_id: selectedMappingId,
          from_element_id: accountId,
          to_element_id: gaapElement.id,
          confidence: 1.0,
        })

        await refreshMappingData()
        setEditingState(null)
      } catch (err) {
        console.error('Failed to save mapping:', err)
        setError('Failed to save mapping.')
      } finally {
        setIsSaving(false)
      }
    },
    [currentGraph, selectedMappingId, gaapByElementId, refreshMappingData]
  )

  // Handle clear mapping (fac or rsGaap slot)
  const handleClearMapping = useCallback(
    async (accountId: string, mode: 'fac' | 'rsGaap') => {
      if (!currentGraph || !selectedMappingId) return

      const accountMappings = gaapByElementId.get(accountId)
      const existing =
        mode === 'fac' ? accountMappings?.fac : accountMappings?.rsGaap
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
        setError('Failed to clear mapping.')
      } finally {
        setIsSaving(false)
      }
    },
    [currentGraph, selectedMappingId, gaapByElementId, refreshMappingData]
  )

  // Auto-map handler
  const handleAutoMap = useCallback(async () => {
    if (!currentGraph || !selectedMappingId) return

    try {
      setIsAutoMapping(true)
      setError(null)
      await clients.ledger.autoMapElements(currentGraph.graphId, {
        mapping_id: selectedMappingId,
      })

      // Poll for updated data after agent completes
      setTimeout(async () => {
        await refreshMappingData()
        setIsAutoMapping(false)
      }, 5000)
    } catch (err) {
      console.error('Auto-map failed:', err)
      setError('Auto-mapping failed. Please try again.')
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

  return (
    <PageLayout>
      <PageHeader
        icon={HiCollection}
        title="Chart of Accounts"
        description="View accounts and GAAP mappings for the selected entity"
        gradient="from-blue-500 to-cyan-600"
      />

      {/* Mapping header bar */}
      {hasMappings && (
        <Card theme={customTheme.card}>
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
            <Button
              theme={customTheme.button}
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
        </Card>
      )}

      {/* Filters */}
      <Card theme={customTheme.card}>
        <div className="space-y-4 p-4">
          <div className="block items-center gap-4 sm:flex">
            <div className="mb-4 flex flex-1 sm:mb-0">
              <div className="relative w-full max-w-md">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <HiSearch className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </div>
                <TextInput
                  theme={customTheme.textInput}
                  id="search"
                  placeholder="Search accounts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleClassificationFilter(null)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                selectedClassification === null
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              All ({accounts.length})
            </button>
            {ALL_CLASSIFICATIONS.map((classification) => (
              <button
                key={classification}
                onClick={() => handleClassificationFilter(classification)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  selectedClassification === classification
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {CLASSIFICATION_LABELS[classification]} (
                {classificationCounts[classification]})
              </button>
            ))}
          </div>
        </div>
      </Card>

      {error && (
        <Card theme={customTheme.card}>
          <div className="flex items-center gap-2 text-red-500">
            <HiExclamationCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </Card>
      )}

      <Card theme={customTheme.card}>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="p-8 text-center">
              <Card theme={customTheme.card}>
                <MdOutlineAccountBalanceWallet className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <h3 className="font-heading mb-4 text-xl font-bold dark:text-white">
                  No Accounts Found
                </h3>
                <p className="mb-4 text-gray-500 dark:text-gray-400">
                  No chart of accounts found in your roboledger graphs.
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Import accounting data to see accounts here.
                </p>
              </Card>
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="p-8 text-center">
              <Card theme={customTheme.card}>
                <HiViewList className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <h3 className="font-heading mb-4 text-xl font-bold dark:text-white">
                  No Matching Accounts
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Try adjusting your search or filters.
                </p>
              </Card>
            </div>
          ) : (
            <Table theme={customTheme.table}>
              <TableHead>
                <TableHeadCell>Account Name</TableHeadCell>
                <TableHeadCell>Classification</TableHeadCell>
                <TableHeadCell>Normal Balance</TableHeadCell>
                {hasMappings && <TableHeadCell>GAAP Mapping</TableHeadCell>}
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
                          {account.code && (
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
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-green-600 dark:text-green-400'
                          }`}
                        >
                          {account.balance_type === 'debit'
                            ? 'Debit'
                            : 'Credit'}
                        </span>
                      </TableCell>
                      {hasMappings && (
                        <TableCell className="relative">
                          {isSaving && isEditing ? (
                            <Spinner size="sm" />
                          ) : isEditing ? (
                            <GaapDropdown
                              accountClassification={account.classification}
                              gaapElements={
                                editingState!.mode === 'fac'
                                  ? facElements
                                  : rsGaapElements
                              }
                              currentMapping={
                                editingState!.mode === 'fac'
                                  ? (accountMappings?.fac ?? null)
                                  : (accountMappings?.rsGaap ?? null)
                              }
                              onSelect={(el) =>
                                handleSelectGaap(
                                  account.id,
                                  el,
                                  editingState!.mode
                                )
                              }
                              onClear={() =>
                                handleClearMapping(
                                  account.id,
                                  editingState!.mode
                                )
                              }
                              onClose={() => setEditingState(null)}
                            />
                          ) : (
                            <div className="flex flex-col gap-0.5">
                              {/* FAC row */}
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingState({
                                    accountId: account.id,
                                    mode: 'fac',
                                  })
                                }
                                className="group flex w-full cursor-pointer items-center justify-between rounded px-1 py-0.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                              >
                                <div className="flex min-w-0 flex-col">
                                  <span className="text-[10px] font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                                    FAC
                                  </span>
                                  {accountMappings?.fac ? (
                                    <span className="truncate font-mono text-xs text-blue-500 dark:text-blue-400">
                                      {accountMappings.fac.gaapQname}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-400">
                                      Unmapped
                                    </span>
                                  )}
                                </div>
                                <HiPencil className="ml-1 h-3 w-3 shrink-0 text-gray-300 transition-colors group-hover:text-purple-400 dark:text-gray-600 dark:group-hover:text-purple-400" />
                              </button>
                              {/* rs-gaap row */}
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingState({
                                    accountId: account.id,
                                    mode: 'rsGaap',
                                  })
                                }
                                className="group flex w-full cursor-pointer items-center justify-between rounded px-1 py-0.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                              >
                                <div className="flex min-w-0 flex-col">
                                  <span className="text-[10px] font-semibold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                                    rs-gaap
                                  </span>
                                  {accountMappings?.rsGaap ? (
                                    <>
                                      <span className="truncate text-sm font-medium text-purple-500 dark:text-purple-400">
                                        {accountMappings.rsGaap.gaapName}
                                      </span>
                                      <span className="truncate font-mono text-xs text-gray-500 dark:text-gray-400">
                                        {accountMappings.rsGaap.gaapQname}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-xs text-gray-400">
                                      Unmapped
                                    </span>
                                  )}
                                </div>
                                <HiPencil className="ml-1 h-3 w-3 shrink-0 text-gray-300 transition-colors group-hover:text-purple-400 dark:text-gray-600 dark:group-hover:text-purple-400" />
                              </button>
                            </div>
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

        {/* Summary Footer */}
        {!isLoading && filteredAccounts.length > 0 && (
          <div className="border-t border-gray-200 p-4 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {filteredAccounts.length} of {accounts.length} accounts
            </p>
          </div>
        )}
      </Card>
    </PageLayout>
  )
}

export default ChartOfAccountsContent
