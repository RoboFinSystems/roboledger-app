'use client'

import { friendlyError } from '@/lib/ledger/errors'
import { formatDateTime } from '@/lib/ledger/formatters'
import { useLedgerGraph } from '@/lib/useLedgerGraph'
import type { LedgerEventHandler } from '@robosystems/client/clients'
import type { UpdateEventHandlerRequest } from '@robosystems/client/types'
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
  Label,
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
  Textarea,
  TextInput,
} from 'flowbite-react'
import type { FC } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { HiExclamationCircle, HiLightningBolt } from 'react-icons/hi'

type View = 'awaiting' | 'all'

const MATCH_FIELDS = [
  ['eventCategory', 'category'],
  ['matchSource', 'source'],
  ['matchAgentType', 'counterparty'],
  ['matchResourceType', 'resource'],
] as const

/** What a handler matches, as a person reads it. */
export function describeMatch(handler: LedgerEventHandler): string {
  const parts: string[] = [handler.eventType]
  for (const [field, label] of MATCH_FIELDS) {
    const value = handler[field]
    if (value) parts.push(`${label} ${value}`)
  }
  const expression = handler.matchMetadataExpression as Record<
    string,
    unknown
  > | null
  if (expression && Object.keys(expression).length) {
    parts.push(
      Object.entries(expression)
        .map(([k, v]) => `${k} = ${JSON.stringify(v)}`)
        .join(', ')
    )
  }
  return parts.join(' · ')
}

/** Live, inactive, or waiting for a person — the one state that matters. */
function StateBadge({ handler }: { handler: LedgerEventHandler }) {
  if (handler.awaitingApproval) {
    return <Badge color="warning">Waiting for approval</Badge>
  }
  if (!handler.isActive) return <Badge color="gray">Inactive</Badge>
  return <Badge color="success">Live</Badge>
}

/**
 * The posting rules — event handlers — that turn a matching event into GL
 * rows, and the queue of the ones an AI client proposed. An AI proposes; a
 * person approves here, and until then the rule takes no part in matching.
 */
