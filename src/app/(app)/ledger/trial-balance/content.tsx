'use client'

import { FilterBar, FilterField, SearchField } from '@/components/FilterBar'
import SegmentedControl, {
  type SegmentedOption,
} from '@/components/SegmentedControl'
import SortableHeadCell from '@/components/SortableHeadCell'
import type { ElementClassification } from '@/lib/ledger'
import { formatDollars } from '@/lib/ledger/formatters'
import { type SortColumn, useTableSort } from '@/lib/useTableSort'
import {
  clients,
  EmptyState,
  GraphFilters,
  LoadingState,
  PageHeader,
  PageLayout,
  useGraphContext,
} from '@robosystems/core'
import {
  Alert,
  Badge,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from 'flowbite-react'
import type { FC } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  HiCheckCircle,
  HiExclamationCircle,
  HiScale,
  HiSearch,
} from 'react-icons/hi'
import { TbReportMoney } from 'react-icons/tb'

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

interface TrialBalanceRowWithGraph {
  accountId: string
  accountCode: string
  accountName: string
  classification: ElementClassification
  accountType: string | null
  totalDebits: number
  totalCredits: number
  netBalance: number
  _graphId: string
  _graphName: string
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

const formatCurrency = (amount: number): string => formatDollars(amount)

type ViewMode = 'coa' | 'usgaap'

type SortKey = 'account' | 'classification' | 'debits' | 'credits' | 'net'

// Module-level so the sorted list isn't rebuilt on every render.
const SORT_COLUMNS: Record<SortKey, SortColumn<TrialBalanceRowWithGraph>> = {
  // By code when there is one ("1010" before "1200"), else by name.
  account: { value: (row) => row.accountCode || row.accountName },
  classification: { value: (row) => row.classification },
  debits: { value: (row) => row.totalDebits },
  credits: { value: (row) => row.totalCredits },
  net: { value: (row) => row.netBalance },
}

const VIEW_MODES: readonly SegmentedOption<ViewMode>[] = [
  { value: 'coa', label: 'Chart of Accounts' },
  { value: 'usgaap', label: 'US-GAAP' },
]

const TrialBalanceContent: FC = function () {
  const { state: graphState } = useGraphContext()
  const [data, setData] = useState<TrialBalanceRowWithGraph[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('coa')
  // Tagged with the graph it was resolved in. A mapping id is a row in one
  // graph, and both effects here list `currentGraphId` in their dependencies —
  // so on a switch the loader below re-runs in the same commit as this one,
  // holding the previous graph's id. Without the tag it could not tell that
  // apart from a mapping legitimately resolved for the graph now selected, and
  // sent `getMappedTrialBalance(newGraph, previousGraph's mappingId)`.
  //
  // `id: null` means "this graph has no active mapping", which is distinct from
  // the whole value being null — "not resolved yet".
  const [mapping, setMapping] = useState<{
    graphId: string
    id: string | null
  } | null>(null)

  // Resolve the active CoA→GAAP mapping once per graph. We need its
  // structure ID to fetch the aggregated trial balance.
  const mappingSeq = useRef(0)
  useEffect(() => {
    const seq = ++mappingSeq.current
    const loadMapping = async () => {
      const currentGraph = graphState.graphs
        .filter(GraphFilters.roboledger)
        .find((g) => g.graphId === graphState.currentGraphId)
      if (!currentGraph) {
        setMapping(null)
        return
      }
      try {
        // Filtered server-side to structure_type='coa_mapping'.
        const structures = await clients.ledger.listMappings(
          currentGraph.graphId
        )
        if (seq !== mappingSeq.current) return // superseded by a newer load
        const active = structures.find((s) => s.isActive) ?? structures[0]
        setMapping({ graphId: currentGraph.graphId, id: active?.id ?? null })
      } catch (err) {
        if (seq !== mappingSeq.current) return
        console.error('Error loading mappings:', err)
        setMapping({ graphId: currentGraph.graphId, id: null })
      }
    }
    loadMapping()
  }, [graphState.graphs, graphState.currentGraphId])

  // Load trial balance data. `viewMode` swaps the endpoint:
  //
  //   coa    → /trial-balance — raw Chart of Accounts rows (account_type
  //            ordered to mirror QuickBooks)
  //   usgaap → /trial-balance/mapped — rows aggregated to US-GAAP reporting
  //            elements via the graph's CoA→GAAP mapping. Sorted by qname.
  const loadSeq = useRef(0)
  useEffect(() => {
    const seq = ++loadSeq.current
    // Set when the US-GAAP view is waiting on this graph's mapping to resolve.
    // The spinner stays up in that case rather than flashing an empty table
    // between the graph switch and the mapping arriving.
    let awaitingMapping = false

    const loadTrialBalance = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const currentGraph = graphState.graphs
          .filter(GraphFilters.roboledger)
          .find((g) => g.graphId === graphState.currentGraphId)

        if (!currentGraph) {
          setData([])
          return
        }

        const allRows: TrialBalanceRowWithGraph[] = []

        if (viewMode === 'coa') {
          const result = await clients.ledger.getTrialBalance(
            currentGraph.graphId
          )

          if (seq !== loadSeq.current) return // superseded by a newer load

          if (result) {
            const rows = result.rows || []
            for (const row of rows) {
              allRows.push({
                accountId: row.accountId,
                accountCode: row.accountCode,
                accountName: row.accountName,
                classification: row.trait as ElementClassification,
                accountType: row.accountType ?? null,
                totalDebits: row.totalDebits,
                totalCredits: row.totalCredits,
                netBalance: row.netBalance,
                _graphId: currentGraph.graphId,
                _graphName: currentGraph.graphName,
              })
            }
          }

          // Match CoA display order: primary sort by AccountType
          // (Asset → Liability → Equity → Income → COGS → Expense),
          // secondary by numeric account code (1xxx assets, 2xxx
          // liabilities, ...) when set, then by name. Type-first ensures
          // QB books without account numbering — where code === name —
          // still cluster by financial category instead of degenerating
          // to alphabetic-by-name. See `chart-of-accounts/content.tsx`
          // `compareAccountNodes` for the matching logic.
          allRows.sort((a, b) => {
            const ta = ACCOUNT_TYPE_ORDER[a.accountType || ''] ?? 99
            const tb = ACCOUNT_TYPE_ORDER[b.accountType || ''] ?? 99
            if (ta !== tb) return ta - tb
            const ca = a.accountCode ?? ''
            const cb = b.accountCode ?? ''
            if (ca !== cb) {
              return ca.localeCompare(cb, undefined, { numeric: true })
            }
            return a.accountName.localeCompare(b.accountName)
          })
        } else {
          // usgaap mode
          if (!mapping || mapping.graphId !== currentGraph.graphId) {
            // Either nothing has resolved yet, or what we hold belongs to the
            // graph we just left. Wait for this graph's own mapping rather than
            // pairing another graph's id with this graph's ledger.
            awaitingMapping = true
            return
          }
          if (!mapping.id) {
            setData([])
            setError(
              'No active CoA → US-GAAP mapping found for this graph. ' +
                'Configure mappings on the Chart of Accounts page to see aggregated balances.'
            )
            return
          }
          const mapped = await clients.ledger.getMappedTrialBalance(
            currentGraph.graphId,
            mapping.id
          )

          if (seq !== loadSeq.current) return // superseded by a newer load

          const rows = mapped?.rows ?? []
          for (const row of rows) {
            // Strip the namespace prefix from the qname for display
            // (e.g., "us-gaap:RetainedEarnings" → "RetainedEarnings")
            const shortCode = row.qname.includes(':')
              ? (row.qname.split(':').pop() ?? row.qname)
              : row.qname
            allRows.push({
              accountId: row.reportingElementId,
              accountCode: shortCode,
              accountName: row.reportingName,
              classification: row.trait as ElementClassification,
              accountType: null, // not meaningful for GAAP aggregation
              totalDebits: row.totalDebits,
              totalCredits: row.totalCredits,
              netBalance: row.netBalance,
              _graphId: currentGraph.graphId,
              _graphName: currentGraph.graphName,
            })
          }
          // Already sorted by qname server-side — keep that order.
        }

        setData(allRows)
      } catch (err) {
        if (seq !== loadSeq.current) return
        console.error('Error loading trial balance:', err)
        setError('Failed to load trial balance. Please try again.')
      } finally {
        if (seq === loadSeq.current && !awaitingMapping) setIsLoading(false)
      }
    }

    loadTrialBalance()
  }, [graphState.graphs, graphState.currentGraphId, viewMode, mapping])

