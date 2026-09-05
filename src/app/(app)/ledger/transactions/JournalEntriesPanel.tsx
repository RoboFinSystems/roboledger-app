'use client'

import { clients, EmptyState, LoadingState } from '@robosystems/core'
import {
  Alert,
  Badge,
  Card,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  TextInput,
} from 'flowbite-react'
import { type FC, Fragment, useCallback, useEffect, useState } from 'react'
import {
  HiChevronDown,
  HiChevronRight,
  HiExclamationCircle,
  HiSearch,
} from 'react-icons/hi'
import { TbBook2 } from 'react-icons/tb'

const ENTRY_TYPE_COLORS: Record<string, string> = {
  standard: 'info',
  adjusting: 'warning',
  closing: 'purple',
  reversing: 'failure',
}

/**
 * Where an entry came from. `schedule_derived` is the set a period close
 * posts — depreciation, amortization, accruals — and is exactly the set
 * the Transactions tab cannot show, because those entries carry no parent
 * transaction.
 */
const PROVENANCE_LABELS: Record<string, string> = {
  source_sync: 'Synced',
  ai_generated: 'AI generated',
  manual_entry: 'Manual',
  schedule_derived: 'Schedule',
  system_computed: 'System',
  event_handler: 'Event handler',
}

interface JournalLineItem {
  id: string
  accountName: string | null
  accountCode: string | null
  debitAmount: number
  creditAmount: number
  description: string | null
}

interface JournalEntryRow {
  id: string
  number: string | null
  transactionId: string | null
  type: string
  status: string
  postingDate: string
  memo: string | null
  provenance: string | null
  sourceStructureName: string | null
  totalDebit: number
  totalCredit: number
  balanced: boolean
  lineItems: JournalLineItem[]
}

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)

const formatDate = (dateString: string): string =>
  new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

interface JournalEntriesPanelProps {
  graphId: string
  startDate: string | null
  endDate: string | null
  refreshKey: number
}

/**
 * The journal — every posted or draft entry, whether or not it hangs off a
 * transaction.
 *
 * The Transactions tab lists transactions and expands entries underneath
 * them, so it cannot show an entry with no parent. The schedule engine and
 * the event handlers create exactly those, which means everything a period
 * close posts is absent there. This panel reads entries directly.
 *
 * Line items arrive with the entry, so expanding a row costs no request —
 * unlike the transaction detail, which fetches on expand.
 */