const PostingRulesContent: FC = function () {
  const { graph: currentGraph } = useLedgerGraph()
  const graphId = currentGraph?.graphId

  const [view, setView] = useState<View>('awaiting')
  const [handlers, setHandlers] = useState<LedgerEventHandler[]>([])
  const [awaitingCount, setAwaitingCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [editing, setEditing] = useState<LedgerEventHandler | null>(null)

  const graphIdRef = useRef(graphId)
  graphIdRef.current = graphId

  const load = useCallback(async () => {
    if (!graphId) return
    const requested = graphId
    try {
      setIsLoading(true)
      setError(null)
      const [awaiting, all] = await Promise.all([
        clients.ledger.listEventHandlers(graphId, { awaitingApproval: true }),
        clients.ledger.listEventHandlers(graphId),
      ])
      if (graphIdRef.current !== requested) return
      setAwaitingCount(awaiting.length)
      setHandlers(view === 'awaiting' ? awaiting : all)
    } catch (err) {
      if (graphIdRef.current !== requested) return
      console.error('Failed to load posting rules:', err)
      setError('Failed to load posting rules.')
    } finally {
      if (graphIdRef.current === requested) setIsLoading(false)
    }
  }, [graphId, view])

  useEffect(() => {
    void load()
  }, [load])

  const update = async (
    handler: LedgerEventHandler,
    changes: Omit<UpdateEventHandlerRequest, 'event_handler_id'>
  ): Promise<boolean> => {
    if (!graphId) return false
    try {
      setBusyId(handler.id)
      setError(null)
      await clients.ledger.updateEventHandler(graphId, {
        event_handler_id: handler.id,
        ...changes,
        // An approval covers exactly the version the person reviewed; the API
        // refuses it if the rule changed since this row was loaded.
        ...(changes.approve === true
          ? { expected_updated_at: handler.updatedAt }
          : {}),
      })
      await load()
      return true
    } catch (err) {
      setError(
        friendlyError(
          err instanceof Error ? err.message : 'The rule was not changed.'
        ).message
      )
      return false
    } finally {
      setBusyId(null)
    }
  }

  return (
    <PageLayout>
      <PageHeader
        icon={HiLightningBolt}
        title="Posting Rules"
        subtitle="The rules that turn a matching event into journal entries"
      />

      {error && (
        <Alert
          color="failure"
          icon={HiExclamationCircle}
          onDismiss={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      <div className="flex gap-2" role="tablist">
        <Button
          size="sm"
          color={view === 'awaiting' ? 'blue' : 'light'}
          onClick={() => setView('awaiting')}
          role="tab"
          aria-selected={view === 'awaiting'}
        >
          Waiting for approval ({awaitingCount})
        </Button>
        <Button
          size="sm"
          color={view === 'all' ? 'blue' : 'light'}
          onClick={() => setView('all')}
          role="tab"
          aria-selected={view === 'all'}
        >
          All rules
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <LoadingState size="lg" className="py-12" />
        ) : handlers.length === 0 ? (
          <EmptyState
            icon={HiLightningBolt}
            title={
              view === 'awaiting' ? 'Nothing waiting' : 'No posting rules yet'
            }
            description={
              view === 'awaiting'
                ? 'A rule an AI client writes waits here until you approve it; until then it books nothing.'
                : 'Bank lines and the common transactions post through built-in handlers. A posting rule adds a pattern of your own; an AI client can propose one for you to approve.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <tr>
                  <TableHeadCell>Rule</TableHeadCell>
                  <TableHeadCell>Matches</TableHeadCell>
                  <TableHeadCell>Priority</TableHeadCell>
                  <TableHeadCell>State</TableHeadCell>
                  <TableHeadCell className="w-64"></TableHeadCell>
                </tr>
              </TableHead>
              <TableBody>
                {handlers.map((handler) => {
                  const busy = busyId === handler.id
                  const platform = handler.origin === 'hub'
                  return (
                    <TableRow key={handler.id}>
                      <TableCell className="font-medium text-gray-900 dark:text-white">
                        <div className="flex flex-col">
                          <span>{handler.name}</span>
                          <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                            {platform
                              ? 'Platform rule'
                              : handler.suggestedBy === 'ai'
                                ? `Proposed by an AI client${handler.createdBy ? ` for ${handler.createdBy}` : ''}`
                                : `Written by ${handler.createdBy ?? 'a person'}`}
                            {handler.approvedAt &&
                              ` · approved ${formatDateTime(handler.approvedAt)}`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {describeMatch(handler)}
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">
                        {handler.priority}
                      </TableCell>
                      <TableCell>
                        <StateBadge handler={handler} />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap justify-end gap-2">
                          {handler.awaitingApproval && (
                            <Button
                              size="xs"
                              color="blue"
                              disabled={busy}
                              onClick={() => update(handler, { approve: true })}
                            >
                              Approve
                            </Button>
                          )}
                          {!platform && (
                            <Button
                              size="xs"
                              color="light"
                              disabled={busy}
                              onClick={() => setEditing(handler)}
                            >
                              {handler.awaitingApproval ? 'Review' : 'Edit'}
                            </Button>
                          )}
                          {!platform && (
                            <Button
                              size="xs"
                              color="light"
                              disabled={busy}
                              onClick={() =>
                                update(handler, {
                                  is_active: !handler.isActive,
                                })
                              }
                            >
                              {handler.isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {editing && (
        <EditRuleModal
          handler={editing}
          onClose={() => setEditing(null)}
          onSave={async (changes) => {
            if (await update(editing, changes)) setEditing(null)
          }}
        />
      )}
    </PageLayout>
  )
}

interface EditRuleModalProps {
  handler: LedgerEventHandler
  onClose: () => void
  onSave: (
    changes: Omit<UpdateEventHandlerRequest, 'event_handler_id'>
  ) => Promise<void>
}

/**
 * A rule's name, priority, match and template. An AI-proposed rule is
 * reviewed here and can be approved in the same save.
 */
const EditRuleModal: FC<EditRuleModalProps> = ({
  handler,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(handler.name)
  const [description, setDescription] = useState(handler.description ?? '')
  const [priority, setPriority] = useState(String(handler.priority))
  const [source, setSource] = useState(handler.matchSource ?? '')
  const [category, setCategory] = useState(handler.eventCategory ?? '')
  const [template, setTemplate] = useState(
    JSON.stringify(handler.transactionTemplate, null, 2)
  )
  const [saving, setSaving] = useState(false)

  let parsedTemplate: unknown = null
  let templateError: string | null = null
  try {
    parsedTemplate = JSON.parse(template)
  } catch {
    templateError = 'The template is not valid JSON.'
  }
  const priorityValue = Number(priority)
  const priorityError = !Number.isInteger(priorityValue)
    ? 'Priority is a whole number.'
    : null
  const invalid = Boolean(templateError || priorityError || !name.trim())

  const changes = (): Omit<UpdateEventHandlerRequest, 'event_handler_id'> => {
    const out: Omit<UpdateEventHandlerRequest, 'event_handler_id'> = {}
    if (name.trim() !== handler.name) out.name = name.trim()
    if (description !== (handler.description ?? ''))
      out.description = description
    if (priorityValue !== handler.priority) out.priority = priorityValue
    if (source && source !== (handler.matchSource ?? ''))
      out.match_source = source
    if (category && category !== (handler.eventCategory ?? ''))
      out.event_category = category
    if (
      JSON.stringify(parsedTemplate) !==
      JSON.stringify(handler.transactionTemplate)
    )
      out.transaction_template =
        parsedTemplate as UpdateEventHandlerRequest['transaction_template']
    return out
  }

  const save = async (approve: boolean) => {
    if (invalid) return
    setSaving(true)
    await onSave({ ...changes(), ...(approve ? { approve: true } : {}) })
    setSaving(false)
  }

  return (
    <Modal show onClose={() => !saving && onClose()} size="2xl">
      <ModalHeader>
        {handler.awaitingApproval ? 'Review posting rule' : 'Edit posting rule'}
      </ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          {handler.awaitingApproval && (
            <Alert color="warning">
              An AI client proposed this rule. It books nothing until you
              approve it.
            </Alert>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Matches {describeMatch(handler)}.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="rule-name" className="mb-1 block">
                Name
              </Label>
              <TextInput
                id="rule-name"
                sizing="sm"
                value={name}
                disabled={saving}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="rule-priority" className="mb-1 block">
                Priority
              </Label>
              <TextInput
                id="rule-priority"
                sizing="sm"
                inputMode="numeric"
                value={priority}
                disabled={saving}
                color={priorityError ? 'failure' : undefined}
                onChange={(e) => setPriority(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="rule-source" className="mb-1 block">
                Source
              </Label>
              <TextInput
                id="rule-source"
                sizing="sm"
                value={source}
                placeholder="any"
                disabled={saving}
                onChange={(e) => setSource(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="rule-category" className="mb-1 block">
                Category
              </Label>
              <TextInput
                id="rule-category"
                sizing="sm"
                value={category}
                placeholder="any"
                disabled={saving}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="rule-description" className="mb-1 block">
              Description
            </Label>
            <TextInput
              id="rule-description"
              sizing="sm"
              value={description}
              disabled={saving}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="rule-template" className="mb-1 block">
              What it books
            </Label>
            <Textarea
              id="rule-template"
              rows={10}
              className="font-mono text-xs"
              value={template}
              disabled={saving}
              onChange={(e) => setTemplate(e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Each transaction&apos;s debit and credit legs, with amounts like{' '}
              <code>{'{{ event.amount }}'}</code>.
            </p>
            {templateError && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {templateError}
              </p>
            )}
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        {handler.awaitingApproval ? (
          <Button
            color="blue"
            disabled={invalid || saving}
            onClick={() => save(true)}
          >
            {saving ? 'Saving…' : 'Save and approve'}
          </Button>
        ) : (
          <Button
            color="blue"
            disabled={invalid || saving}
            onClick={() => save(false)}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        )}
        <Button color="light" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default PostingRulesContent
