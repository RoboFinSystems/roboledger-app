'use client'

import DocsLink from '@/components/DocsLink'
import {
  FilterActions,
  FilterBar,
  FilterSelect,
  SearchField,
} from '@/components/FilterBar'
import { useEntityScope } from '@/lib/entity-scope'
import { friendlyError } from '@/lib/ledger/errors'
import { formatAmount, formatDate } from '@/lib/ledger/formatters'
import {
  suggestionSourceColor,
  suggestionSourceLabel,
  suggestionSourceOf,
} from '@/lib/ledger/suggestions'
import { useConsoleReload } from '@/lib/useConsoleReload'
import { useLedgerGraph } from '@/lib/useLedgerGraph'
import type { LedgerAgent, LedgerEventBlock } from '@robosystems/client/clients'
import {
  clients,
  EmptyState,
  LoadingState,
  PageHeader,
  PageLayout,
} from '@robosystems/core'
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'flowbite-react'
import { useSearchParams } from 'next/navigation'
import { type FC, useCallback, useEffect, useMemo, useState } from 'react'
import { HiExclamationCircle, HiInbox, HiSearch } from 'react-icons/hi'
import EventBlockDetailModal from './EventBlockDetailModal'

export const EVENT_TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'invoice_issued', label: 'Invoice issued' },
  { value: 'bill_received', label: 'Bill received' },
  { value: 'payment_received', label: 'Payment received' },
  { value: 'bill_paid', label: 'Bill paid' },
  { value: 'sales_receipt_recorded', label: 'Sales receipt' },
  { value: 'journal_entry_recorded', label: 'Journal entry' },
  { value: 'bank_transaction', label: 'Bank transaction' },
  { value: 'bank_fee', label: 'Bank fee' },
  { value: 'external_transfer', label: 'External transfer' },
  { value: 'internal_transfer', label: 'Internal transfer' },
]

const STATUS_OPTIONS = [
  { value: 'captured', label: 'Captured (default)' },
  { value: 'classified', label: 'Classified' },
  { value: 'committed', label: 'Committed' },
  { value: 'voided', label: 'Voided' },
  { value: '', label: 'All statuses' },
]

export const SOURCE_OPTIONS = [
  { value: '', label: 'All sources' },
  { value: 'quickbooks', label: 'QuickBooks' },
  { value: 'plaid', label: 'Plaid' },
  { value: 'mercury', label: 'Mercury' },
  { value: 'manual', label: 'Manual' },
  { value: 'schedule', label: 'Schedule' },
  { value: 'system', label: 'System' },
]

/**
 * A line's suggestion source, as the row badge shows it; "none" is a line
 * that carries no suggestion and needs a choice.
 */
export const SUGGESTION_OPTIONS = [
  { value: '', label: 'Any suggestion' },
  { value: 'agent_default', label: 'Learned' },
  { value: 'tier0', label: 'Bank category' },
  { value: 'ai', label: 'AI' },
  { value: 'none', label: 'No suggestion' },
]

/** Why the batch left a line alone, in the reviewer's words. */
const SKIP_REASON_LABEL: Record<string, string> = {
  not_open: 'already handled',
  no_suggestion: 'no suggestion to take',
  source_changed: 'changed by the feed since capture',
  closed_period: 'in a closed month',
  locked: 'busy, try again',
  refused: 'refused',
}

type BatchResult = Awaited<ReturnType<typeof clients.ledger.acceptSuggestions>>

