'use client'

import { useEntityScope } from '@/lib/entity-scope'
import {
  accountLabel,
  type AccountOption,
  type AccountTreeNode,
  flattenAccountTree,
} from '@/lib/ledger/accounts'
import type { FriendlyError } from '@/lib/ledger/errors'
import { friendlyError } from '@/lib/ledger/errors'
import { formatDateTime } from '@/lib/ledger/formatters'
import {
  suggestionSourceColor,
  suggestionSourceLabel,
  suggestionSourceOf,
} from '@/lib/ledger/suggestions'
import type { PreviewEventBlockResponse } from '@robosystems/client'
import type {
  LedgerAgent,
  LedgerEventBlockDetail,
  LedgerFlowCandidate,
} from '@robosystems/client/clients'
import { clients, LoadingState } from '@robosystems/core'
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Select,
} from 'flowbite-react'
import Link from 'next/link'
import { type FC, useCallback, useEffect, useMemo, useState } from 'react'
import {
  HiArrowRight,
  HiCheck,
  HiExclamationCircle,
  HiEye,
  HiTag,
  HiX,
} from 'react-icons/hi'
import EventDocumentSection from './EventDocumentSection'
import SettlementPicker, { type DischargeAllocation } from './SettlementPicker'

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

/** Statuses the server lets move to `committed` (what Approve does). */
const APPROVABLE_STATUSES = new Set(['captured', 'classified'])

/**
 * The journal entries an event carries. The server accepts either an
 * `entries` list or one flat entry (`posting_date` / `memo` / `line_items`),
 * and a manual journal entry arrives flat.
 */
function journalEntries(metadata: unknown): Entry[] | undefined {
  const m = metadata as (Entry & { entries?: Entry[] }) | null | undefined
  if (!m) return undefined
  if (Array.isArray(m.entries)) return m.entries
  if (Array.isArray(m.line_items)) {
    return [
      {
        posting_date: m.posting_date,
        memo: m.memo,
        line_items: m.line_items,
      },
    ]
  }
  return undefined
}

// `PreviewEventBlockResponse` is exported by the SDK since 0.3.20 — the
// previous hand-rolled `PreviewResult` mistyped `interpolated_debit_amount`
// and `interpolated_credit_amount` as `number` when the server returns the
// interpolated *expression* as a `string`. Use the SDK type directly.
type PreviewResult = PreviewEventBlockResponse

/** Bank-feed lines that post from an account choice. An internal transfer
 *  carries both bank legs already and needs no choice. */
const CLASSIFIABLE_EVENT_TYPES = new Set([
  'bank_transaction',
  'bank_fee',
  'external_transfer',
])

const FLOW_SECTIONS: { activity: string; label: string }[] = [
  { activity: 'investing', label: 'Investing' },
  { activity: 'financing', label: 'Financing' },
]

interface Props {
  graphId: string
  eventId: string
  agentById: Record<string, LedgerAgent>
  onClose: () => void
  onApproved: (eventId: string) => void
  onRejected: (eventId: string) => void
  /** The event moved `captured → classified` without posting. */
  onClassified?: (eventId: string) => void
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

type Action = 'preview' | 'approve' | 'reject' | 'classify' | 'retag'

const stringOf = (value: unknown): string =>
  typeof value === 'string' ? value : ''

const EventBlockDetailModal: FC<Props> = function ({
  graphId,
  eventId,
  agentById,
  onClose,
  onApproved,
  onRejected,
  onClassified,
}) {
  // The Inbox lists one entity's lines; its chart is the one they post to.
  const { entityId } = useEntityScope()
  const [event, setEvent] = useState<LedgerEventBlockDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionInFlight, setActionInFlight] = useState<Action | null>(null)
  const [error, setError] = useState<FriendlyError | null>(null)
  const [failedAction, setFailedAction] = useState<Action | null>(null)
  const [preview, setPreview] = useState<PreviewResult | null>(null)
  const [confirmReject, setConfirmReject] = useState(false)
  // Bank-feed classification: the account the line posts against. Seeded
  // from an earlier classification, then the feed's suggestion.
  const [accounts, setAccounts] = useState<AccountOption[] | null>(null)
  const [classifiedElementId, setClassifiedElementId] = useState('')
  // The flow: a second classification beside the account, overriding the
  // account's default on the cash flow and equity statements. '' keeps the
  // default.
  const [flows, setFlows] = useState<LedgerFlowCandidate[] | null>(null)
  const [flowsFailed, setFlowsFailed] = useState(false)
  const [flowQname, setFlowQname] = useState('')
  // Whether a commit teaches the counterparty this account. Null until the
  // reviewer touches the checkbox, which then follows the rule below.
  const [rememberChoice, setRememberChoice] = useState<boolean | null>(null)
  // The open bills or invoices a person picked for this line to settle.
  const [settlement, setSettlement] = useState<DischargeAllocation[]>([])

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

