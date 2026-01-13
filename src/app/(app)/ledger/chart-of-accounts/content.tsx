'use client'

import { PageHeader } from '@/components/PageHeader'
import {
  customTheme,
  GraphFilters,
  PageLayout,
  SDK,
  useGraphContext,
} from '@/lib/core'
import type { Element, ElementClassification } from '@/lib/ledger'
import { ELEMENTS_QUERY } from '@/lib/ledger'
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

interface ElementWithGraph extends Element {
  _graphId: string
  _graphName: string
}

const ChartOfAccountsContent: FC = function () {
  const { state: graphState } = useGraphContext()
  const [elements, setElements] = useState<ElementWithGraph[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClassification, setSelectedClassification] =
    useState<ElementClassification | null>(null)
  const [showAbstract, setShowAbstract] = useState(false)

  // Load elements from all roboledger graphs
  useEffect(() => {
    const loadElements = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Filter to only roboledger graphs
        const roboledgerGraphs = graphState.graphs.filter(
          GraphFilters.roboledger
        )

        if (roboledgerGraphs.length === 0) {
          setElements([])
          return
        }

        const allElements: ElementWithGraph[] = []

        for (const graph of roboledgerGraphs) {
          try {
            const response = await SDK.executeCypherQuery({
              path: { graph_id: graph.graphId },
              query: { mode: 'sync' },
              body: {
                query: ELEMENTS_QUERY,
                parameters: {},
              },
            })

            if (response.data) {
              const data = response.data as {
                data?: Array<{
                  identifier: string
                  uri: string
                  qname: string
                  name: string
                  classification: ElementClassification
                  balance: 'debit' | 'credit'
                  periodType: 'instant' | 'duration'
                  type: string
                  itemType?: string
                  isAbstract: boolean
                  isNumeric: boolean
                  isDimensionItem: boolean
                  isDomainMember: boolean
                  isHypercubeItem: boolean
                }>
              }
              const rows = data.data || []

              const graphElements: ElementWithGraph[] = rows.map((row) => ({
                identifier: row.identifier || '',
                uri: row.uri || '',
                qname: row.qname || '',
                name: row.name || row.identifier || 'Unnamed Element',
                classification: row.classification,
                balance: row.balance || 'debit',
                periodType: row.periodType || 'instant',
                type: row.type || '',
                itemType: row.itemType,
                isAbstract: row.isAbstract || false,
                isNumeric: row.isNumeric !== false,
                isDimensionItem: row.isDimensionItem || false,
                isDomainMember: row.isDomainMember || false,
                isHypercubeItem: row.isHypercubeItem || false,
                _graphId: graph.graphId,
                _graphName: graph.graphName,
              }))

              allElements.push(...graphElements)
            }
          } catch (err) {
            console.error(
              `Error loading elements from graph ${graph.graphName}:`,
              err
            )
          }
        }

        setElements(allElements)
      } catch (err) {
        console.error('Error loading elements:', err)
        setError('Failed to load chart of accounts. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    loadElements()
  }, [graphState.graphs])

  // Filter elements
  const filteredElements = useMemo(() => {
    return elements.filter((element) => {
      // Filter by search term
      const matchesSearch =
        searchTerm === '' ||
        element.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        element.identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (element.qname?.toLowerCase().includes(searchTerm.toLowerCase()) ??
          false)

      // Filter by classification
      const matchesClassification =
        selectedClassification === null ||
        element.classification === selectedClassification

      // Filter abstract elements
      const matchesAbstract = showAbstract || !element.isAbstract

      return matchesSearch && matchesClassification && matchesAbstract
    })
  }, [elements, searchTerm, selectedClassification, showAbstract])

  // Count by classification
  const classificationCounts = useMemo(() => {
    const counts: Record<ElementClassification, number> = {
      asset: 0,
      liability: 0,
      equity: 0,
      revenue: 0,
      expense: 0,
    }
    elements.forEach((element) => {
      if (
        element.classification &&
        counts[element.classification] !== undefined
      ) {
        counts[element.classification]++
      }
    })
    return counts
  }, [elements])

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
            <div className="flex items-center gap-2">
              <ToggleSwitch
                checked={showAbstract}
                onChange={setShowAbstract}
                label="Show abstract"
                theme={customTheme.toggleSwitch}
              />
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
              All ({elements.length})
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
          ) : elements.length === 0 ? (
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
          ) : filteredElements.length === 0 ? (
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
                <TableHeadCell>Period Type</TableHeadCell>
              </TableHead>
              <TableBody>
                {filteredElements.map((element) => (
                  <TableRow key={`${element._graphId}-${element.identifier}`}>
                    <TableCell className="font-medium text-gray-900 dark:text-white">
                      <div className="flex flex-col">
                        <span className="font-semibold">
                          {element.name}
                          {element.isAbstract && (
                            <Badge
                              color="gray"
                              size="xs"
                              className="ml-2 inline"
                            >
                              Abstract
                            </Badge>
                          )}
                        </span>
                        <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                          {element.qname || element.identifier}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        color={
                          CLASSIFICATION_COLORS[element.classification] ||
                          'gray'
                        }
                        size="sm"
                      >
                        {CLASSIFICATION_LABELS[element.classification] ||
                          element.classification}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-sm font-medium ${
                          element.balance === 'debit'
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}
                      >
                        {element.balance === 'debit' ? 'Debit' : 'Credit'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {element.periodType === 'instant'
                          ? 'Instant'
                          : 'Duration'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Summary Footer */}
        {!isLoading && filteredElements.length > 0 && (
          <div className="border-t border-gray-200 p-4 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {filteredElements.length} of {elements.length} accounts
            </p>
          </div>
        )}
      </Card>
    </PageLayout>
  )
}

export default ChartOfAccountsContent
