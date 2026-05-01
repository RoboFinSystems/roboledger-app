'use client'

import { PageHeader } from '@/components/PageHeader'
import {
  clients,
  customTheme,
  GraphFilters,
  PageLayout,
  useGraphContext,
} from '@/lib/core'
import { Spinner } from '@/lib/core/ui-components'
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

const formatDate = (iso: string): string => {
  const date = new Date(iso)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const formatAmount = (cents: number | null, currency: string): string => {
  if (cents === null || cents === undefined) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(cents / 100)
}

const InboxContent: FC = function () {
  const { state: graphState } = useGraphContext()
  const searchParams = useSearchParams()

  const [events, setEvents] = useState<LedgerEventBlock[]>([])
  const [agents, setAgents] = useState<LedgerAgent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const loadEvents = useCallback(async () => {
    if (!currentGraph) {
      setEvents([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const list = await clients.ledger.listEventBlocks(currentGraph.graphId, {
        eventType: eventType || undefined,
        status: status || undefined,
        source: source || undefined,
        agentId: agentId || undefined,
        limit: 200,
      })

      // Sort by occurred_at descending.
      list.sort(
        (a, b) =>
          new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
      )
      setEvents(list)
    } catch (err) {
      console.error('Error loading event blocks:', err)
      setError('Failed to load events. Try again or check the connection.')
    } finally {
      setIsLoading(false)
    }
  }, [currentGraph, eventType, status, source, agentId])

  // Initial + filter-driven load
  useEffect(() => {
    void loadEvents()
  }, [loadEvents])

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

  const onApproved = useCallback((eventId: string) => {
    // Optimistic remove from default-captured list.
    setEvents((prev) => prev.filter((e) => e.id !== eventId))
    setSelectedId(null)
  }, [])

  const onRejected = useCallback((eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId))
    setSelectedId(null)
  }, [])

  return (
    <PageLayout>
      <PageHeader
        icon={HiInbox}
        title="Inbox"
        description="Review and approve captured events before they post to the GL"
        gradient="from-blue-500 to-indigo-600"
      />

      {/* Filters */}
      <Card theme={customTheme.card}>
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
                theme={customTheme.textInput}
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
              theme={customTheme.select}
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
              theme={customTheme.select}
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
              theme={customTheme.select}
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
              theme={customTheme.select}
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
        <Alert theme={customTheme.alert} color="failure">
          <HiExclamationCircle className="h-4 w-4" />
          <span className="font-medium">Error.</span> {error}
        </Alert>
      )}

      <Card theme={customTheme.card}>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : events.length === 0 ? (
            <div className="p-8 text-center">
              <HiInbox className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <h3 className="font-heading mb-2 text-xl font-bold dark:text-white">
                No events to review
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Sync a connection or wait for new events.
              </p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-8 text-center">
              <HiSearch className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <h3 className="font-heading mb-2 text-xl font-bold dark:text-white">
                No matches
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Try clearing the search or adjusting filters.
              </p>
            </div>
          ) : (
            <Table theme={customTheme.table}>
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