  // Filter data
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const matchesSearch =
        searchTerm === '' ||
        row.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.accountCode.toLowerCase().includes(searchTerm.toLowerCase())

      return matchesSearch
    })
  }, [data, searchTerm])

  // Calculate totals. The displayed sums follow the filter, but whether the
  // books balance is a property of the whole trial balance — computing it over
  // the filtered rows made any search (e.g. "cash") trip the red unbalanced
  // warning, implying the ledger didn't tie.
  // The whole trial balance is in hand (no cap, no paging), so sorting it is
  // honest. Unsorted is the chart-of-accounts order; a third click returns.
  const tableSort = useTableSort(filteredData, SORT_COLUMNS)

  const totals = useMemo(() => {
    const totalDebits = filteredData.reduce(
      (sum, row) => sum + row.totalDebits,
      0
    )
    const totalCredits = filteredData.reduce(
      (sum, row) => sum + row.totalCredits,
      0
    )
    const allDebits = data.reduce((sum, row) => sum + row.totalDebits, 0)
    const allCredits = data.reduce((sum, row) => sum + row.totalCredits, 0)
    const isBalanced = Math.abs(allDebits - allCredits) < 0.01

    return { totalDebits, totalCredits, isBalanced }
  }, [filteredData, data])

  // Group by classification for summary
  const classificationSummary = useMemo(() => {
    const summary: Record<
      ElementClassification,
      { debits: number; credits: number }
    > = {
      asset: { debits: 0, credits: 0 },
      liability: { debits: 0, credits: 0 },
      equity: { debits: 0, credits: 0 },
      revenue: { debits: 0, credits: 0 },
      expense: { debits: 0, credits: 0 },
    }

    filteredData.forEach((row) => {
      if (row.classification && summary[row.classification]) {
        summary[row.classification].debits += row.totalDebits
        summary[row.classification].credits += row.totalCredits
      }
    })

    return summary
  }, [filteredData])

  return (
    <PageLayout>
      <PageHeader
        icon={HiScale}
        title="Trial Balance"
        subtitle="View account balances with debits and credits verification"
      />

      {/* Filters */}
      <FilterBar>
        <SearchField
          id="search"
          placeholder="Search accounts…"
          value={searchTerm}
          onChange={setSearchTerm}
        />
        {/* Two views, not an on/off — a switch labelled on both sides never
            said which side was "on". */}
        <FilterField label="View">
          <SegmentedControl
            options={VIEW_MODES}
            value={viewMode}
            onChange={setViewMode}
            ariaLabel="View"
          />
        </FilterField>
      </FilterBar>

      {/* US-GAAP Mode Notice */}
      {viewMode === 'usgaap' && (
        <Alert color="info">
          <span className="font-medium">US-GAAP View:</span> Balances aggregated
          to US-GAAP reporting elements via the active CoA→GAAP mapping. Edit
          mappings on the{' '}
          <a href="/ledger/chart-of-accounts" className="font-medium underline">
            Chart of Accounts
          </a>{' '}
          page.
        </Alert>
      )}

      {error && (
        <Alert color="failure">
          <HiExclamationCircle className="h-4 w-4" />
          <span className="font-medium">Error!</span> {error}
        </Alert>
      )}

      {/* Classification Summary Cards */}
      {!isLoading && filteredData.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {(
            ['asset', 'liability', 'equity', 'revenue', 'expense'] as const
          ).map((classification) => (
            <Card key={classification} className="p-3">
              <div className="flex items-center justify-between">
                <Badge
                  color={CLASSIFICATION_COLORS[classification]}
                  size="sm"
                  className="mb-1"
                >
                  {CLASSIFICATION_LABELS[classification]}
                </Badge>
              </div>
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Dr:</span>
                  <span className="text-primary-600 dark:text-primary-400 font-mono">
                    {formatCurrency(
                      classificationSummary[classification].debits
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Cr:</span>
                  <span className="font-mono text-green-600 dark:text-green-400">
                    {formatCurrency(
                      classificationSummary[classification].credits
                    )}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <div className="overflow-x-auto">
          {isLoading ? (
            <LoadingState />
          ) : data.length === 0 ? (
            <EmptyState
              icon={TbReportMoney}
              title="No Trial Balance Data"
              description="No transaction data found to generate trial balance."
            />
          ) : filteredData.length === 0 ? (
            <EmptyState
              icon={HiSearch}
              title="No Matching Accounts"
              description="Try adjusting your search."
            />
          ) : (
            <Table>
              <TableHead>
                <tr>
                  <SortableHeadCell
                    sort={tableSort.ariaSort('account')}
                    onSort={() => tableSort.toggle('account')}
                  >
                    Account
                  </SortableHeadCell>
                  <SortableHeadCell
                    sort={tableSort.ariaSort('classification')}
                    onSort={() => tableSort.toggle('classification')}
                  >
                    Classification
                  </SortableHeadCell>
                  <SortableHeadCell
                    align="right"
                    sort={tableSort.ariaSort('debits')}
                    onSort={() => tableSort.toggle('debits')}
                  >
                    Debits
                  </SortableHeadCell>
                  <SortableHeadCell
                    align="right"
                    sort={tableSort.ariaSort('credits')}
                    onSort={() => tableSort.toggle('credits')}
                  >
                    Credits
                  </SortableHeadCell>
                  <SortableHeadCell
                    align="right"
                    sort={tableSort.ariaSort('net')}
                    onSort={() => tableSort.toggle('net')}
                  >
                    Net Balance
                  </SortableHeadCell>
                </tr>
              </TableHead>
              <TableBody>
                {tableSort.sorted.map((row) => (
                  <TableRow key={`${row._graphId}-${row.accountId}`}>
                    <TableCell className="font-medium text-gray-900 dark:text-white">
                      {row.accountCode && (
                        <span className="mr-2 font-mono text-xs text-gray-500 dark:text-gray-400">
                          {row.accountCode}
                        </span>
                      )}
                      {row.accountName}
                    </TableCell>
                    <TableCell>
                      <Badge
                        color={
                          CLASSIFICATION_COLORS[row.classification] || 'gray'
                        }
                        size="sm"
                      >
                        {CLASSIFICATION_LABELS[row.classification] ||
                          row.classification}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <span className="text-primary-600 dark:text-primary-400">
                        {row.totalDebits > 0
                          ? formatCurrency(row.totalDebits)
                          : '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <span className="text-green-600 dark:text-green-400">
                        {row.totalCredits > 0
                          ? formatCurrency(row.totalCredits)
                          : '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <span
                        className={
                          row.netBalance >= 0
                            ? 'text-gray-900 dark:text-white'
                            : 'text-red-600 dark:text-red-400'
                        }
                      >
                        {formatCurrency(row.netBalance)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}

                {/* Totals Row */}
                <TableRow className="bg-gray-100 font-bold dark:bg-gray-800">
                  <TableCell
                    colSpan={2}
                    className="text-gray-900 dark:text-white"
                  >
                    TOTALS
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <span className="text-primary-600 dark:text-primary-400">
                      {formatCurrency(totals.totalDebits)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <span className="text-green-600 dark:text-green-400">
                      {formatCurrency(totals.totalCredits)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <div className="flex items-center justify-end gap-2">
                      <span
                        className={
                          totals.isBalanced
                            ? 'text-gray-900 dark:text-white'
                            : 'text-red-600 dark:text-red-400'
                        }
                      >
                        {formatCurrency(
                          totals.totalDebits - totals.totalCredits
                        )}
                      </span>
                      {totals.isBalanced ? (
                        <HiCheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <HiExclamationCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </div>

        {/* Footer */}
        {!isLoading && filteredData.length > 0 && (
          <div className="border-t border-gray-200 p-4 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {filteredData.length} accounts | View:{' '}
              {viewMode === 'coa' ? 'Chart of Accounts' : 'US-GAAP Aggregated'}
            </p>
          </div>
        )}
      </Card>
    </PageLayout>
  )
}

export default TrialBalanceContent