/** One line for the reviewer, and one per line the batch did not take. */
export const summarizeBatch = (
  result: BatchResult,
  describe: (eventId: string) => string
): { summary: string; details: string[] } => {
  const taken = result.committed + result.classified
  const looked = result.lines.length
  const verb = result.committed > 0 ? 'Posted' : 'Classified'
  const summary =
    taken === looked
      ? `${verb} ${taken} of ${looked}.`
      : `${verb} ${taken} of ${looked}; ${result.skipped} left as they were.`
  const details = result.lines
    .filter((line) => line.outcome === 'skipped')
    .map((line) => {
      const why =
        SKIP_REASON_LABEL[line.reason ?? ''] ?? line.reason ?? 'skipped'
      return line.detail
        ? `${describe(line.event_id)}: ${why} — ${line.detail}`
        : `${describe(line.event_id)}: ${why}`
    })
  return { summary, details }
}

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
  const [suggestion, setSuggestion] = useState('')

  // The lines ticked for a batch approval, by id. Only an open line with a
  // suggestion can be ticked; ids that scroll out of the filters stay in
  // the set but are not counted or sent.
  const [checked, setChecked] = useState<Set<string>>(() => new Set())
  const [isApproving, setIsApproving] = useState(false)
  const [batch, setBatch] = useState<{
    summary: string
    details: string[]
  } | null>(null)

  // Selection (modal)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  // Bumped after a transition: a commit may have taught a counterparty its
  // default, which the next line's modal reads from this list.
  const [agentsVersion, setAgentsVersion] = useState(0)

  const { graph: currentGraph } = useLedgerGraph()
  const { entityId } = useEntityScope()

  // A /do in the console drawer that changed this graph, such as a line
  // classified there. The reload keeps the table on screen.
  const { reloadKey, takeQuiet } = useConsoleReload(currentGraph?.graphId)

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
    const quiet = takeQuiet()
    void (async () => {
      try {
        if (!quiet) setIsLoading(true)
        setError(null)

        const list = await clients.ledger.listEventBlocks(
          currentGraph.graphId,
          {
            entityId,
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
  }, [
    currentGraph,
    entityId,
    eventType,
    status,
    source,
    agentId,
    reloadKey,
    takeQuiet,
  ])

  // Load agents per graph for the filter Select + name lookup, and again
  // after a transition.
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
  }, [currentGraph, agentsVersion])

  const filteredEvents = useMemo(() => {
    let list = events
    if (suggestion) {
      list = list.filter((e) => {
        const source = suggestionSourceOf(e.metadata)
        return suggestion === 'none' ? source === null : source === suggestion
      })
    }
    if (!searchTerm) return list
    const needle = searchTerm.toLowerCase()
    return list.filter((e) => {
      const agentName = e.agentId ? (agentById[e.agentId]?.name ?? '') : ''
      return (
        (e.description || '').toLowerCase().includes(needle) ||
        (e.externalId || '').toLowerCase().includes(needle) ||
        agentName.toLowerCase().includes(needle)
      )
    })
  }, [events, searchTerm, suggestion, agentById])

  // What a batch may take: an open line whose suggestion names an account.
  const isSelectable = (e: LedgerEventBlock) =>
    e.status === 'captured' && suggestionSourceOf(e.metadata) !== null
  const selectableIds = useMemo(
    () => filteredEvents.filter(isSelectable).map((e) => e.id),
    [filteredEvents]
  )
  const learnedIds = useMemo(
    () =>
      filteredEvents
        .filter(
          (e) =>
            isSelectable(e) &&
            suggestionSourceOf(e.metadata) === 'agent_default'
        )
        .map((e) => e.id),
    [filteredEvents]
  )
  const checkedVisible = useMemo(
    () => selectableIds.filter((id) => checked.has(id)),
    [selectableIds, checked]
  )
  const allVisibleChecked =
    selectableIds.length > 0 && checkedVisible.length === selectableIds.length

  const toggleChecked = useCallback((id: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // After a transition, either drop the row (if the active status filter
  // would exclude the new state) or update it in place (if the user is
  // viewing "All statuses" or the post-transition status itself, so the
  // row should remain visible with the new badge).
  const updateRow = useCallback(
    (eventId: string, newStatus: 'classified' | 'committed' | 'voided') => {
      setEvents((prev) => {
        if (status && status !== newStatus) {
          return prev.filter((e) => e.id !== eventId)
        }
        return prev.map((e) =>
          e.id === eventId ? { ...e, status: newStatus } : e
        )
      })
    },
    [status]
  )

  const applyTransition = useCallback(
    (eventId: string, newStatus: 'committed' | 'voided') => {
      updateRow(eventId, newStatus)
      setSelectedId(null)
      if (newStatus === 'committed') setAgentsVersion((v) => v + 1)
    },
    [updateRow]
  )

  // Classify keeps the modal open (the reviewer usually approves next), but
  // the list must stop showing the row as unreviewed.
  const onClassified = useCallback(
    (eventId: string) => updateRow(eventId, 'classified'),
    [updateRow]
  )

  const onApproved = useCallback(
    (eventId: string) => applyTransition(eventId, 'committed'),
    [applyTransition]
  )

  const onRejected = useCallback(
    (eventId: string) => applyTransition(eventId, 'voided'),
    [applyTransition]
  )

  // Every ticked line takes its suggestion and posts, through the same
  // update a single Approve goes through; a line the server will not take
  // stays in the list with its reason under the summary.
  const approveChecked = useCallback(async () => {
    if (!currentGraph || checkedVisible.length === 0) return
    setIsApproving(true)
    setBatch(null)
    const describe = (eventId: string) => {
      const line = events.find((e) => e.id === eventId)
      return line?.description || line?.externalId || eventId
    }
    try {
      const result = await clients.ledger.acceptSuggestions(
        currentGraph.graphId,
        { event_ids: checkedVisible, commit: true, entity_id: entityId }
      )
      for (const line of result.lines) {
        if (line.outcome === 'committed') updateRow(line.event_id, 'committed')
        else if (line.outcome === 'classified')
          updateRow(line.event_id, 'classified')
      }
      setBatch(summarizeBatch(result, describe))
      setChecked(new Set())
      if (result.committed > 0) setAgentsVersion((v) => v + 1)
    } catch (err) {
      console.error('Error approving suggestions:', err)
      const message = err instanceof Error ? err.message : String(err)
      setBatch({
        summary: 'The approval did not run; nothing changed.',
        details: [friendlyError(message).message],
      })
    } finally {
      setIsApproving(false)
    }
  }, [currentGraph, checkedVisible, entityId, events, updateRow])

  return (
    <PageLayout>
      <PageHeader
        icon={HiInbox}
        title="Inbox"
        subtitle={
          <>
            Review and approve captured events before they post to the GL.{' '}
            <DocsLink href="/docs/inbox" />
          </>
        }
      />

      {/* Filters */}
      <FilterBar>
        <SearchField
          id="search"
          placeholder="Description, ext id, agent…"
          value={searchTerm}
          onChange={setSearchTerm}
        />
        <FilterSelect
          id="eventType"
          label="Event type"
          value={eventType}
          onChange={setEventType}
        >
          {EVENT_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          id="status"
          label="Status"
          value={status}
          onChange={setStatus}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          id="source"
          label="Source"
          value={source}
          onChange={setSource}
        >
          {SOURCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          id="agent"
          label="Agent"
          value={agentId}
          onChange={setAgentId}
          className="sm:w-56"
        >
          <option value="">All agents</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          id="suggestion"
          label="Suggestion"
          value={suggestion}
          onChange={setSuggestion}
        >
          {SUGGESTION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </FilterSelect>
        {selectableIds.length > 0 && (
          <FilterActions>
            <Button
              color="light"
              size="sm"
              onClick={() => setChecked(new Set(learnedIds))}
              disabled={learnedIds.length === 0 || isApproving}
            >
              Select learned ({learnedIds.length})
            </Button>
            <Button
              color="blue"
              size="sm"
              onClick={() => void approveChecked()}
              disabled={checkedVisible.length === 0 || isApproving}
            >
              {isApproving ? 'Approving…' : `Approve ${checkedVisible.length}`}
            </Button>
          </FilterActions>
        )}
      </FilterBar>

      {batch && (
        <Alert
          color={batch.details.length > 0 ? 'warning' : 'success'}
          onDismiss={() => setBatch(null)}
        >
          <span className="font-medium">{batch.summary}</span>
          {batch.details.length > 0 && (
            <ul className="mt-1 list-inside list-disc text-sm">
              {batch.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          )}
        </Alert>
      )}

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
                <tr>
                  <TableHeadCell className="w-8">
                    {selectableIds.length > 0 && (
                      <Checkbox
                        aria-label="Select every line with a suggestion"
                        checked={allVisibleChecked}
                        onChange={() =>
                          setChecked(
                            allVisibleChecked
                              ? new Set()
                              : new Set(selectableIds)
                          )
                        }
                      />
                    )}
                  </TableHeadCell>
                  <TableHeadCell>Date</TableHeadCell>
                  <TableHeadCell>Event</TableHeadCell>
                  <TableHeadCell>Agent</TableHeadCell>
                  <TableHeadCell>Source</TableHeadCell>
                  <TableHeadCell>Status</TableHeadCell>
                  <TableHeadCell className="text-right">Amount</TableHeadCell>
                </tr>
              </TableHead>
              <TableBody>
                {filteredEvents.map((evt) => {
                  const agent = evt.agentId ? agentById[evt.agentId] : null
                  // A bank line waiting on a choice shows where its
                  // suggestion came from, so a learned one reads as safe.
                  const suggestionSource =
                    evt.status === 'captured' || evt.status === 'classified'
                      ? suggestionSourceOf(evt.metadata)
                      : null
                  const suggestedAccountName = (
                    evt.metadata as { suggested_account_name?: unknown } | null
                  )?.suggested_account_name
                  return (
                    <TableRow
                      key={evt.id}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                      onClick={() => setSelectedId(evt.id)}
                    >
                      <TableCell
                        className="w-8"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isSelectable(evt) && (
                          <Checkbox
                            aria-label={`Select ${evt.externalId || evt.id}`}
                            checked={checked.has(evt.id)}
                            onChange={() => toggleChecked(evt.id)}
                          />
                        )}
                      </TableCell>
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
                          {suggestionSource && (
                            <span className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <Badge
                                color={suggestionSourceColor(suggestionSource)}
                                size="sm"
                              >
                                {suggestionSourceLabel(suggestionSource)}
                              </Badge>
                              {typeof suggestedAccountName === 'string' && (
                                <span>{suggestedAccountName}</span>
                              )}
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
          onClassified={onClassified}
        />
      )}
    </PageLayout>
  )
}

export default InboxContent
