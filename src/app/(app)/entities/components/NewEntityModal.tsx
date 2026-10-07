'use client'

import { friendlyError } from '@/lib/ledger/errors'
import type {
  LedgerEntity,
  LedgerEntitySummary,
} from '@robosystems/client/clients'
import type { CreateEntityRequest } from '@robosystems/client/types'
import { clients } from '@robosystems/core'
import {
  Alert,
  Button,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Select,
  TextInput,
} from 'flowbite-react'
import { type FC, type FormEvent, useEffect, useMemo, useState } from 'react'

/** Legal forms the server maps to a Reporting Style and a chart's equity rows. */
export const ENTITY_TYPES: ReadonlyArray<{ value: string; label: string }> = [
  { value: '', label: 'Not recorded' },
  { value: 'corporation', label: 'Corporation' },
  { value: 'llc', label: 'LLC' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'sole_proprietorship', label: 'Sole proprietorship' },
  { value: 'non_profit', label: 'Non-profit' },
]

interface NewEntityModalProps {
  graphId: string
  /** The graph's entities, hierarchy order; the parent picker lists them. */
  entities: readonly LedgerEntitySummary[]
  open: boolean
  onClose: () => void
  onCreated: (entity: LedgerEntity) => void
}

/**
 * Create an entity in the reporting group. A graph's first entity becomes the
 * group parent; every later one is held under the parent it names, with the
 * parent's share recorded as an ownership percent.
 */
const NewEntityModal: FC<NewEntityModalProps> = ({
  graphId,
  entities,
  open,
  onClose,
  onCreated,
}) => {
  const groupParent = useMemo(
    () => entities.find((e) => e.isParent) ?? entities[0] ?? null,
    [entities]
  )
  const isFirstEntity = entities.length === 0

  const [name, setName] = useState('')
  const [legalName, setLegalName] = useState('')
  const [entityType, setEntityType] = useState('')
  const [parentEntityId, setParentEntityId] = useState('')
  const [ownershipPct, setOwnershipPct] = useState('')
  const [ticker, setTicker] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fresh form each time it opens, held under the group parent by default.
  useEffect(() => {
    if (!open) return
    setName('')
    setLegalName('')
    setEntityType('')
    setParentEntityId(groupParent?.id ?? '')
    setOwnershipPct('')
    setTicker('')
    setError(null)
    setSubmitting(false)
  }, [open, groupParent])

  const ownershipInvalid =
    ownershipPct !== '' &&
    (Number.isNaN(Number(ownershipPct)) ||
      Number(ownershipPct) < 0 ||
      Number(ownershipPct) > 100)
  const canSubmit = name.trim().length > 0 && !ownershipInvalid && !submitting

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    const body: CreateEntityRequest = {
      name: name.trim(),
      legal_name: legalName.trim() || null,
      entity_type: entityType || null,
      ticker: ticker.trim() || null,
    }
    if (!isFirstEntity) {
      body.parent_entity_id = parentEntityId || null
      body.ownership_pct = ownershipPct === '' ? null : Number(ownershipPct)
    }
    try {
      const created = await clients.ledger.createEntity(graphId, body)
      onCreated(created)
    } catch (err) {
      // The facade throws `"Create entity failed: " + JSON.stringify(error)`,
      // so the server's refusal (a taken ticker, an unknown parent) is a
      // `{"detail": …}` blob inside the message; friendlyError reads it.
      setError(
        friendlyError(
          err instanceof Error ? err.message : 'Failed to create the entity.'
        ).message
      )
      setSubmitting(false)
    }
  }

  return (
    <Modal show={open} onClose={onClose} size="md">
      <ModalHeader>New Entity</ModalHeader>
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="space-y-4">
            {isFirstEntity ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This graph has no entity yet. The one you create becomes the
                group parent; every later entity is held under it.
              </p>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                A subsidiary keeps its own chart of accounts and closes on its
                own calendar. Its books roll up into the group parent&apos;s
                combined statements.
              </p>
            )}

            {error && <Alert color="failure">{error}</Alert>}

            <div>
              <Label htmlFor="new-entity-name" className="mb-1 block">
                Name
              </Label>
              <TextInput
                id="new-entity-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Maple Court LLC"
                required
              />
            </div>

            <div>
              <Label htmlFor="new-entity-legal-name" className="mb-1 block">
                Legal name
              </Label>
              <TextInput
                id="new-entity-legal-name"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="Defaults to the name"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="new-entity-type" className="mb-1 block">
                  Legal form
                </Label>
                <Select
                  id="new-entity-type"
                  value={entityType}
                  onChange={(e) => setEntityType(e.target.value)}
                >
                  {ENTITY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Picks the Reporting Style and the chart&apos;s equity rows.
                </p>
              </div>
              <div>
                <Label htmlFor="new-entity-ticker" className="mb-1 block">
                  Ticker
                </Label>
                <TextInput
                  id="new-entity-ticker"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="From the initials"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Unique in the graph; prefixes the entity&apos;s account names.
                </p>
              </div>
            </div>

            {!isFirstEntity && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="new-entity-parent" className="mb-1 block">
                    Held under
                  </Label>
                  <Select
                    id="new-entity-parent"
                    value={parentEntityId}
                    onChange={(e) => setParentEntityId(e.target.value)}
                  >
                    {entities.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                        {e.isParent ? ' (group parent)' : ''}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="new-entity-ownership" className="mb-1 block">
                    Ownership %
                  </Label>
                  <TextInput
                    id="new-entity-ownership"
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={ownershipPct}
                    onChange={(e) => setOwnershipPct(e.target.value)}
                    placeholder="100"
                    color={ownershipInvalid ? 'failure' : undefined}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    The parent&apos;s share. Leave blank when not recorded.
                  </p>
                </div>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter className="justify-end">
          <Button color="gray" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" color="blue" disabled={!canSubmit}>
            {submitting ? 'Creating…' : 'Create Entity'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

export default NewEntityModal