  const eventMetadata = (event?.metadata ?? {}) as Record<string, unknown>
  const isBankLine = !!event && CLASSIFIABLE_EVENT_TYPES.has(event.eventType)
  const isClassifiable =
    isBankLine && ['captured', 'classified'].includes(event.status)
  // A posted line keeps its account; only its flow can change here.
  const isPostedBankLine = isBankLine && event.status === 'committed'
  const hasSplit = Array.isArray(eventMetadata.classified_allocations)
  const suggestedElementId = stringOf(eventMetadata.suggested_element_id)
  const suggestedAccountName = stringOf(eventMetadata.suggested_account_name)
  const suggestionSource = suggestionSourceOf(eventMetadata)
  const suggestionBasis = stringOf(eventMetadata.suggestion_basis)
  const priorFlowQname = stringOf(eventMetadata.classified_flow_qname)

  const agent = event?.agentId ? agentById[event.agentId] : null
  // The counterparty's default for the entity in scope: a subsidiary learns
  // its own, and the parent's is not one it has.
  const entityDefault = agent
    ? ((entityId
        ? agent.classifications.find((c) => c.entityId === entityId)
        : agent.classification) ?? null)
    : null
  // The counterparty's default as this line saw it. A learned suggestion is
  // the default itself, re-suggested the moment one is set or moved, so it
  // outranks the agent list, which the inbox loaded earlier.
  const agentDefault =
    suggestionSource === 'agent_default' && suggestedElementId
      ? {
          elementId: suggestedElementId,
          accountName: suggestedAccountName || null,
        }
      : entityDefault
        ? {
            elementId: entityDefault.elementId,
            accountName: entityDefault.accountName ?? null,
          }
        : null

