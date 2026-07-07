'use client'

import {
  clients,
  EmptyState,
  GraphFilters,
  LoadingState,
  PageHeader,
  PageLayout,
  useGraphContext,
} from '@/lib/core'
import { formatAmount, formatDate } from '@/lib/ledger/formatters'
import type { LedgerAgent, LedgerEventBlock } from '@robosystems/client/clients'
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
import { useSearchParams } from 'next/navigation'
import { type FC, useCallback, useEffect, useMemo, useState } from 'react'
import { HiExclamationCircle, HiInbox, HiSearch } from 'react-icons/hi'
import EventBlockDetailModal from './EventBlockDetailModal'

const EVENT_TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'invoice_issued', label: 'Invoice issued' },
  { value: 'bill_received', label: 'Bill received' },
  { value: 'payment_received', label: 'Payment received' },
  { value: 'bill_paid', label: 'Bill paid' },
  { value: 'sales_receipt_recorded', label: 'Sales receipt' },
  { value: 'journal_entry_recorded', label: 'Journal entry' },
]

const STATUS_OPTIONS = [
  { value: 'captured', label: 'Captured (default)' },
  { value: 'classified', label: 'Classified' },
  { value: 'committed', label: 'Committed' },
  { value: 'voided', label: 'Voided' },
  { value: '', label: 'All statuses' },
]

const SOURCE_OPTIONS = [
  { value: '', label: 'All sources' },
  { value: 'quickbooks', label: 'QuickBooks' },
  { value: 'manual', label: 'Manual' },
  { value: 'schedule', label: 'Schedule' },
  { value: 'system', label: 'System' },
]

const CATEGORY_BADGE_COLOR: Record<string, string> = {
  sales: 'success',
  purchase: 'warning',
  adjustment: 'gray',
  cash: 'info',
  receivable: 'success',
  payable: 'warning',
}

const STATUS_BADGE_COLOR: Record<string, string> = {
  captured: 'info',
  classified: 'purple',
  committed: 'success',
  voided: 'failure',
  fulfilled: 'success',
  superseded: 'gray',
  pending: 'warning',
}

const EVENTS_LIMIT = 200

