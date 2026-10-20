'use client'

import { useEntityScope } from '@/lib/entity-scope'
import {
  accountLabel,
  type AccountOption,
  type AccountTreeNode,
  flattenAccountTree,
} from '@/lib/ledger/accounts'
import { friendlyError } from '@/lib/ledger/errors'
import {
  formatAddress,
  formatAmount,
  formatDate,
} from '@/lib/ledger/formatters'
import type {
  LedgerAgentDetail,
  LedgerEventBlock,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'flowbite-react'
import Link from 'next/link'
import { type FC, useCallback, useEffect, useState } from 'react'
import { HiExclamationCircle, HiTag } from 'react-icons/hi'
import OpenBalanceTile from './OpenBalanceTile'

interface Props {
  graphId: string
  agentId: string
  onClose: () => void
}

const TYPE_BADGE_COLOR: Record<string, string> = {
  customer: 'success',
  vendor: 'warning',
  employee: 'purple',
}

/** How often the default held, for the counts the server keeps on it. */
const heldOn = (confirmations: number, overrides: number): string => {
  const seen = confirmations + overrides
  if (seen === 0) return 'Set by hand; no committed line has tested it yet.'
  const lines = seen === 1 ? 'line' : 'lines'
  return `Held on ${confirmations} of ${seen} committed ${lines}.`
}

/** The entity in scope's own default; each entity keeps one, on its chart. */
const defaultFor = (
  detail: LedgerAgentDetail | null,
  entityId: string | null
) =>
  (entityId
    ? detail?.classifications.find((c) => c.entityId === entityId)
    : detail?.classification) ?? null

const AgentDetailModal: FC<Props> = function ({ graphId, agentId, onClose }) {
  // The default shown and set is the entity in scope's, chosen from its
  // chart: the one the inbox posts its lines from this counterparty to.
  const { entityId } = useEntityScope()
  const [agent, setAgent] = useState<LedgerAgentDetail | null>(null)
  const [events, setEvents] = useState<LedgerEventBlock[]>([])
  // Single flag — agent + events are fetched in one Promise.all and always
  // resolve together, so two flags would never differ in practice.
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // The default account: the one its bank lines are suggested, learned from
  // committed lines or set here. `alwaysAsk` keeps it without offering it.
  const [accounts, setAccounts] = useState<AccountOption[] | null>(null)
  const [chartFailed, setChartFailed] = useState(false)
  const [defaultElementId, setDefaultElementId] = useState('')
  const [alwaysAsk, setAlwaysAsk] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const seedDefault = useCallback(
    (detail: LedgerAgentDetail) => {
      const own = defaultFor(detail, entityId)
      setDefaultElementId(own?.elementId ?? '')
      setAlwaysAsk(own?.mode === 'always_ask')
    },
    [entityId]
  )

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        setLoading(true)
        setError(null)
        const [agentDetail, eventList] = await Promise.all([
          clients.ledger.getAgent(graphId, agentId),
          clients.ledger.listEventBlocks(graphId, {
            agentId,
            entityId,
            limit: 20,
          }),
        ])
        if (cancelled) return
        eventList.sort(
          (a, b) =>
            new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
        )
        setAgent(agentDetail)
        if (agentDetail) seedDefault(agentDetail)
        setEvents(eventList)
      } catch (err) {
        if (cancelled) return
        console.error('Error loading agent detail:', err)
        setError('Failed to load agent.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [graphId, agentId, entityId, seedDefault])

  useEffect(() => {
    let cancelled = false
    clients.ledger
      .getAccountTree(graphId, { entityId })
      .then((tree) => {
        if (cancelled) return
        setAccounts(
          flattenAccountTree(
            (tree?.roots ?? []) as unknown as AccountTreeNode[]
          )
        )
      })
      .catch((err: unknown) => {
        if (cancelled) return
        console.error('Error loading chart of accounts:', err)
        setAccounts([])
        setChartFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [graphId, entityId])

  const current = defaultFor(agent, entityId)
  // Always-ask means nothing without an account to hold back.
  const effectiveAlwaysAsk = defaultElementId ? alwaysAsk : false
  const dirty =
    !!agent &&
    (defaultElementId !== (current?.elementId ?? '') ||
      effectiveAlwaysAsk !== (current?.mode === 'always_ask'))
  // A default the chart no longer offers (retired, or another entity's)
  // stays visible as what it is rather than vanishing from the picker; one
  // the chart could not be checked against is just kept.
  const strandedDefault =
    current &&
    accounts !== null &&
    !chartFailed &&
    !accounts.some((account) => account.id === current.elementId)
      ? current
      : null
  const unloadedDefault = current && chartFailed ? current : null

  const handleSave = useCallback(async () => {
    if (!agent || !dirty) return
    setSaving(true)
    setSaveError(null)
    try {
      await clients.ledger.updateAgent(graphId, {
        agent_id: agent.id,
        ...(entityId ? { classification_entity_id: entityId } : {}),
        ...(defaultElementId
          ? {
              classification_element_id: defaultElementId,
              classification_mode: alwaysAsk ? 'always_ask' : 'suggest',
            }
          : { classification_element_id: '' }),
      })
      const fresh = await clients.ledger.getAgent(graphId, agentId)
      if (fresh) {
        setAgent(fresh)
        seedDefault(fresh)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setSaveError(friendlyError(message).message)
    } finally {
      setSaving(false)
    }
  }, [
    agent,
    agentId,
    alwaysAsk,
    defaultElementId,
    dirty,
    entityId,
    graphId,
    seedDefault,
  ])

  return (
    <Modal show onClose={onClose} size="3xl">
      <ModalHeader>
        {agent ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-heading text-lg">{agent.name}</span>
            <Badge
              color={TYPE_BADGE_COLOR[agent.agentType] || 'gray'}
              size="sm"
            >
              {agent.agentType}
            </Badge>
            {!agent.isActive && (
              <Badge color="gray" size="sm">
                inactive
              </Badge>
            )}
          </div>
        ) : (
          'Agent detail'
        )}
      </ModalHeader>

      <ModalBody>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <Alert color="failure">
            <HiExclamationCircle className="h-4 w-4" />
            {error}
          </Alert>
        ) : !agent ? (
          <Alert color="failure">
            <HiExclamationCircle className="h-4 w-4" />
            Agent not found.
          </Alert>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4 text-sm sm:grid-cols-3 dark:bg-gray-800">
              {agent.legalName && (
                <div className="col-span-2 sm:col-span-3">
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    Legal name
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {agent.legalName}
                  </span>
                </div>
              )}
              <div>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  Email
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {agent.email || '—'}
                </span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  Phone
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {agent.phone || '—'}
                </span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  Tax id
                </span>
                <span className="font-mono text-gray-900 dark:text-white">
                  {agent.taxId || '—'}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-3">
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  Address
                </span>
                <span className="text-gray-900 dark:text-white">
                  {formatAddress(agent.address)}
                </span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  Source
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {agent.source}
                </span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  External id
                </span>
                <span className="font-mono text-xs text-gray-900 dark:text-white">
                  {agent.externalId || '—'}
                </span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  1099 recipient
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {agent.is1099Recipient ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            <OpenBalanceTile
              graphId={graphId}
              agentId={agentId}
              entityId={entityId}
            />

            {/* The default account its bank lines are suggested */}
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="mb-2 flex items-center gap-2">
                <HiTag className="h-4 w-4 text-gray-400" />
                <h4 className="font-heading text-sm font-bold text-gray-900 dark:text-white">
                  Default account
                </h4>
              </div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                {current
                  ? heldOn(current.confirmations, current.overrides) +
                    (current.setAt ? ` Set ${formatDate(current.setAt)}.` : '')
                  : 'None yet. The first bank line committed for this counterparty sets it, or choose one here.'}
              </p>
              <Label htmlFor="agent-default-account" className="sr-only">
                Default account
              </Label>
              <Select
                id="agent-default-account"
                value={defaultElementId}
                onChange={(e) => {
                  setDefaultElementId(e.target.value)
                  if (!e.target.value) setAlwaysAsk(false)
                }}
                disabled={accounts === null || saving}
              >
                <option value="">
                  {accounts === null
                    ? 'Loading chart of accounts…'
                    : 'No default'}
                </option>
                {strandedDefault && (
                  <option value={strandedDefault.elementId}>
                    {strandedDefault.accountName ?? strandedDefault.elementId}{' '}
                    (not on this chart)
                  </option>
                )}
                {unloadedDefault && (
                  <option value={unloadedDefault.elementId}>
                    {unloadedDefault.accountName ?? unloadedDefault.elementId}
                  </option>
                )}
                {(accounts ?? []).map((account) => (
                  <option key={account.id} value={account.id}>
                    {accountLabel(account)}
                  </option>
                ))}
              </Select>
              <div className="mt-3 flex items-start gap-2">
                <Checkbox
                  id="agent-always-ask"
                  checked={alwaysAsk}
                  onChange={(e) => setAlwaysAsk(e.target.checked)}
                  disabled={!defaultElementId || saving}
                />
                <Label
                  htmlFor="agent-always-ask"
                  className="text-sm text-gray-700 dark:text-gray-300"
                >
                  Always ask
                  <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">
                    Keep the default but never suggest it, for a counterparty
                    whose lines go to different accounts.
                  </span>
                </Label>
              </div>
              {saveError && (
                <Alert color="failure" className="mt-3">
                  <HiExclamationCircle className="h-4 w-4" />
                  {saveError}
                </Alert>
              )}
              <Button
                size="xs"
                color="light"
                className="mt-3"
                onClick={handleSave}
                disabled={!dirty || saving}
              >
                {saving ? 'Saving…' : 'Save default'}
              </Button>
            </div>

            <div>
              <h4 className="font-heading mb-2 text-sm font-bold text-gray-900 dark:text-white">
                Recent events
              </h4>
              {events.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No events linked to this agent yet.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  <Table>
                    <TableHead>
                      <tr>
                        <TableHeadCell>Date</TableHeadCell>
                        <TableHeadCell>Type</TableHeadCell>
                        <TableHeadCell>Status</TableHeadCell>
                        <TableHeadCell className="text-right">
                          Amount
                        </TableHeadCell>
                      </tr>
                    </TableHead>
                    <TableBody>
                      {events.map((evt) => (
                        <TableRow key={evt.id}>
                          <TableCell className="whitespace-nowrap text-gray-900 dark:text-white">
                            {formatDate(evt.occurredAt)}
                          </TableCell>
                          <TableCell>
                            <Badge color="info" size="sm" className="w-fit">
                              {evt.eventType.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              color={
                                evt.status === 'committed' ||
                                evt.status === 'fulfilled'
                                  ? 'success'
                                  : evt.status === 'voided'
                                    ? 'failure'
                                    : 'gray'
                              }
                              size="sm"
                            >
                              {evt.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatAmount(evt.amount ?? null, evt.currency)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        {agent && (
          <Link
            href={`/ledger/inbox?agentId=${encodeURIComponent(agent.id)}`}
            className="text-primary-600 dark:text-primary-400 text-sm font-medium hover:underline"
          >
            View all events in inbox →
          </Link>
        )}
        <Button color="gray" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default AgentDetailModal
