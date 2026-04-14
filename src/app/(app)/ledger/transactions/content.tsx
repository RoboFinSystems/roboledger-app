'use client'

import { PageHeader } from '@/components/PageHeader'
import {
  customTheme,
  extensions,
  GraphFilters,
  PageLayout,
  useGraphContext,
} from '@/lib/core'
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
import {
  type FC,
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
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

interface TransactionRow {
  id: string
  number: string | null
  type: string
  category: string | null
  amount: number
  currency: string
  date: string
  merchant_name: string | null
  description: string | null
  source: string
  status: string
  _graphId: string
  _graphName: string
}

interface LineItemRow {
  id: string
  account_name: string | null
  account_code: string | null
  debit_amount: number
  credit_amount: number
  description: string | null
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const TransactionsContent: FC = function () {
  const { state: graphState } = useGraphContext()
  const [transactions, setTransactions] = useState<TransactionRow[]>([])
  const [lineItemsMap, setLineItemsMap] = useState<
    Record<string, LineItemRow[]>
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
    const types = new Set(transactions.map((t) => t.type))
    return Array.from(types).filter(Boolean).sort()
  }, [transactions])

  // Load transactions from all roboledger graphs
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const currentGraph = graphState.graphs
          .filter(GraphFilters.roboledger)
          .find((g) => g.graphId === graphState.currentGraphId)

        if (!currentGraph) {
          setTransactions([])
          return
        }

        const allTransactions: TransactionRow[] = []

        for (const graph of [currentGraph]) {
          try {
            const result = await extensions.ledger.listTransactions(
              graph.graphId,
              {
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                limit: 500,
              }
            )

            if (result) {
              const rows = result.transactions || []
              const graphTransactions: TransactionRow[] = rows.map((row) => ({
                id: row.id,
                number: row.number ?? null,
                type: row.type,
                category: row.category ?? null,
                amount: row.amount,
                currency: row.currency,
                date: row.date,
                merchant_name: row.merchantName ?? null,
                description: row.description ?? null,
                source: row.source,
                status: row.status,
                _graphId: graph.graphId,
                _graphName: graph.graphName,
              }))

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

        setTransactions(allTransactions)
      } catch (err) {
        console.error('Error loading transactions:', err)
        setError('Failed to load transactions. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    loadTransactions()
  }, [graphState.graphs, graphState.currentGraphId, startDate, endDate])

  // Load line items for a transaction via detail endpoint
  const loadLineItems = useCallback(
    async (transaction: TransactionRow) => {
      const key = `${transaction._graphId}-${transaction.id}`

      if (lineItemsMap[key]) {
        return // Already loaded
      }

      setLoadingLineItems((prev) => new Set(prev).add(key))

      try {
        const detail = await extensions.ledger.getTransaction(
          transaction._graphId,
          transaction.id
        )

        if (detail) {
          const items: LineItemRow[] = []
          for (const entry of detail.entries || []) {
            for (const li of entry.lineItems || []) {
              items.push({
                id: li.id,
                account_name: li.accountName ?? null,
                account_code: li.accountCode ?? null,
                debit_amount: li.debitAmount,
                credit_amount: li.creditAmount,
                description: li.description ?? null,
              })
            }
          }

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
    (transaction: TransactionRow) => {
      const key = `${transaction._graphId}-${transaction.id}`

      setExpandedIds((prev) => {
        const next = new Set(prev)
        if (next.has(key)) {
          next.delete(key)
        } else {
          next.add(key)
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
        (tx.description || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (tx.number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.merchant_name || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase())

      const matchesType =
        transactionTypeFilter === '' || tx.type === transactionTypeFilter

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
                  const key = `${tx._graphId}-${tx.id}`
                  const isExpanded = expandedIds.has(key)
                  const isLoadingItems = loadingLineItems.has(key)
                  const lineItems = lineItemsMap[key] || []

                  return (
                    <Fragment key={key}>
                      <TableRow
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
                              {tx.description || tx.merchant_name || '-'}
                            </span>
                            <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                              {tx.number || tx.id}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            color={TRANSACTION_TYPE_COLORS[tx.type] || 'gray'}
                            size="sm"
                          >
                            {tx.type}
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
                                        key={li.id}
                                        className={
                                          idx < lineItems.length - 1
                                            ? 'border-b border-gray-100 dark:border-gray-700'
                                            : ''
                                        }
                                      >
                                        <td className="py-2 font-medium text-gray-900 dark:text-white">
                                          <div className="flex flex-col">
                                            <span>
                                              {li.account_name || '-'}
                                            </span>
                                            {li.account_code && (
                                              <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                                                {li.account_code}
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                        <td className="py-2 text-gray-600 dark:text-gray-400">
                                          {li.description || '-'}
                                        </td>
                                        <td className="py-2 text-right font-mono text-blue-600 dark:text-blue-400">
                                          {li.debit_amount
                                            ? formatCurrency(li.debit_amount)
                                            : '-'}
                                        </td>
                                        <td className="py-2 text-right font-mono text-green-600 dark:text-green-400">
                                          {li.credit_amount
                                            ? formatCurrency(li.credit_amount)
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
                                              sum + (li.debit_amount || 0),
                                            0
                                          )
                                        )}
                                      </td>
                                      <td className="py-2 text-right font-mono text-green-600 dark:text-green-400">
                                        {formatCurrency(
                                          lineItems.reduce(
                                            (sum, li) =>
                                              sum + (li.credit_amount || 0),
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
                    </Fragment>
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
