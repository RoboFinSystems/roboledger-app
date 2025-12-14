'use client'

import { PageHeader } from '@/components/PageHeader'
import {
  customTheme,
  GraphFilters,
  PageLayout,
  SDK,
  useGraphContext,
} from '@/lib/core'
import type { LineItem, Transaction } from '@/lib/ledger'
import { LINE_ITEMS_QUERY, TRANSACTIONS_QUERY } from '@/lib/ledger'
import {
  Alert,
  Badge,
  Card,
  Select,
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
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  HiChevronDown,
  HiChevronRight,
  HiExclamationCircle,
  HiSearch,
} from 'react-icons/hi'
import { TbReceipt } from 'react-icons/tb'

const TRANSACTION_TYPE_COLORS: Record<string, string> = {
  Revenue: 'success',
  Expense: 'failure',
  Transfer: 'info',
  Adjustment: 'warning',
  Opening: 'purple',
}

interface TransactionWithGraph extends Transaction {
  _graphId: string
  _graphName: string
}

interface LineItemWithGraph extends LineItem {
  _graphId: string
}

// Mock data for screenshots
const MOCK_TRANSACTIONS: TransactionWithGraph[] = [
  {
    identifier: 'txn-001',
    uri: 'urn:transaction:txn-001',
    transactionNumber: 'JE-2025-001245',
    date: '2025-12-31',
    description: 'Monthly revenue recognition - December 2025',
    transactionType: 'Revenue',
    amount: 245000,
    referenceNumber: 'REV-DEC-2025',
    currency: 'USD',
    updatedAt: '2025-12-31T23:59:59Z',
    _graphId: 'demo-graph-1',
    _graphName: 'acme-corp',
  },
  {
    identifier: 'txn-002',
    uri: 'urn:transaction:txn-002',
    transactionNumber: 'JE-2025-001244',
    date: '2025-12-31',
    description: 'Payroll expense accrual',
    transactionType: 'Expense',
    amount: 125000,
    referenceNumber: 'PR-DEC-2025',
    currency: 'USD',
    updatedAt: '2025-12-31T18:00:00Z',
    _graphId: 'demo-graph-1',
    _graphName: 'acme-corp',
  },
  {
    identifier: 'txn-003',
    uri: 'urn:transaction:txn-003',
    transactionNumber: 'JE-2025-001243',
    date: '2025-12-28',
    description: 'Office supplies purchase',
    transactionType: 'Expense',
    amount: 3500,
    referenceNumber: 'PO-2025-0892',
    currency: 'USD',
    updatedAt: '2025-12-28T14:30:00Z',
    _graphId: 'demo-graph-1',
    _graphName: 'acme-corp',
  },
  {
    identifier: 'txn-004',
    uri: 'urn:transaction:txn-004',
    transactionNumber: 'JE-2025-001242',
    date: '2025-12-27',
    description: 'Cash transfer to savings account',
    transactionType: 'Transfer',
    amount: 500000,
    referenceNumber: 'TRF-2025-0156',
    currency: 'USD',
    updatedAt: '2025-12-27T10:15:00Z',
    _graphId: 'demo-graph-1',
    _graphName: 'acme-corp',
  },
  {
    identifier: 'txn-005',
    uri: 'urn:transaction:txn-005',
    transactionNumber: 'JE-2025-001241',
    date: '2025-12-23',
    description: 'Client payment received - Invoice #INV-2025-089',
    transactionType: 'Revenue',
    amount: 87500,
    referenceNumber: 'REC-2025-0445',
    currency: 'USD',
    updatedAt: '2025-12-23T16:45:00Z',
    _graphId: 'demo-graph-1',
    _graphName: 'acme-corp',
  },
  {
    identifier: 'txn-006',
    uri: 'urn:transaction:txn-006',
    transactionNumber: 'JE-2025-001240',
    date: '2025-12-20',
    description: 'Depreciation expense - Q4 2025',
    transactionType: 'Adjustment',
    amount: 45000,
    referenceNumber: 'DEP-Q4-2025',
    currency: 'USD',
    updatedAt: '2025-12-20T09:00:00Z',
    _graphId: 'demo-graph-1',
    _graphName: 'acme-corp',
  },
  {
    identifier: 'txn-007',
    uri: 'urn:transaction:txn-007',
    transactionNumber: 'JE-2025-001239',
    date: '2025-12-15',
    description: 'Software subscription renewal - Annual',
    transactionType: 'Expense',
    amount: 24000,
    referenceNumber: 'SUB-2025-0078',
    currency: 'USD',
    updatedAt: '2025-12-15T11:30:00Z',
    _graphId: 'demo-graph-1',
    _graphName: 'acme-corp',
  },
]

