'use client'

import { clients, customTheme, LoadingState } from '@/lib/core'
import { formatDateTime } from '@/lib/ledger/formatters'
import type { PreviewEventBlockResponse } from '@robosystems/client'
import type {
  LedgerAgent,
  LedgerEventBlockDetail,
} from '@robosystems/client/clients'
import {
  Alert,
  Badge,
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from 'flowbite-react'
import Link from 'next/link'
import { type FC, useCallback, useEffect, useState } from 'react'
import {
  HiArrowRight,
  HiCheck,
  HiExclamationCircle,
  HiEye,
  HiX,
} from 'react-icons/hi'

interface Entry {
  memo?: string
  posting_date?: string
  line_items?: LineItem[]
}

interface LineItem {
  element_id?: string
  element_external_id?: string
  element_name?: string
  element_code?: string
  debit_amount?: number
  credit_amount?: number
  description?: string
}

// `PreviewEventBlockResponse` is exported by the SDK since 0.3.20 — the
// previous hand-rolled `PreviewResult` mistyped `interpolated_debit_amount`
// and `interpolated_credit_amount` as `number` when the server returns the
// interpolated *expression* as a `string`. Use the SDK type directly.
type PreviewResult = PreviewEventBlockResponse

interface FriendlyError {
  message: string
  link?: { href: string; label: string }
}

interface Props {
  graphId: string
  eventId: string
  agentById: Record<string, LedgerAgent>
  onClose: () => void
  onApproved: (eventId: string) => void
  onRejected: (eventId: string) => void
}

// Local alias kept so existing call sites read naturally; the shared
// helper is null-safe and returns '—' for missing values.
const formatCurrency = (
  cents: number | null | undefined,
  currency: string
): string => {
  if (cents === null || cents === undefined) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(cents / 100)
}

/**
 * Map backend 422 errors into user-friendly UX. Backend raises
 * ClosedPeriodError and ElementResolutionError as 422s — surface them
 * with actionable links instead of raw messages.
 */
const friendlyError = (raw: string): FriendlyError => {
  const lower = raw.toLowerCase()
  if (lower.includes('closed period')) {
    return {
      message:
        raw +
        " Reopen it from the close page or change the event's posting_date.",
      link: { href: '/ledger/close', label: 'Open close page' },
    }
  }
  if (
    lower.includes('element') &&
    (lower.includes('unmapped') ||
      lower.includes('resolve') ||
      lower.includes('not found'))
  ) {
    return {
      message:
        "Some accounts in this event aren't mapped. Visit Chart of Accounts to fix mappings, then try again.",
      link: {
        href: '/ledger/chart-of-accounts',
        label: 'Open Chart of Accounts',
      },
    }
  }
  return { message: raw }
}

const EventBlockDetailModal: FC<Props> = function ({
  graphId,
  eventId,
  agentById,
  onClose,
  onApproved,
  onRejected,
}) {
  const [event, setEvent] = useState<LedgerEventBlockDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionInFlight, setActionInFlight] = useState<
    'preview' | 'approve' | 'reject' | null
  >(null)
  const [error, setError] = useState<FriendlyError | null>(null)
  const [preview, setPreview] = useState<PreviewResult | null>(null)
  const [confirmReject, setConfirmReject] = useState(false)

  const loadEvent = useCallback(async () => {
    try {
      setLoading(true)
      const detail = await clients.ledger.getEventBlock(graphId, eventId)
      setEvent(detail)
    } catch (err) {
      console.error('Error loading event block:', err)
      setError({ message: 'Failed to load event detail.' })
    } finally {
      setLoading(false)
    }
  }, [graphId, eventId])

  useEffect(() => {
    void loadEvent()
  }, [loadEvent])

  const buildPreviewBody = useCallback(
    (e: LedgerEventBlockDetail) => ({
      event_type: e.eventType,
      event_category: e.eventCategory as
        | 'sales'
        | 'purchase'
        | 'financing'
        | 'payroll'
        | 'treasury'
        | 'adjustment'
        | 'recognition'
        | 'other'
        | 'control'
        | 'approval'
        | 'reconciliation'
        | 'inquiry',
      event_class: e.eventClass as 'economic' | 'support' | undefined,
      agent_id: e.agentId ?? null,
      occurred_at: e.occurredAt,
      effective_at: e.effectiveAt ?? null,
      source: e.source,
      external_id: e.externalId ?? null,
      amount: e.amount ?? null,
      currency: e.currency,
      description: e.description ?? null,
      metadata: (e.metadata ?? {}) as Record<string, unknown>,
      apply_handlers: false,
    }),
    []
  )

  const handlePreview = useCallback(async () => {
    if (!event) return
    setError(null)
    setActionInFlight('preview')
    try {
      const result = await clients.ledger.previewEventBlock(
        graphId,
        buildPreviewBody(event)
      )
      setPreview(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(friendlyError(message))
    } finally {
      setActionInFlight(null)
    }
  }, [event, graphId, buildPreviewBody])

  const handleApprove = useCallback(async () => {
    if (!event) return
    setError(null)
    setActionInFlight('approve')
    try {
      await clients.ledger.updateEventBlock(graphId, {
        event_id: event.id,
        transition_to: 'committed',
      })
      onApproved(event.id)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(friendlyError(message))
    } finally {
      setActionInFlight(null)
    }
  }, [event, graphId, onApproved])

  const handleReject = useCallback(async () => {
    if (!event) return
    setError(null)
    setActionInFlight('reject')
    try {
      await clients.ledger.updateEventBlock(graphId, {
        event_id: event.id,
        transition_to: 'voided',
      })
      onRejected(event.id)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(friendlyError(message))
    } finally {
      setActionInFlight(null)
      setConfirmReject(false)
    }
  }, [event, graphId, onRejected])

  const agent = event?.agentId ? agentById[event.agentId] : null
  const entries = (event?.metadata as { entries?: Entry[] } | undefined)
    ?.entries

  const isTerminal =
    event && ['voided', 'fulfilled', 'superseded'].includes(event.status)

  return (
    <Modal show onClose={onClose} size="4xl" theme={customTheme.modal}>
      <ModalHeader>
        {event ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-heading text-lg">
              {event.eventType.replace(/_/g, ' ')}
            </span>
            <Badge color="info" size="sm">
              {event.status}
            </Badge>
            {event.externalId && (
              <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                {event.externalId}
              </span>
            )}
          </div>
        ) : (
          'Event detail'
        )}
      </ModalHeader>

      <ModalBody>
        {loading ? (
          <LoadingState />
        ) : !event ? (
          <Alert theme={customTheme.alert} color="failure">
            <HiExclamationCircle className="h-4 w-4" />
            Event not found.
          </Alert>
        ) : (
          <div className="space-y-4">
            {/* Header info grid */}
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4 text-sm sm:grid-cols-3 dark:bg-gray-800">
              <div>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  Occurred
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatDateTime(event.occurredAt)}
                </span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  Source
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {event.source}
                </span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  Category
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {event.eventCategory}
                </span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  Agent
                </span>
                {agent ? (
                  <Link
                    href={`/agents?id=${encodeURIComponent(agent.id)}`}
                    className="text-primary-600 dark:text-primary-400 inline-flex items-center gap-1 font-medium hover:underline"
                  >
                    {agent.name}
                    <HiArrowRight className="h-3 w-3" />
                  </Link>
                ) : (
                  <span className="text-gray-400 dark:text-gray-500">—</span>
                )}
              </div>
              <div>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  Amount
                </span>
                <span className="font-mono font-medium text-gray-900 dark:text-white">
                  {event.amount !== null && event.amount !== undefined
                    ? formatCurrency(event.amount, event.currency)
                    : '—'}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-3">
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  Description
                </span>
                <span className="text-gray-900 dark:text-white">
                  {event.description || '—'}
                </span>
              </div>
            </div>

            {/* Entries */}
            {entries && entries.length > 0 ? (
              <div className="space-y-3">
                <h4 className="font-heading text-sm font-bold text-gray-900 dark:text-white">
                  Journal entries ({entries.length})
                </h4>
                {entries.map((entry, idx) => {
                  const lineItems = entry.line_items ?? []
                  const totalDebit = lineItems.reduce(
                    (sum, li) => sum + (li.debit_amount || 0),
                    0
                  )
                  const totalCredit = lineItems.reduce(
                    (sum, li) => sum + (li.credit_amount || 0),
                    0
                  )
                  return (
                    <div
                      key={idx}
                      className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                    >
                      <div className="mb-2 flex flex-wrap justify-between gap-2 text-xs">
                        <span className="text-gray-500 dark:text-gray-400">
                          {entry.posting_date || '—'}
                        </span>
                        <span className="text-gray-700 dark:text-gray-300">
                          {entry.memo || '—'}
                        </span>
                      </div>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase dark:border-gray-600 dark:text-gray-400">
                            <th className="py-1">Account</th>
                            <th className="py-1">Description</th>
                            <th className="py-1 text-right">Debit</th>
                            <th className="py-1 text-right">Credit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lineItems.map((li, liIdx) => (
                            <tr
                              key={liIdx}
                              className="border-b border-gray-100 last:border-b-0 dark:border-gray-700"
                            >
                              <td className="py-1 font-medium text-gray-900 dark:text-white">
                                {li.element_name ||
                                  li.element_external_id ||
                                  li.element_id ||
                                  '—'}
                              </td>
                              <td className="py-1 text-gray-600 dark:text-gray-400">
                                {li.description || '—'}
                              </td>
                              <td className="text-primary-600 dark:text-primary-400 py-1 text-right font-mono">
                                {li.debit_amount
                                  ? formatCurrency(
                                      li.debit_amount,
                                      event.currency
                                    )
                                  : '—'}
                              </td>
                              <td className="py-1 text-right font-mono text-green-600 dark:text-green-400">
                                {li.credit_amount
                                  ? formatCurrency(
                                      li.credit_amount,
                                      event.currency
                                    )
                                  : '—'}
                              </td>
                            </tr>
                          ))}
                          <tr className="border-t-2 border-gray-300 font-medium text-gray-900 dark:border-gray-500 dark:text-white">
                            <td colSpan={2} className="py-1">
                              Total
                            </td>
                            <td className="text-primary-600 dark:text-primary-400 py-1 text-right font-mono">
                              {formatCurrency(totalDebit, event.currency)}
                            </td>
                            <td className="py-1 text-right font-mono text-green-600 dark:text-green-400">
                              {formatCurrency(totalCredit, event.currency)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
                No journal entries in metadata.
              </div>
            )}

            {/* Preview output */}
            {preview && (
              <div className="border-primary-200 bg-primary-50 dark:border-primary-900 dark:bg-primary-950 rounded-lg border p-3 text-sm">
                <h4 className="font-heading text-primary-900 dark:text-primary-200 mb-2 text-sm font-bold">
                  Preview — what would post
                </h4>
                {preview.would_succeed === false && (
                  <p className="mb-2 font-medium text-red-700 dark:text-red-400">
                    Would NOT succeed.
                  </p>
                )}
                {preview.matched_handler && (
                  <p className="text-primary-800 dark:text-primary-300 mb-2 text-xs">
                    Handler:{' '}
                    <span className="font-mono">
                      {preview.matched_handler.name ||
                        preview.matched_handler.id}
                    </span>
                  </p>
                )}
                {preview.planned_transactions &&
                  preview.planned_transactions.length > 0 && (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-primary-700 dark:text-primary-300 text-left">
                          <th className="py-1">Entry</th>
                          <th className="py-1">Debit elem</th>
                          <th className="py-1">Credit elem</th>
                          <th className="py-1 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.planned_transactions.map((row, i) => (
                          <tr
                            key={i}
                            className="text-gray-700 dark:text-gray-300"
                          >
                            <td className="py-1">{row.entry_index ?? '—'}</td>
                            <td className="py-1 font-mono">
                              {row.debit_element_id || '—'}
                            </td>
                            <td className="py-1 font-mono">
                              {row.credit_element_id || '—'}
                            </td>
                            <td className="py-1 text-right font-mono">
                              {row.amount_cents !== undefined
                                ? formatCurrency(
                                    row.amount_cents,
                                    event.currency
                                  )
                                : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                {preview.validation_errors &&
                  preview.validation_errors.length > 0 && (
                    <ul className="mt-2 list-inside list-disc text-xs text-red-700 dark:text-red-400">
                      {preview.validation_errors.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  )}
              </div>
            )}

            {/* Error */}
            {error && (
              <Alert theme={customTheme.alert} color="failure">
                <HiExclamationCircle className="h-4 w-4" />
                <span className="font-medium">Error.</span> {error.message}
                {error.link && (
                  <Link
                    href={error.link.href}
                    className="text-primary-700 dark:text-primary-300 ml-2 font-medium hover:underline"
                  >
                    {error.link.label} →
                  </Link>
                )}
              </Alert>
            )}

            {/* Reject confirm */}
            {confirmReject && (
              <Alert theme={customTheme.alert} color="warning">
                <HiExclamationCircle className="h-4 w-4" />
                <span className="font-medium">Reject this event?</span> It will
                be marked <code>voided</code> and won&apos;t post to the GL.
                <div className="mt-2 flex gap-2">
                  <Button
                    theme={customTheme.button}
                    size="xs"
                    color="failure"
                    onClick={handleReject}
                    disabled={actionInFlight !== null}
                  >
                    {actionInFlight === 'reject'
                      ? 'Rejecting…'
                      : 'Confirm reject'}
                  </Button>
                  <Button
                    theme={customTheme.button}
                    size="xs"
                    color="gray"
                    onClick={() => setConfirmReject(false)}
                    disabled={actionInFlight !== null}
                  >
                    Cancel
                  </Button>
                </div>
              </Alert>
            )}
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        {event && !isTerminal && (
          <div className="flex flex-1 flex-wrap justify-end gap-2">
            <Button
              theme={customTheme.button}
              color="light"
              onClick={handlePreview}
              disabled={actionInFlight !== null}
            >
              <HiEye className="mr-2 h-4 w-4" />
              {actionInFlight === 'preview' ? 'Previewing…' : 'Preview'}
            </Button>
            <Button
              theme={customTheme.button}
              color="failure"
              onClick={() => setConfirmReject(true)}
              disabled={actionInFlight !== null || confirmReject}
            >
              <HiX className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button
              theme={customTheme.button}
              color="success"
              onClick={handleApprove}
              disabled={actionInFlight !== null}
            >
              <HiCheck className="mr-2 h-4 w-4" />
              {actionInFlight === 'approve' ? 'Approving…' : 'Approve'}
            </Button>
          </div>
        )}
        <Button theme={customTheme.button} color="gray" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default EventBlockDetailModal