export const JournalEntriesPanel: FC<JournalEntriesPanelProps> = function ({
  graphId,
  startDate,
  endDate,
  refreshKey,
}) {
  const [entries, setEntries] = useState<JournalEntryRow[]>([])
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [provenanceFilter, setProvenanceFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('posted')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const result = await clients.ledger.listJournalEntries(graphId, {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          status: statusFilter || undefined,
          type: typeFilter || undefined,
          provenance: provenanceFilter || undefined,
          limit: 500,
        })
        if (cancelled) return

        const rows = result?.entries ?? []
        setEntries(
          rows.map((row) => ({
            id: row.id,
            number: row.number,
            transactionId: row.transactionId,
            type: row.type,
            status: row.status,
            postingDate: row.postingDate,
            memo: row.memo,
            provenance: row.provenance,
            sourceStructureName: row.sourceStructureName,
            totalDebit: row.totalDebit,
            totalCredit: row.totalCredit,
            balanced: row.balanced,
            lineItems: row.lineItems.map((li) => ({
              id: li.id,
              accountName: li.accountName,
              accountCode: li.accountCode,
              debitAmount: li.debitAmount,
              creditAmount: li.creditAmount,
              description: li.description,
            })),
          }))
        )
        setTotalCount(result ? (result.pagination?.total ?? rows.length) : null)
      } catch (err) {
        if (cancelled) return
        console.error('Error loading journal entries:', err)
        setError('Failed to load journal entries. Please try again.')
        setEntries([])
        setTotalCount(null)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [
    graphId,
    startDate,
    endDate,
    statusFilter,
    typeFilter,
    provenanceFilter,
    refreshKey,
  ])

  const toggleExpand = useCallback((entryId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(entryId)) {
        next.delete(entryId)
      } else {
        next.add(entryId)
      }
      return next
    })
  }, [])

  // Search is client-side over the loaded page; the server filters carry
  // the rest, so this only narrows what is already on screen.
  const visibleEntries = entries.filter((entry) => {
    if (searchTerm === '') return true
    const needle = searchTerm.toLowerCase()
    return (
      (entry.memo || '').toLowerCase().includes(needle) ||
      (entry.sourceStructureName || '').toLowerCase().includes(needle) ||
      (entry.number || entry.id).toLowerCase().includes(needle)
    )
  })

  return (
    <>
      <Card>
        <div className="flex flex-wrap items-end gap-4 p-4">
          <div className="w-full sm:w-64">
            <label
              htmlFor="entrySearch"
              className="mb-1 block text-xs text-gray-500 dark:text-gray-400"
            >
              Search
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <HiSearch className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </div>
              <TextInput
                id="entrySearch"
                placeholder="Memo, schedule, or entry ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="w-full sm:w-40">
            <label
              htmlFor="entryStatus"
              className="mb-1 block text-xs text-gray-500 dark:text-gray-400"
            >
              Status
            </label>
            <Select
              id="entryStatus"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="posted">Posted</option>
              <option value="draft">Draft</option>
              <option value="reversed">Reversed</option>
              <option value="">All</option>
            </Select>
          </div>

          <div className="w-full sm:w-40">
            <label
              htmlFor="entryType"
              className="mb-1 block text-xs text-gray-500 dark:text-gray-400"
            >
              Type
            </label>
            <Select
              id="entryType"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="standard">Standard</option>
              <option value="adjusting">Adjusting</option>
              <option value="closing">Closing</option>
              <option value="reversing">Reversing</option>
            </Select>
          </div>

          <div className="w-full sm:w-48">
            <label
              htmlFor="entryProvenance"
              className="mb-1 block text-xs text-gray-500 dark:text-gray-400"
            >
              Source
            </label>
            <Select
              id="entryProvenance"
              value={provenanceFilter}
              onChange={(e) => setProvenanceFilter(e.target.value)}
            >
              <option value="">All Sources</option>
              {Object.entries(PROVENANCE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {error && (
        <Alert color="failure">
          <HiExclamationCircle className="h-4 w-4" />
          <span className="font-medium">Error!</span> {error}
        </Alert>
      )}

      <Card>
        <div className="overflow-x-auto">
          {isLoading ? (
            <LoadingState />
          ) : entries.length === 0 ? (
            <EmptyState
              icon={TbBook2}
              title="No Journal Entries Found"
              description="No entries match these filters. Widen the date range or clear the source filter."
              className="p-8"
            />
          ) : visibleEntries.length === 0 ? (
            <EmptyState
              icon={HiSearch}
              title="No Matching Entries"
              description="Try adjusting your search."
              className="p-8"
            />
          ) : (
            <Table>
              <TableHead>
                <TableHeadCell className="w-10"></TableHeadCell>
                <TableHeadCell>Date</TableHeadCell>
                <TableHeadCell>Memo</TableHeadCell>
                <TableHeadCell>Type</TableHeadCell>
                <TableHeadCell>Source</TableHeadCell>
                <TableHeadCell className="text-right">Amount</TableHeadCell>
              </TableHead>
              <TableBody>
                {visibleEntries.map((entry) => {
                  const isExpanded = expandedIds.has(entry.id)

                  return (
                    <Fragment key={entry.id}>
                      <TableRow
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                        onClick={() => toggleExpand(entry.id)}
                      >
                        <TableCell className="w-10">
                          {isExpanded ? (
                            <HiChevronDown className="h-5 w-5 text-gray-500" />
                          ) : (
                            <HiChevronRight className="h-5 w-5 text-gray-500" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap text-gray-900 dark:text-white">
                          {formatDate(entry.postingDate)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {entry.memo || '-'}
                            </span>
                            <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                              {entry.number || entry.id}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge
                              color={ENTRY_TYPE_COLORS[entry.type] || 'gray'}
                              size="sm"
                            >
                              {entry.type}
                            </Badge>
                            {!entry.balanced && (
                              <Badge color="failure" size="sm">
                                unbalanced
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">
                              {entry.provenance
                                ? (PROVENANCE_LABELS[entry.provenance] ??
                                  entry.provenance)
                                : '-'}
                            </span>
                            {entry.sourceStructureName && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {entry.sourceStructureName}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {formatCurrency(entry.totalDebit)}
                        </TableCell>
                      </TableRow>

                      {isExpanded && (
                        <TableRow
                          key={`${entry.id}-details`}
                          className="bg-gray-50 dark:bg-gray-800"
                        >
                          <TableCell colSpan={6} className="p-0">
                            <div className="px-8 py-4">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase dark:border-gray-600 dark:text-gray-400">
                                    <th className="py-2">Account</th>
                                    <th className="py-2">Description</th>
                                    <th className="py-2 text-right">Debit</th>
                                    <th className="py-2 text-right">Credit</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {entry.lineItems.map((li, idx) => (
                                    <tr
                                      key={li.id}
                                      className={
                                        idx < entry.lineItems.length - 1
                                          ? 'border-b border-gray-100 dark:border-gray-700'
                                          : ''
                                      }
                                    >
                                      <td className="py-2 font-medium text-gray-900 dark:text-white">
                                        <div className="flex flex-col">
                                          <span>{li.accountName || '-'}</span>
                                          {li.accountCode && (
                                            <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                                              {li.accountCode}
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-2 text-gray-600 dark:text-gray-400">
                                        {li.description || '-'}
                                      </td>
                                      <td className="text-primary-600 dark:text-primary-400 py-2 text-right font-mono">
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
                                  <tr className="border-t-2 border-gray-300 font-medium dark:border-gray-500">
                                    <td
                                      className="py-2 text-gray-900 dark:text-white"
                                      colSpan={2}
                                    >
                                      Total
                                    </td>
                                    <td className="text-primary-600 dark:text-primary-400 py-2 text-right font-mono">
                                      {formatCurrency(entry.totalDebit)}
                                    </td>
                                    <td className="py-2 text-right font-mono text-green-600 dark:text-green-400">
                                      {formatCurrency(entry.totalCredit)}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
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

        {!isLoading && visibleEntries.length > 0 && (
          <div className="border-t border-gray-200 p-4 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {visibleEntries.length} of{' '}
              {(totalCount ?? entries.length).toLocaleString('en-US')} entries
              {totalCount != null && totalCount > entries.length && (
                <>
                  {' '}
                  (most recent {entries.length} loaded — narrow the date range
                  to see older entries)
                </>
              )}
            </p>
          </div>
        )}
      </Card>
    </>
  )
}