  useEffect(() => {
    if (!isClassifiable) return
    const prior = stringOf(eventMetadata.classified_element_id)
    setClassifiedElementId(prior || suggestedElementId)
    setRememberChoice(null)
    let cancelled = false
    clients.ledger
      .getAccountTree(graphId, { entityId })
      .then((tree) => {
        if (cancelled) return
        const options = flattenAccountTree(
          (tree?.roots ?? []) as unknown as AccountTreeNode[]
        ).filter((account) => account.id !== event?.resourceElementId)
        setAccounts(options)
        // A seeded choice that is no longer on the chart (retired since, or
        // the bank leg itself) must read as unclassified, not post blind.
        setClassifiedElementId((current) =>
          options.some((account) => account.id === current) ? current : ''
        )
      })
      .catch((err: unknown) => {
        if (cancelled) return
        console.error('Error loading chart of accounts:', err)
        setAccounts([])
      })
    return () => {
      cancelled = true
    }
    // The event id is what changes; the derived strings follow from it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphId, event?.id, isClassifiable, entityId])

  const offersFlow = (isClassifiable || isPostedBankLine) && !hasSplit

  useEffect(() => {
    if (!offersFlow) {
      setFlowQname('')
      return
    }
    setFlowQname(priorFlowQname)
    setFlowsFailed(false)
    let cancelled = false
    clients.ledger
      .getFlowCandidates(graphId, { entityId })
      .then((rows) => {
        if (!cancelled) setFlows(rows)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        console.error('Error loading cash flow rows:', err)
        setFlows([])
        setFlowsFailed(true)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphId, event?.id, offersFlow, entityId])

  // The commit teaches the counterparty: with no default yet, the account
  // becomes it unless the reviewer says not to; overriding one moves it only
  // when the reviewer asks. So the box is on by default when there is no
  // default, off when overriding one, and absent when confirming it.
  const rememberOffered =
    isClassifiable &&
    !hasSplit &&
    !!agent &&
    !!classifiedElementId &&
    agentDefault?.elementId !== classifiedElementId
  const rememberChecked = rememberChoice ?? agentDefault === null

  /** The classification patch a commit or classify call carries, or null
   *  when this event does not take one (a split set over MCP, a non-bank
   *  event, an internal transfer). */
  const classificationPatch = useMemo(() => {
    if (!isClassifiable || hasSplit) return null
    if (!classifiedElementId) return null
    const patch: Record<string, unknown> = {
      classified_element_id: classifiedElementId,
      classified_by: 'user',
    }
    if (flowQname) patch.classified_flow_qname = flowQname
    else if (priorFlowQname) patch.classified_flow_qname = null
    if (rememberOffered) patch.remember_classification = rememberChecked
    return patch
  }, [
    isClassifiable,
    hasSplit,
    classifiedElementId,
    flowQname,
    priorFlowQname,
    rememberOffered,
    rememberChecked,
  ])

  const needsClassification =
    isClassifiable && !hasSplit && !classifiedElementId

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
      entity_id: entityId ?? null,
      metadata: {
        ...((e.metadata ?? {}) as Record<string, unknown>),
        ...(classificationPatch ?? {}),
      },
      apply_handlers: false,
    }),
    [classificationPatch, entityId]
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
      setFailedAction('preview')
    } finally {
      setActionInFlight(null)
    }
  }, [event, graphId, buildPreviewBody])

  const handleApprove = useCallback(async () => {
    if (!event) return
    if (needsClassification) {
      setError({
        message:
          'Choose the account this bank line posts to before approving it.',
      })
      return
    }
    setError(null)
    setActionInFlight('approve')
    try {
      await clients.ledger.updateEventBlock(graphId, {
        event_id: event.id,
        transition_to: 'committed',
        ...(classificationPatch ? { metadata_patch: classificationPatch } : {}),
        ...(settlement.length > 0 ? { discharge_allocations: settlement } : {}),
      })
      onApproved(event.id)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(friendlyError(message))
      setFailedAction('approve')
    } finally {
      setActionInFlight(null)
    }
  }, [
    event,
    graphId,
    onApproved,
    classificationPatch,
    needsClassification,
    settlement,
  ])

  // Record the account choice without posting — for a review pass that
  // batches the posting later, or a second pair of eyes before commit.
  const handleClassify = useCallback(async () => {
    if (!event || !classificationPatch) return
    setError(null)
    setActionInFlight('classify')
    try {
      await clients.ledger.updateEventBlock(graphId, {
        event_id: event.id,
        ...(event.status === 'captured' ? { transition_to: 'classified' } : {}),
        metadata_patch: classificationPatch,
      })
      if (event.status === 'captured') onClassified?.(event.id)
      await loadEvent()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(friendlyError(message))
      setFailedAction('classify')
    } finally {
      setActionInFlight(null)
    }
  }, [event, graphId, classificationPatch, loadEvent, onClassified])

  // A posted line's flow changes in place: the server re-tags its lines,
  // closed month or not, and records the change on the event.
  const handleRetag = useCallback(async () => {
    if (!event) return
    setError(null)
    setActionInFlight('retag')
    try {
      await clients.ledger.updateEventBlock(graphId, {
        event_id: event.id,
        metadata_patch: { classified_flow_qname: flowQname || null },
      })
      await loadEvent()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(friendlyError(message))
      setFailedAction('retag')
    } finally {
      setActionInFlight(null)
    }
  }, [event, graphId, flowQname, loadEvent])

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
      setFailedAction('reject')
    } finally {
      setActionInFlight(null)
      setConfirmReject(false)
    }
  }, [event, graphId, onRejected])

  const retry: Record<Action, () => void> = {
    preview: handlePreview,
    approve: handleApprove,
    classify: handleClassify,
    retag: handleRetag,
    reject: handleReject,
  }

  const entries = journalEntries(event?.metadata)

  const isTerminal =
    event && ['voided', 'fulfilled', 'superseded'].includes(event.status)
  // Approve commits the event; only these statuses can move to `committed`.
  const canApprove = !!event && APPROVABLE_STATUSES.has(event.status)

  const chosenAccount = (accounts ?? []).find(
    (account) => account.id === classifiedElementId
  )
  // A tag the statement no longer presents stays visible as what it is;
  // one the rows could not be checked against is just kept.
  const strandedFlow =
    priorFlowQname &&
    flows !== null &&
    !flowsFailed &&
    !flows.some((flow) => flow.qname === priorFlowQname)
      ? priorFlowQname
      : null
  const unloadedFlow = priorFlowQname && flowsFailed ? priorFlowQname : null

  const flowPicker = (
    <div className="mt-3">
      <Label
        htmlFor="bank-classified-flow"
        className="mb-1 block text-xs text-gray-500 dark:text-gray-400"
      >
        Cash flow row
      </Label>
      <Select
        id="bank-classified-flow"
        value={flowQname}
        onChange={(e) => {
          setFlowQname(e.target.value)
          setPreview(null)
        }}
        disabled={flows === null || actionInFlight !== null}
      >
        <option value="">
          {flows === null
            ? 'Loading cash flow rows…'
            : "Account's default flow"}
        </option>
        {strandedFlow && (
          <option value={strandedFlow}>
            {strandedFlow} (not a row of this statement)
          </option>
        )}
        {unloadedFlow && <option value={unloadedFlow}>{unloadedFlow}</option>}
        {FLOW_SECTIONS.map((section) => {
          const rows = (flows ?? []).filter(
            (flow) => flow.activity === section.activity
          )
          if (rows.length === 0) return null
          return (
            <optgroup key={section.activity} label={section.label}>
              {rows.map((flow) => (
                <option key={flow.qname} value={flow.qname}>
                  {flow.name}
                </option>
              ))}
            </optgroup>
          )
        })}
      </Select>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {flowsFailed
          ? "The statement's rows could not be loaded; the current tag is kept."
          : "Only for a loan drawn or repaid, capital put in or taken out, or an asset bought or sold: the row the cash flow statement shows it on instead of the account's own."}
      </p>
    </div>
  )

  return (
    <Modal show onClose={onClose} size="4xl">
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
          <Alert color="failure">
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

            <EventDocumentSection
              graphId={graphId}
              eventId={event.id}
              status={event.status}
              description={event.description ?? null}
              documentId={event.documentId ?? null}
              onChanged={loadEvent}
            />

            {/* Bank-feed classification — the account this line posts to */}
            {isClassifiable && (
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div className="mb-2 flex items-center gap-2">
                  <HiTag className="h-4 w-4 text-gray-400" />
                  <h4 className="font-heading text-sm font-bold text-gray-900 dark:text-white">
                    Post to account
                  </h4>
                  {suggestionSource && (
                    <Badge
                      color={suggestionSourceColor(suggestionSource)}
                      size="sm"
                    >
                      {suggestionSourceLabel(suggestionSource)}
                    </Badge>
                  )}
                </div>
                {hasSplit ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Split across{' '}
                    {(eventMetadata.classified_allocations as unknown[]).length}{' '}
                    accounts (set over MCP). Approve posts the split as
                    recorded.
                  </p>
                ) : (
                  <>
                    <Label
                      htmlFor="bank-classified-element"
                      className="sr-only"
                    >
                      Post to account
                    </Label>
                    <Select
                      id="bank-classified-element"
                      value={classifiedElementId}
                      onChange={(e) => {
                        setClassifiedElementId(e.target.value)
                        setRememberChoice(null)
                        setPreview(null)
                      }}
                      disabled={accounts === null || actionInFlight !== null}
                    >
                      <option value="">
                        {accounts === null
                          ? 'Loading chart of accounts…'
                          : 'Choose an account…'}
                      </option>
                      {(accounts ?? []).map((account) => (
                        <option key={account.id} value={account.id}>
                          {accountLabel(account)}
                          {account.id === suggestedElementId
                            ? ' (suggested)'
                            : ''}
                        </option>
                      ))}
                    </Select>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {suggestedAccountName
                        ? `Suggested: ${suggestedAccountName}` +
                          (suggestedElementId
                            ? ''
                            : ' — no matching account on this chart; choose one.')
                        : 'No suggestion for this line; choose the account it posts to.'}
                    </p>
                    {suggestionBasis && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {suggestionBasis}
                      </p>
                    )}
                    {rememberOffered && agent && (
                      <div className="mt-3 flex items-start gap-2">
                        <Checkbox
                          id="bank-remember-classification"
                          checked={rememberChecked}
                          onChange={(e) => setRememberChoice(e.target.checked)}
                          disabled={actionInFlight !== null}
                        />
                        <Label
                          htmlFor="bank-remember-classification"
                          className="text-sm text-gray-700 dark:text-gray-300"
                        >
                          Remember for {agent.name}
                          <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">
                            {agentDefault
                              ? `Make ${chosenAccount?.name ?? 'this account'} the default instead of ${agentDefault.accountName ?? 'the current one'}.`
                              : `Suggest ${chosenAccount?.name ?? 'this account'} on ${agent.name}'s next lines.`}
                          </span>
                        </Label>
                      </div>
                    )}
                    {flowPicker}
                  </>
                )}
              </div>
            )}

            {/* The bill or invoice this line pays, by a person's pick */}
            {isClassifiable && (
              <SettlementPicker
                graphId={graphId}
                eventId={event.id}
                disabled={actionInFlight !== null}
                onChange={setSettlement}
              />
            )}

            {/* A posted bank line: the account is fixed, the flow can move */}
            {isPostedBankLine && !hasSplit && (
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div className="mb-2 flex items-center gap-2">
                  <HiTag className="h-4 w-4 text-gray-400" />
                  <h4 className="font-heading text-sm font-bold text-gray-900 dark:text-white">
                    Cash flow row
                  </h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This line has posted. Its account is fixed here; its flow can
                  still change, and the statement re-reads it in place.
                </p>
                {flowPicker}
                <Button
                  size="xs"
                  color="light"
                  className="mt-2"
                  onClick={handleRetag}
                  disabled={
                    actionInFlight !== null ||
                    flows === null ||
                    flowQname === priorFlowQname
                  }
                >
                  {actionInFlight === 'retag' ? 'Saving…' : 'Save flow'}
                </Button>
              </div>
            )}

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
              <Alert color="failure">
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
                {error.retryable && failedAction && (
                  <Button
                    size="xs"
                    color="light"
                    className="mt-2"
                    disabled={actionInFlight !== null}
                    onClick={() => retry[failedAction]()}
                  >
                    Try again
                  </Button>
                )}
              </Alert>
            )}

            {/* Reject confirm */}
            {confirmReject && (
              <Alert color="warning">
                <HiExclamationCircle className="h-4 w-4" />
                <span className="font-medium">Reject this event?</span> It will
                be marked <code>voided</code> and won&apos;t post to the GL.
                <div className="mt-2 flex gap-2">
                  <Button
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
              color="light"
              onClick={handlePreview}
              disabled={actionInFlight !== null}
            >
              <HiEye className="mr-2 h-4 w-4" />
              {actionInFlight === 'preview' ? 'Previewing…' : 'Preview'}
            </Button>
            <Button
              color="failure"
              onClick={() => setConfirmReject(true)}
              disabled={actionInFlight !== null || confirmReject}
            >
              <HiX className="mr-2 h-4 w-4" />
              Reject
            </Button>
            {isClassifiable && !hasSplit && (
              <Button
                color="light"
                onClick={handleClassify}
                disabled={actionInFlight !== null || !classificationPatch}
                title="Record the account without posting"
              >
                <HiTag className="mr-2 h-4 w-4" />
                {actionInFlight === 'classify' ? 'Saving…' : 'Classify'}
              </Button>
            )}
            {canApprove && (
              <Button
                color="success"
                onClick={handleApprove}
                disabled={actionInFlight !== null}
              >
                <HiCheck className="mr-2 h-4 w-4" />
                {actionInFlight === 'approve' ? 'Approving…' : 'Approve'}
              </Button>
            )}
          </div>
        )}
        <Button color="gray" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default EventBlockDetailModal
