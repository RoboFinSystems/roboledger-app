'use client'

import { PageHeader } from '@/components/PageHeader'
import {
  customTheme,
  GraphFilters,
  PageLayout,
  SDK,
  useGraphContext,
} from '@/lib/core'
import type { ElementClassification } from '@/lib/ledger'
import {
  Alert,
  Badge,
  Card,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  TextInput,
  ToggleSwitch,
} from 'flowbite-react'
import type { FC } from 'react'
import { useEffect, useMemo, useState } from 'react'
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

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

type ViewMode = 'coa' | 'usgaap'

const TrialBalanceContent: FC = function () {
  const { state: graphState } = useGraphContext()
  const [data, setData] = useState<TrialBalanceRowWithGraph[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('coa')

  // Load trial balance data
  useEffect(() => {
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

        for (const graph of [currentGraph]) {
          try {
            const response = await SDK.getLedgerTrialBalance({
              path: { graph_id: graph.graphId },
            })

            if (response.data) {
              const rows = response.data.rows || []
              const graphRows: TrialBalanceRowWithGraph[] = rows.map((row) => ({
                accountId: row.account_id,
                accountCode: row.account_code,
                accountName: row.account_name,
                classification: row.classification as ElementClassification,
                accountType:
                  ((row as Record<string, unknown>).account_type as
                    | string
                    | null) ?? null,
                totalDebits: row.total_debits,
                totalCredits: row.total_credits,
                netBalance: row.net_balance,
                _graphId: graph.graphId,
                _graphName: graph.graphName,
              }))

              allRows.push(...graphRows)
            }
          } catch (err) {
            console.error(
              `Error loading trial balance from graph ${graph.graphName}:`,
              err
            )
          }
        }

        allRows.sort((a, b) => {
          const ta = ACCOUNT_TYPE_ORDER[a.accountType || ''] ?? 99
          const tb = ACCOUNT_TYPE_ORDER[b.accountType || ''] ?? 99
          if (ta !== tb) return ta - tb
          return a.accountName.localeCompare(b.accountName)
        })
        setData(allRows)
      } catch (err) {
        console.error('Error loading trial balance:', err)
        setError('Failed to load trial balance. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    loadTrialBalance()
  }, [graphState.graphs, graphState.currentGraphId])

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

  // Calculate totals
  const totals = useMemo(() => {
    const totalDebits = filteredData.reduce(
      (sum, row) => sum + row.totalDebits,
      0
    )
    const totalCredits = filteredData.reduce(
      (sum, row) => sum + row.totalCredits,
      0
    )
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01

    return { totalDebits, totalCredits, isBalanced }
  }, [filteredData])

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
        description="View account balances with debits and credits verification"
        gradient="from-purple-500 to-pink-600"
      />

      {/* Filters */}
      <Card theme={customTheme.card}>
        <div className="flex flex-wrap items-end gap-4 p-4">
          {/* Search */}
          <div className="w-full sm:w-64">
            <div className="relative">
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

          {/* View Mode Toggle */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span
                className={`text-sm ${viewMode === 'coa' ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
              >
                Chart of Accounts
              </span>
              <ToggleSwitch
                checked={viewMode === 'usgaap'}
                onChange={(checked) => setViewMode(checked ? 'usgaap' : 'coa')}
                theme={customTheme.toggleSwitch}
              />
              <span
                className={`text-sm ${viewMode === 'usgaap' ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
              >
                US-GAAP
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* US-GAAP Mode Notice */}
      {viewMode === 'usgaap' && (
        <Alert theme={customTheme.alert} color="info">
          <span className="font-medium">US-GAAP View:</span> This view
          aggregates accounts using element mappings. Configure mappings in{' '}
          <a href="/ledger/mappings" className="font-medium underline">
            Mappings
          </a>{' '}
          to see aggregated balances.
        </Alert>
      )}

      {error && (
        <Alert theme={customTheme.alert} color="failure">
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
            <Card key={classification} theme={customTheme.card} className="p-3">
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
                  <span className="font-mono text-blue-600 dark:text-blue-400">
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

      <Card theme={customTheme.card}>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : data.length === 0 ? (
            <div className="py-12 text-center">
              <TbReportMoney className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No Trial Balance Data
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                No transaction data found to generate trial balance.
              </p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="py-12 text-center">
              <HiSearch className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No Matching Accounts
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Try adjusting your search.
              </p>
            </div>
          ) : (
            <Table theme={customTheme.table}>
              <TableHead>
                <TableHeadCell>Account</TableHeadCell>
                <TableHeadCell>Classification</TableHeadCell>
                <TableHeadCell className="text-right">Debits</TableHeadCell>
                <TableHeadCell className="text-right">Credits</TableHeadCell>
                <TableHeadCell className="text-right">
                  Net Balance
                </TableHeadCell>
              </TableHead>
              <TableBody>
                {filteredData.map((row) => (
                  <TableRow key={`${row._graphId}-${row.accountId}`}>
                    <TableCell className="font-medium text-gray-900 dark:text-white">
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
                      <span className="text-blue-600 dark:text-blue-400">
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
                    <span className="text-blue-600 dark:text-blue-400">
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
