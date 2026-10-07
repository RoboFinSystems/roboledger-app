'use client'

import { hierarchyDepth } from '@/lib/entity-scope'
import { apiErrorMessage } from '@/lib/ledger/errors'
import type {
  LedgerAccount,
  LedgerBankAccount,
  LedgerEntitySummary,
} from '@robosystems/client/clients'
import { clients } from '@robosystems/core'
import {
  Alert,
  Button,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Radio,
  Select,
} from 'flowbite-react'
import { useEffect, useMemo, useState } from 'react'

export type MoveResult = Awaited<
  ReturnType<typeof clients.ledger.linkBankAccount>
>

interface MoveAccountModalProps {
  show: boolean
  account: LedgerBankAccount | null
  entities: LedgerEntitySummary[]
  graphId: string | null
  onClose: () => void
  onMoved: (result: MoveResult) => void
  onError?: (message: string) => void
}

/** What the ledger facades take for an entity: a subsidiary's id, or null for the parent. */
const scopeOf = (entity: LedgerEntitySummary): string | null =>
  entity.isParent ? null : entity.id

/**
 * Point a feed account at another chart account: a new one in an entity's
 * chart (the default, how an account is bound to a subsidiary), or an
 * existing account of that entity. The feed's inbox lines move with it;
 * posted entries stay.
 */
export default function MoveAccountModal({
  show,
  account,
  entities,
  graphId,
  onClose,
  onMoved,
  onError,
}: MoveAccountModalProps) {
  const [entityId, setEntityId] = useState<string>('')
  const [mode, setMode] = useState<'create' | 'existing'>('create')
  const [elementId, setElementId] = useState<string>('')
  const [candidates, setCandidates] = useState<LedgerAccount[]>([])
  const [loadingCandidates, setLoadingCandidates] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset for each account: default to the first entity that is not the
  // one the account is in, since moving is the reason the modal opens.
  useEffect(() => {
    if (!show || !account) return
    const other = entities.find((e) => e.id !== account.entityId)
    setEntityId(other?.id ?? entities[0]?.id ?? '')
    setMode('create')
    setElementId('')
    setCandidates([])
    setError(null)
  }, [show, account, entities])

  const entity = useMemo(
    () => entities.find((e) => e.id === entityId) ?? null,
    [entities, entityId]
  )

  // The chosen entity's active accounts, for linking to one that exists.
  useEffect(() => {
    if (!show || mode !== 'existing' || !graphId || !entity) return
    let cancelled = false
    setLoadingCandidates(true)
    void clients.ledger
      .listAccounts(graphId, {
        entityId: scopeOf(entity),
        isActive: true,
        limit: 500,
      })
      .then((list) => {
        if (cancelled) return
        const rows = (list?.accounts ?? []).filter(
          (row) => row.id !== account?.id
        )
        setCandidates(rows)
        setElementId((current) =>
          rows.some((row) => row.id === current) ? current : (rows[0]?.id ?? '')
        )
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(apiErrorMessage(err, 'Accounts could not be loaded'))
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingCandidates(false)
      })
    return () => {
      cancelled = true
    }
  }, [show, mode, graphId, entity, account?.id])

  const canSubmit =
    Boolean(graphId && account?.feedAccountId && account.connectionId) &&
    (mode === 'create' ? Boolean(entityId) : Boolean(elementId)) &&
    !submitting

  const handleSubmit = async () => {
    if (!graphId || !account?.feedAccountId || !account.connectionId) return
    setSubmitting(true)
    setError(null)
    try {
      const result = await clients.ledger.linkBankAccount(graphId, {
        connection_id: account.connectionId,
        account_id: account.feedAccountId,
        ...(mode === 'existing'
          ? { element_id: elementId }
          : { entity_id: entityId }),
      })
      onMoved(result)
    } catch (err) {
      const message = apiErrorMessage(err, 'The account could not be moved')
      setError(message)
      onError?.(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal show={show} onClose={onClose} size="lg">
      <ModalHeader>Move {account?.name ?? 'account'}</ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {account?.feedAccountName ?? account?.name}
            {account?.institution ? ` at ${account.institution}` : ''} books to
            the entity whose chart account it is linked to. Pick the entity, and
            whether to create its account there or use one it already has.
          </p>

          {error && <Alert color="failure">{error}</Alert>}

          <div>
            <Label htmlFor="move-entity">Entity</Label>
            <Select
              id="move-entity"
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              disabled={submitting}
            >
              {entities.map((row) => (
                <option key={row.id} value={row.id}>
                  {' '.repeat(hierarchyDepth(row, entities) * 2)}
                  {row.name}
                  {row.id === account?.entityId ? ' (current)' : ''}
                </option>
              ))}
            </Select>
          </div>

          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-medium text-gray-900 dark:text-white">
              Chart account
            </legend>
            <div className="flex items-center gap-2">
              <Radio
                id="move-create"
                name="move-mode"
                checked={mode === 'create'}
                onChange={() => setMode('create')}
                disabled={submitting}
              />
              <Label htmlFor="move-create">
                Create a new account in {entity?.name ?? 'the entity'}’s chart
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Radio
                id="move-existing"
                name="move-mode"
                checked={mode === 'existing'}
                onChange={() => setMode('existing')}
                disabled={submitting}
              />
              <Label htmlFor="move-existing">Link to an existing account</Label>
            </div>
          </fieldset>

          {mode === 'existing' && (
            <div>
              <Label htmlFor="move-element">Account</Label>
              <Select
                id="move-element"
                value={elementId}
                onChange={(e) => setElementId(e.target.value)}
                disabled={submitting || loadingCandidates}
              >
                {candidates.length === 0 && (
                  <option value="">
                    {loadingCandidates
                      ? 'Loading…'
                      : 'No accounts on this chart'}
                  </option>
                )}
                {candidates.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.code ? `${row.code} · ` : ''}
                    {row.name}
                  </option>
                ))}
              </Select>
              <p className="mt-1 text-xs text-gray-500">
                An account another feed already books to is refused.
              </p>
            </div>
          )}

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Lines still in the inbox move with the account. Across entities
            their suggestions are matched again on the new chart, and any
            already classified to the old chart go back to the inbox. Posted
            entries stay where they were posted.
          </p>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button color="blue" onClick={handleSubmit} disabled={!canSubmit}>
          {submitting ? 'Moving…' : 'Move account'}
        </Button>
        <Button color="gray" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  )
}
