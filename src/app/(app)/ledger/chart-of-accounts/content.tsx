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
} from 'flowbite-react'
import type { FC } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  HiCollection,
  HiExclamationCircle,
  HiSearch,
  HiViewList,
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

const ChartOfAccountsContent: FC = function () {
  const { state: graphState } = useGraphContext()
  const [accounts, setAccounts] = useState<AccountRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClassification, setSelectedClassification] =
    useState<ElementClassification | null>(null)

  // Load accounts from all roboledger graphs using tree endpoint
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const roboledgerGraphs = graphState.graphs.filter(
          GraphFilters.roboledger
        )

        if (roboledgerGraphs.length === 0) {
          setAccounts([])
          return
        }

        const allAccounts: AccountRow[] = []

        for (const graph of roboledgerGraphs) {
          try {
            const response = await SDK.getLedgerAccountTree({
              path: { graph_id: graph.graphId },
            })

            if (response.data) {
              const roots = (response.data.roots || []) as TreeNode[]
              roots.sort((a, b) => {
                const ta = ACCOUNT_TYPE_ORDER[a.account_type || ''] ?? 99
                const tb = ACCOUNT_TYPE_ORDER[b.account_type || ''] ?? 99
                if (ta !== tb) return ta - tb
                return a.name.localeCompare(b.name)
              })
              allAccounts.push(
                ...flattenTree(roots, graph.graphId, graph.graphName)
              )
            }
          } catch (err) {
            console.error(
              `Error loading accounts from graph ${graph.graphName}:`,
              err
            )
          }
        }

        setAccounts(allAccounts)
      } catch (err) {
        console.error('Error loading accounts:', err)
        setError('Failed to load chart of accounts. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    loadAccounts()
  }, [graphState.graphs])

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

  return (
    <PageLayout>
      <PageHeader
        icon={HiCollection}
        title="Chart of Accounts"
        description="View and search all accounts across your ledger graphs"
        gradient="from-blue-500 to-cyan-600"
      />

      {/* Filters */}
      <Card theme={customTheme.card}>
        <div className="space-y-4 p-4">
          {/* Search and Filters */}
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

          {/* Classification Filter Pills */}
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
              </TableHead>
              <TableBody>
                {filteredAccounts.map((account) => (
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
                        {account.balance_type === 'debit' ? 'Debit' : 'Credit'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
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