const MOCK_LINE_ITEMS: Record<string, LineItemWithGraph[]> = {
  'demo-graph-1-txn-001': [
    {
      identifier: 'li-001-1',
      uri: 'urn:lineitem:li-001-1',
      description: 'Product revenue - Enterprise licenses',
      debitAmount: 0,
      creditAmount: 185000,
      accountName: 'Product Revenue',
      accountId: 'product-revenue',
      updatedAt: '2025-12-31T23:59:59Z',
      _graphId: 'demo-graph-1',
    },
    {
      identifier: 'li-001-2',
      uri: 'urn:lineitem:li-001-2',
      description: 'Service revenue - Implementation fees',
      debitAmount: 0,
      creditAmount: 60000,
      accountName: 'Service Revenue',
      accountId: 'service-revenue',
      updatedAt: '2025-12-31T23:59:59Z',
      _graphId: 'demo-graph-1',
    },
    {
      identifier: 'li-001-3',
      uri: 'urn:lineitem:li-001-3',
      description: 'Accounts receivable increase',
      debitAmount: 245000,
      creditAmount: 0,
      accountName: 'Accounts Receivable, Net',
      accountId: 'accounts-receivable',
      updatedAt: '2025-12-31T23:59:59Z',
      _graphId: 'demo-graph-1',
    },
  ],
  'demo-graph-1-txn-002': [
    {
      identifier: 'li-002-1',
      uri: 'urn:lineitem:li-002-1',
      description: 'Salaries expense',
      debitAmount: 95000,
      creditAmount: 0,
      accountName: 'General and Administrative',
      accountId: 'general-administrative',
      updatedAt: '2025-12-31T18:00:00Z',
      _graphId: 'demo-graph-1',
    },
    {
      identifier: 'li-002-2',
      uri: 'urn:lineitem:li-002-2',
      description: 'Benefits expense',
      debitAmount: 30000,
      creditAmount: 0,
      accountName: 'General and Administrative',
      accountId: 'general-administrative',
      updatedAt: '2025-12-31T18:00:00Z',
      _graphId: 'demo-graph-1',
    },
    {
      identifier: 'li-002-3',
      uri: 'urn:lineitem:li-002-3',
      description: 'Accrued payroll liability',
      debitAmount: 0,
      creditAmount: 125000,
      accountName: 'Accrued Expenses',
      accountId: 'accrued-expenses',
      updatedAt: '2025-12-31T18:00:00Z',
      _graphId: 'demo-graph-1',
    },
  ],
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const TransactionsContent: FC = function () {
  const { state: graphState } = useGraphContext()
  const [transactions, setTransactions] = useState<TransactionWithGraph[]>([])
  const [lineItemsMap, setLineItemsMap] = useState<
    Record<string, LineItemWithGraph[]>
  >({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [loadingLineItems, setLoadingLineItems] = useState<Set<string>>(
    new Set()
  )
  const [startDate, setStartDate] = useState<string | null>(null)
  const [endDate, setEndDate] = useState<string | null>(null)

  // Get unique transaction types
  const transactionTypes = useMemo(() => {
    const types = new Set(transactions.map((t) => t.transactionType))
    return Array.from(types).filter(Boolean).sort()
  }, [transactions])

  // Load transactions from all roboledger graphs
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const roboledgerGraphs = graphState.graphs.filter(
          GraphFilters.roboledger
        )

        if (roboledgerGraphs.length === 0) {
          setTransactions([])
          return
        }

        const allTransactions: TransactionWithGraph[] = []

        for (const graph of roboledgerGraphs) {
          try {
            const response = await SDK.executeCypherQuery({
              path: { graph_id: graph.graphId },
              query: { mode: 'sync' },
              body: {
                query: TRANSACTIONS_QUERY,
                parameters: {
                  startDate: startDate || null,
                  endDate: endDate || null,
                  limit: 500,
                },
              },
            })

            if (response.data) {
              const data = response.data as {
                data?: Array<{
                  identifier: string
                  uri: string
                  transactionNumber: string
                  date: string
                  description: string
                  transactionType: string
                  amount: number
                  referenceNumber: string
                  currency: string
                  updatedAt: string
                }>
              }
              const rows = data.data || []

              const graphTransactions: TransactionWithGraph[] = rows.map(
                (row) => ({
                  identifier: row.identifier || '',
                  uri: row.uri || '',
                  transactionNumber: row.transactionNumber || row.identifier,
                  date: row.date || '',
                  description: row.description || '',
                  transactionType: row.transactionType || '',
                  amount: row.amount || 0,
                  referenceNumber: row.referenceNumber || '',
                  currency: row.currency || 'USD',
                  updatedAt: row.updatedAt || '',
                  _graphId: graph.graphId,
                  _graphName: graph.graphName,
                })
              )

              allTransactions.push(...graphTransactions)
            }
          } catch (err) {
            console.error(
              `Error loading transactions from graph ${graph.graphName}:`,
              err
            )
          }
        }

        // Sort by date descending
        allTransactions.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )

        // Use mock data if no real transactions found (for screenshots)
        if (allTransactions.length === 0) {
          setTransactions(MOCK_TRANSACTIONS)
          setLineItemsMap(MOCK_LINE_ITEMS)
        } else {
          setTransactions(allTransactions)
        }
      } catch (err) {
        console.error('Error loading transactions:', err)
        setError('Failed to load transactions. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    loadTransactions()
  }, [graphState.graphs, startDate, endDate])

  // Load line items for a transaction
  const loadLineItems = useCallback(
    async (transaction: TransactionWithGraph) => {
      const key = `${transaction._graphId}-${transaction.identifier}`

      if (lineItemsMap[key]) {
        return // Already loaded
      }

      // Check if we have mock data for this transaction
      if (MOCK_LINE_ITEMS[key]) {
        setLineItemsMap((prev) => ({
          ...prev,
          [key]: MOCK_LINE_ITEMS[key],
        }))
        return
      }

      setLoadingLineItems((prev) => new Set(prev).add(key))

      try {
        const response = await SDK.executeCypherQuery({
          path: { graph_id: transaction._graphId },
          query: { mode: 'sync' },
          body: {
            query: LINE_ITEMS_QUERY,
            parameters: {
              txId: transaction.identifier,
            },
          },
        })

        if (response.data) {
          const data = response.data as {
            data?: Array<{
              identifier: string
              uri: string
              description: string
              debitAmount: number
              creditAmount: number
              updatedAt: string
              accountName: string
              accountId: string
            }>
          }
          const rows = data.data || []

          const items: LineItemWithGraph[] = rows.map((row) => ({
            identifier: row.identifier || '',
            uri: row.uri || '',
            description: row.description || '',
            debitAmount: row.debitAmount || 0,
            creditAmount: row.creditAmount || 0,
            accountName: row.accountName || '',
            accountId: row.accountId || '',
            updatedAt: row.updatedAt || '',
            _graphId: transaction._graphId,
          }))

          setLineItemsMap((prev) => ({
            ...prev,
            [key]: items,
          }))
        }
      } catch (err) {
        console.error('Error loading line items:', err)
      } finally {
        setLoadingLineItems((prev) => {
          const next = new Set(prev)
          next.delete(key)
          return next
        })
      }
    },
    [lineItemsMap]
  )

  // Toggle expansion
  const toggleExpand = useCallback(
    (transaction: TransactionWithGraph) => {
      const key = `${transaction._graphId}-${transaction.identifier}`

      setExpandedIds((prev) => {
        const next = new Set(prev)
        if (next.has(key)) {
          next.delete(key)
        } else {
          next.add(key)
          // Load line items if not already loaded
          loadLineItems(transaction)
        }
        return next
      })
    },
    [loadLineItems]
  )

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch =
        searchTerm === '' ||
        tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.transactionNumber.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesType =
        transactionTypeFilter === '' ||
        tx.transactionType === transactionTypeFilter

      return matchesSearch && matchesType
    })
  }, [transactions, searchTerm, transactionTypeFilter])

  return (
    <PageLayout>
      <PageHeader
        icon={TbReceipt}
        title="Transactions"
        description="View transaction journal with line item details"
        gradient="from-green-500 to-teal-600"
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
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <div>
              <label
                htmlFor="startDate"
                className="mb-1 block text-xs text-gray-500 dark:text-gray-400"
              >
                Start Date
              </label>
              <TextInput
                id="startDate"
                theme={customTheme.textInput}
                type="date"
                value={startDate || ''}
                onChange={(e) => setStartDate(e.target.value || null)}
              />
            </div>
            <div>
              <label
                htmlFor="endDate"
                className="mb-1 block text-xs text-gray-500 dark:text-gray-400"
              >
                End Date
              </label>
              <TextInput
                id="endDate"
                theme={customTheme.textInput}
                type="date"
                value={endDate || ''}
                onChange={(e) => setEndDate(e.target.value || null)}
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="w-full sm:w-48">
            <label
              htmlFor="typeFilter"
              className="mb-1 block text-xs text-gray-500 dark:text-gray-400"
            >
              Type
            </label>
            <Select
              id="typeFilter"
              theme={customTheme.select}
              value={transactionTypeFilter}
              onChange={(e) => setTransactionTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              {transactionTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {error && (
        <Alert theme={customTheme.alert} color="failure">
          <HiExclamationCircle className="h-4 w-4" />
          <span className="font-medium">Error!</span> {error}
        </Alert>
      )}

      <Card theme={customTheme.card}>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center">
              <Card theme={customTheme.card}>
                <TbReceipt className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <h3 className="font-heading mb-4 text-xl font-bold dark:text-white">
                  No Transactions Found
                </h3>
                <p className="mb-4 text-gray-500 dark:text-gray-400">
                  No transactions found in your roboledger graphs.
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Import accounting data to see transactions here.
                </p>
              </Card>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-8 text-center">
              <Card theme={customTheme.card}>
                <HiSearch className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <h3 className="font-heading mb-4 text-xl font-bold dark:text-white">
                  No Matching Transactions
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Try adjusting your search or filters.
                </p>
              </Card>
            </div>
          ) : (
            <Table theme={customTheme.table}>
              <TableHead>
                <TableHeadCell className="w-10"></TableHeadCell>
                <TableHeadCell>Date</TableHeadCell>
                <TableHeadCell>Description</TableHeadCell>
                <TableHeadCell>Type</TableHeadCell>
                <TableHeadCell className="text-right">Amount</TableHeadCell>
              </TableHead>
              <TableBody>
                {filteredTransactions.map((tx) => {
                  const key = `${tx._graphId}-${tx.identifier}`
                  const isExpanded = expandedIds.has(key)
                  const isLoadingItems = loadingLineItems.has(key)
                  const lineItems = lineItemsMap[key] || []

                  return (
                    <>
                      <TableRow
                        key={key}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                        onClick={() => toggleExpand(tx)}
                      >
                        <TableCell className="w-10">
                          {isExpanded ? (
                            <HiChevronDown className="h-5 w-5 text-gray-500" />
                          ) : (
                            <HiChevronRight className="h-5 w-5 text-gray-500" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap text-gray-900 dark:text-white">
                          {formatDate(tx.date)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {tx.description}
                            </span>
                            <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                              {tx.transactionNumber}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            color={
                              TRANSACTION_TYPE_COLORS[tx.transactionType] ||
                              'gray'
                            }
                            size="sm"
                          >
                            {tx.transactionType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {tx.amount ? formatCurrency(tx.amount) : '-'}
                        </TableCell>
                      </TableRow>

                      {/* Expanded line items */}
                      {isExpanded && (
                        <TableRow
                          key={`${key}-details`}
                          className="bg-gray-50 dark:bg-gray-800"
                        >
                          <TableCell colSpan={5} className="p-0">
                            <div className="px-8 py-4">
                              {isLoadingItems ? (
                                <div className="flex justify-center py-4">
                                  <Spinner size="sm" />
                                </div>
                              ) : lineItems.length === 0 ? (
                                <p className="py-2 text-center text-sm text-gray-500 dark:text-gray-400">
                                  No line items found
                                </p>
                              ) : (
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase dark:border-gray-600 dark:text-gray-400">
                                      <th className="py-2">Account</th>
                                      <th className="py-2">Description</th>
                                      <th className="py-2 text-right">Debit</th>
                                      <th className="py-2 text-right">
                                        Credit
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {lineItems.map((li, idx) => (
                                      <tr
                                        key={li.identifier}
                                        className={
                                          idx < lineItems.length - 1
                                            ? 'border-b border-gray-100 dark:border-gray-700'
                                            : ''
                                        }
                                      >
                                        <td className="py-2 font-medium text-gray-900 dark:text-white">
                                          {li.accountName || li.accountId}
                                        </td>
                                        <td className="py-2 text-gray-600 dark:text-gray-400">
                                          {li.description || '-'}
                                        </td>
                                        <td className="py-2 text-right font-mono text-blue-600 dark:text-blue-400">
                                          {li.debitAmount
                                            ? formatCurrency(li.debitAmount)
                                            : '-'}
                                        </td>
                                        <td className="py-2 text-right font-mono text-green-600 dark:text-green-400">
                                          {li.creditAmount
                                            ? formatCurrency(li.creditAmount)
                                            : '-'}
                                        </td>
                                      </tr>
                                    ))}
                                    {/* Totals row */}
                                    <tr className="border-t-2 border-gray-300 font-medium dark:border-gray-500">
                                      <td
                                        className="py-2 text-gray-900 dark:text-white"
                                        colSpan={2}
                                      >
                                        Total
                                      </td>
                                      <td className="py-2 text-right font-mono text-blue-600 dark:text-blue-400">
                                        {formatCurrency(
                                          lineItems.reduce(
                                            (sum, li) =>
                                              sum + (li.debitAmount || 0),
                                            0
                                          )
                                        )}
                                      </td>
                                      <td className="py-2 text-right font-mono text-green-600 dark:text-green-400">
                                        {formatCurrency(
                                          lineItems.reduce(
                                            (sum, li) =>
                                              sum + (li.creditAmount || 0),
                                            0
                                          )
                                        )}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Summary Footer */}
        {!isLoading && filteredTransactions.length > 0 && (
          <div className="border-t border-gray-200 p-4 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {filteredTransactions.length} of {transactions.length}{' '}
              transactions
            </p>
          </div>
        )}
      </Card>
    </PageLayout>
  )
}

export default TransactionsContent