const InboxContent: FC = function () {
  const { state: graphState } = useGraphContext()
  const searchParams = useSearchParams()

  const [events, setEvents] = useState<LedgerEventBlock[]>([])
  const [agents, setAgents] = useState<LedgerAgent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [truncated, setTruncated] = useState(false)

  // Filters (agentId can be deep-linked from agent detail modal: /ledger/inbox?agentId=...)
  // When deep-linked, default status to "All" so the inbox view matches what the
  // agent modal's "Recent events" table just showed (which has no status filter).
  const initialAgentId = searchParams.get('agentId') ?? ''
  const [eventType, setEventType] = useState('')
  const [status, setStatus] = useState(initialAgentId ? '' : 'captured')
  const [source, setSource] = useState('')
  const [agentId, setAgentId] = useState(initialAgentId)
  const [searchTerm, setSearchTerm] = useState('')

  // Selection (modal)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const currentGraph = useMemo(
    () =>
      graphState.graphs
        .filter(GraphFilters.roboledger)
        .find((g) => g.graphId === graphState.currentGraphId),
    [graphState.graphs, graphState.currentGraphId]
  )

  // Index agents by id for the table column.
  const agentById = useMemo(() => {
    const map: Record<string, LedgerAgent> = {}
    for (const a of agents) map[a.id] = a
    return map
  }, [agents])

  // Initial + filter-driven load. Inlined into the effect (rather than a
  // useCallback referenced from a separate effect) so the cleanup `cancelled`
  // flag is local to each invocation — prevents a stale response from
  // overwriting state if `currentGraph` or any filter changes mid-flight.
  useEffect(() => {
    if (!currentGraph) {
      setEvents([])
      setIsLoading(false)
      setTruncated(false)
      return
    }

    let cancelled = false
    void (async () => {
      try {
        setIsLoading(true)
        setError(null)

        const list = await clients.ledger.listEventBlocks(
          currentGraph.graphId,
          {
            eventType: eventType || undefined,
            status: status || undefined,
            source: source || undefined,
            agentId: agentId || undefined,
            limit: EVENTS_LIMIT,
          }
        )
        if (cancelled) return

        // Sort by occurred_at descending.
        list.sort(
          (a, b) =>
            new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
        )
        setEvents(list)
        setTruncated(list.length >= EVENTS_LIMIT)
      } catch (err) {
        if (cancelled) return
        console.error('Error loading event blocks:', err)
        setError('Failed to load events. Try again or check the connection.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [currentGraph, eventType, status, source, agentId])

  // Load agents once per graph for the filter Select + name lookup.
  useEffect(() => {
    if (!currentGraph) {
      setAgents([])
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const list = await clients.ledger.listAgents(currentGraph.graphId, {
          limit: 500,
        })
        if (!cancelled) setAgents(list)
      } catch (err) {
        console.error('Error loading agents:', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [currentGraph])

  const filteredEvents = useMemo(() => {
    if (!searchTerm) return events
    const needle = searchTerm.toLowerCase()
    return events.filter((e) => {
      const agentName = e.agentId ? (agentById[e.agentId]?.name ?? '') : ''
      return (
        (e.description || '').toLowerCase().includes(needle) ||
        (e.externalId || '').toLowerCase().includes(needle) ||
        agentName.toLowerCase().includes(needle)
      )
    })
  }, [events, searchTerm, agentById])

  // After a transition, either drop the row (if the active status filter
  // would exclude the new state) or update it in place (if the user is
  // viewing "All statuses" or the post-transition status itself, so the
  // row should remain visible with the new badge).
  const applyTransition = useCallback(
    (eventId: string, newStatus: 'committed' | 'voided') => {
      setEvents((prev) => {
        if (status && status !== newStatus) {
          return prev.filter((e) => e.id !== eventId)
        }
        return prev.map((e) =>
          e.id === eventId ? { ...e, status: newStatus } : e
        )
      })
      setSelectedId(null)
    },
    [status]
  )

  const onApproved = useCallback(
    (eventId: string) => applyTransition(eventId, 'committed'),
    [applyTransition]
  )

  const onRejected = useCallback(
    (eventId: string) => applyTransition(eventId, 'voided'),
    [applyTransition]
  )

  return (
    <PageLayout>
      <PageHeader
        icon={HiInbox}
        title="Inbox"
        subtitle="Review and approve captured events before they post to the GL"
      />

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-end gap-4 p-4">
          <div className="w-full sm:w-64">
            <label
              htmlFor="search"
              className="mb-1 block text-xs text-gray-500 dark:text-gray-400"
            >
              Search
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <HiSearch className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </div>
              <TextInput
                id="search"
                placeholder="Description, ext id, agent…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="w-full sm:w-44">
            <label
              htmlFor="eventType"
              className="mb-1 block text-xs text-gray-500 dark:text-gray-400"
            >
              Event type
            </label>
            <Select
              id="eventType"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
            >
              {EVENT_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="w-full sm:w-44">
            <label
              htmlFor="status"
              className="mb-1 block text-xs text-gray-500 dark:text-gray-400"
            >
              Status
            </label>
            <Select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="w-full sm:w-40">
            <label
              htmlFor="source"
              className="mb-1 block text-xs text-gray-500 dark:text-gray-400"
            >
              Source
            </label>
            <Select
              id="source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            >
              {SOURCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="w-full sm:w-56">
            <label
              htmlFor="agent"
              className="mb-1 block text-xs text-gray-500 dark:text-gray-400"
            >
              Agent
            </label>
            <Select
              id="agent"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
            >
              <option value="">All agents</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {error && (
        <Alert color="failure">
          <HiExclamationCircle className="h-4 w-4" />
          <span className="font-medium">Error.</span> {error}
        </Alert>
      )}

      <Card>
        <div className="overflow-x-auto">
          {isLoading ? (
            <LoadingState />
          ) : events.length === 0 ? (
            <EmptyState
              icon={HiInbox}
              title="No events to review"
              description="Sync a connection or wait for new events."
              className="p-8"
            />
          ) : filteredEvents.length === 0 ? (
            <EmptyState
              icon={HiSearch}
              title="No matches"
              description="Try clearing the search or adjusting filters."
              className="p-8"
            />
          ) : (
            <Table>
              <TableHead>
                <TableHeadCell>Date</TableHeadCell>
                <TableHeadCell>Event</TableHeadCell>
                <TableHeadCell>Agent</TableHeadCell>
                <TableHeadCell>Source</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell className="text-right">Amount</TableHeadCell>
              </TableHead>
              <TableBody>
                {filteredEvents.map((evt) => {
                  const agent = evt.agentId ? agentById[evt.agentId] : null
                  return (
                    <TableRow
                      key={evt.id}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                      onClick={() => setSelectedId(evt.id)}
                    >
                      <TableCell className="font-medium whitespace-nowrap text-gray-900 dark:text-white">
                        {formatDate(evt.occurredAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <Badge
                            color={
                              CATEGORY_BADGE_COLOR[
                                (evt.eventCategory || '').toLowerCase()
                              ] || 'gray'
                            }
                            size="sm"
                            className="w-fit"
                          >
                            {evt.eventType.replace(/_/g, ' ')}
                          </Badge>
                          {evt.externalId && (
                            <span className="mt-1 font-mono text-xs text-gray-500 dark:text-gray-400">
                              {evt.externalId}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {agent ? (
                          <span className="text-gray-900 dark:text-white">
                            {agent.name}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {evt.source}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          color={STATUS_BADGE_COLOR[evt.status] || 'gray'}
                          size="sm"
                        >
                          {evt.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {formatAmount(evt.amount ?? null, evt.currency)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {!isLoading && filteredEvents.length > 0 && (
          <div className="border-t border-gray-200 p-4 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {filteredEvents.length} of {events.length} events
              {truncated && (
                <span className="ml-2 text-amber-600 dark:text-amber-400">
                  (limit {EVENTS_LIMIT} reached — narrow filters to see more)
                </span>
              )}
            </p>
          </div>
        )}
      </Card>

      {currentGraph && selectedId && (
        <EventBlockDetailModal
          graphId={currentGraph.graphId}
          eventId={selectedId}
          agentById={agentById}
          onClose={() => setSelectedId(null)}
          onApproved={onApproved}
          onRejected={onRejected}
        />
      )}
    </PageLayout>
  )
}

export default InboxContent
