'use client'

import { clients, customTheme } from '@/lib/core'
import { Spinner } from '@/lib/core/ui-components'
import {
  formatAddress,
  formatAmount,
  formatDate,
} from '@/lib/ledger/formatters'
import type {
  LedgerAgentDetail,
  LedgerEventBlock,
} from '@robosystems/client/clients'
import {
  Alert,
  Badge,
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'flowbite-react'
import Link from 'next/link'
import { type FC, useEffect, useState } from 'react'
import { HiExclamationCircle } from 'react-icons/hi'

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

const AgentDetailModal: FC<Props> = function ({ graphId, agentId, onClose }) {
  const [agent, setAgent] = useState<LedgerAgentDetail | null>(null)
  const [events, setEvents] = useState<LedgerEventBlock[]>([])
  // Single flag — agent + events are fetched in one Promise.all and always
  // resolve together, so two flags would never differ in practice.
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        setLoading(true)
        setError(null)
        const [agentDetail, eventList] = await Promise.all([
          clients.ledger.getAgent(graphId, agentId),
          clients.ledger.listEventBlocks(graphId, { agentId, limit: 20 }),
        ])
        if (cancelled) return
        eventList.sort(
          (a, b) =>
            new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
        )
        setAgent(agentDetail)
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
  }, [graphId, agentId])

  return (
    <Modal show onClose={onClose} size="3xl" theme={customTheme.modal}>
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
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <Alert theme={customTheme.alert} color="failure">
            <HiExclamationCircle className="h-4 w-4" />
            {error}
          </Alert>
        ) : !agent ? (
          <Alert theme={customTheme.alert} color="failure">
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
                  <Table theme={customTheme.table}>
                    <TableHead>
                      <TableHeadCell>Date</TableHeadCell>
                      <TableHeadCell>Type</TableHeadCell>
                      <TableHeadCell>Status</TableHeadCell>
                      <TableHeadCell className="text-right">
                        Amount
                      </TableHeadCell>
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
        <Button theme={customTheme.button} color="gray" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default AgentDetailModal
