'use client'

import { PageHeader } from '@/components/PageHeader'
import {
  customTheme,
  extensions,
  GraphFilters,
  PageLayout,
  SDK,
  useGraphContext,
} from '@/lib/core'
import type { ElementClassification } from '@/lib/ledger'
import type {
  MappingCoverage,
  MappingInfo,
} from '@robosystems/client/extensions'
import type { MappingDetailResponse } from '@robosystems/client/types'
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
  name: string
  classification: string
  account_type?: string | null
  balance_type: string
  depth: number
  is_active: boolean
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

function flattenTree(
  nodes: TreeNode[],
  graphId: string,
  graphName: string
): AccountRow[] {
  const result: AccountRow[] = []
  for (const node of nodes) {
    result.push({
      id: node.id,
      name: node.name,
      classification: node.classification as ElementClassification,
      balance_type: node.balance_type,
      depth: node.depth,
      is_active: node.is_active,
      _graphId: graphId,
      _graphName: graphName,
    })
    if (node.children && node.children.length > 0) {
      result.push(...flattenTree(node.children, graphId, graphName))
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

  // Group and sort: matching classification first
  const grouped = useMemo(() => {
    const filtered = gaapElements.filter(
      (el) =>
        search === '' ||
        el.name.toLowerCase().includes(search.toLowerCase()) ||
        el.qname.toLowerCase().includes(search.toLowerCase())
    )

    // Sort classifications: matching first, then alphabetical
    const classOrder = [
      accountClassification,
      ...ALL_CLASSIFICATIONS.filter((c) => c !== accountClassification),
    ]

    const groups: Array<{ classification: string; elements: GaapElement[] }> =
      []
    for (const cls of classOrder) {
      const elements = filtered
        .filter((el) => el.classification === cls)
        .sort((a, b) => a.name.localeCompare(b.name))
      if (elements.length > 0) {
        groups.push({ classification: cls, elements })
      }
    }
    return groups
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
              ] || group.classification}
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
  const [mappings, setMappings] = useState<MappingInfo[]>([])
  const [selectedMappingId, setSelectedMappingId] = useState<string | null>(
    null
  )
  const [mappingDetail, setMappingDetail] =
    useState<MappingDetailResponse | null>(null)
  const [mappingCoverage, setMappingCoverage] =
    useState<MappingCoverage | null>(null)
  const [isAutoMapping, setIsAutoMapping] = useState(false)

  // Inline editing state
  const [gaapElements, setGaapElements] = useState<GaapElement[]>([])
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null)
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
        const [accountResponse, mappingList] = await Promise.all([
          SDK.getLedgerAccountTree({
            path: { graph_id: currentGraph.graphId },
          }),
          extensions.ledger
            .listMappings(currentGraph.graphId)
            .catch(() => [] as MappingInfo[]),
        ])

        // Process accounts
        if (accountResponse.data) {
          const roots = (accountResponse.data.roots || []) as TreeNode[]
          roots.sort((a, b) => {
            const ta = ACCOUNT_TYPE_ORDER[a.account_type || ''] ?? 99
            const tb = ACCOUNT_TYPE_ORDER[b.account_type || ''] ?? 99
            if (ta !== tb) return ta - tb
            return a.name.localeCompare(b.name)
          })
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
        const [detail, coverage, gaapResult] = await Promise.all([
          extensions.ledger.getMappingDetail(
            currentGraph.graphId,
            selectedMappingId
          ),
          extensions.ledger
            .getMappingCoverage(currentGraph.graphId, selectedMappingId)
            .catch(() => null),
          // Load GAAP elements for the dropdown (once)
          gaapElements.length === 0
            ? extensions.ledger
                .listElements(currentGraph.graphId, {
                  source: 'us-gaap',
                  isAbstract: false,
                  limit: 500,
                })
                .catch(() => ({ elements: [] }))
            : null,
        ])

        setMappingDetail(detail)
        setMappingCoverage(coverage)

        if (gaapResult) {
          const data = gaapResult as {
            elements?: Array<Record<string, unknown>>
          }
          setGaapElements(
            (data.elements ?? []).map((e) => ({
              id: e.id as string,
              name: e.name as string,
              qname: (e.qname as string) ?? '',
              classification: (e.classification as string) ?? '',
            }))
          )
        }
      } catch (err) {
        console.error('Error loading mapping detail:', err)
        setMappingDetail(null)
        setMappingCoverage(null)
      }
    }

    loadMappingData()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- gaapElements intentionally excluded to avoid re-fetching
  }, [currentGraph, selectedMappingId])

  // Build GAAP lookup from mapping associations, keyed by from_element_id
  const gaapByElementId = useMemo(() => {
    const map = new Map<string, GaapMapping>()
    if (!mappingDetail?.associations) return map

    for (const assoc of mappingDetail.associations as Array<
      Record<string, unknown>
    >) {
      const fromId = assoc.from_element_id as string
      if (fromId) {
        map.set(fromId, {
          gaapName: (assoc.to_element_name as string) || '',
          gaapQname: (assoc.to_element_qname as string) || '',
          confidence: (assoc.confidence as number) ?? 0,
          associationId: assoc.id as string,
          fromElementId: fromId,
          toElementId: assoc.to_element_id as string,
        })
      }
    }
    return map
  }, [mappingDetail])

  // Refresh mapping detail + coverage
  const refreshMappingData = useCallback(async () => {
    if (!currentGraph || !selectedMappingId) return
    try {
      const [detail, coverage] = await Promise.all([
        extensions.ledger.getMappingDetail(
          currentGraph.graphId,
          selectedMappingId
        ),
        extensions.ledger
          .getMappingCoverage(currentGraph.graphId, selectedMappingId)
          .catch(() => null),
      ])
      setMappingDetail(detail)
      setMappingCoverage(coverage)
    } catch {
      // ignore
    }
  }, [currentGraph, selectedMappingId])

  // Handle GAAP element selection
  const handleSelectGaap = useCallback(
    async (accountId: string, gaapElement: GaapElement) => {
      if (!currentGraph || !selectedMappingId) return

      setIsSaving(true)
      try {
        // If replacing existing mapping, delete old first
        const existing = gaapByElementId.get(accountId)
        if (existing) {
          await extensions.ledger.deleteMapping(
            currentGraph.graphId,
            selectedMappingId,
            existing.associationId
          )
        }

        // Create new mapping using account.id directly as the from element ID
        await extensions.ledger.createMapping(
          currentGraph.graphId,
          selectedMappingId,
          accountId,
          gaapElement.id,
          1.0
        )

        await refreshMappingData()
        setEditingAccountId(null)
      } catch (err) {
        console.error('Failed to save mapping:', err)
        setError('Failed to save mapping.')
      } finally {
        setIsSaving(false)
      }
    },
    [currentGraph, selectedMappingId, gaapByElementId, refreshMappingData]
  )

  // Handle clear mapping
  const handleClearMapping = useCallback(
    async (accountId: string) => {
      if (!currentGraph || !selectedMappingId) return

      const existing = gaapByElementId.get(accountId)
      if (!existing) return

      setIsSaving(true)
      try {
        await extensions.ledger.deleteMapping(
          currentGraph.graphId,
          selectedMappingId,
          existing.associationId
        )
        await refreshMappingData()
        setEditingAccountId(null)
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
      await extensions.ledger.autoMap(currentGraph.graphId, selectedMappingId)

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
      const matchesSearch =
        searchTerm === '' ||
        account.name.toLowerCase().includes(searchTerm.toLowerCase())

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
                  const gaap = gaapByElementId.get(account.id) ?? null
                  const isEditing = editingAccountId === account.id

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
                              gaapElements={gaapElements}
                              currentMapping={gaap}
                              onSelect={(el) =>
                                handleSelectGaap(account.id, el)
                              }
                              onClear={() => handleClearMapping(account.id)}
                              onClose={() => setEditingAccountId(null)}
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => setEditingAccountId(account.id)}
                              className="group flex w-full cursor-pointer items-center justify-between rounded px-1 py-0.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                            >
                              {gaap ? (
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-purple-500 dark:text-purple-400">
                                    {gaap.gaapName}
                                  </span>
                                  <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                                    {gaap.gaapQname}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400">
                                  Unmapped
                                </span>
                              )}
                              <HiPencil className="h-3.5 w-3.5 shrink-0 text-gray-300 transition-colors group-hover:text-purple-400 dark:text-gray-600 dark:group-hover:text-purple-400" />
                            </button>
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
