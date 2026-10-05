'use client'

import { friendlyError } from '@/lib/ledger/errors'
import { formatDate } from '@/lib/ledger/formatters'
import { clients } from '@robosystems/core'
import {
  Alert,
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from 'flowbite-react'
import { type FC, useCallback, useEffect, useState } from 'react'

export interface DeletableDraft {
  id: string
  number: string | null
  postingDate: string
  memo: string | null
  triggeredByEventId: string | null
}

interface DeleteDraftModalProps {
  graphId: string
  draft: DeletableDraft | null
  onClose: () => void
  onDeleted: () => void
}

const RETRACTED = new Set(['voided', 'superseded'])

/**
 * Delete a manual draft. Every manual entry is recorded through an event,
 * and the API refuses to delete an event's only draft while the event is
 * live, so the event is voided first. That order is the safe one: once the
 * event is voided, close no longer posts its draft, so a delete that then
 * fails leaves nothing that reaches the books, and trying again finishes it.
 */
export const DeleteDraftModal: FC<DeleteDraftModalProps> = ({
  graphId,
  draft,
  onClose,
  onDeleted,
}) => {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setError(null)
  }, [draft])

  const handleDelete = useCallback(async () => {
    if (!draft) return
    setDeleting(true)
    setError(null)
    try {
      if (draft.triggeredByEventId) {
        const event = await clients.ledger.getEventBlock(
          graphId,
          draft.triggeredByEventId
        )
        if (event && !RETRACTED.has(event.status)) {
          await clients.ledger.updateEventBlock(graphId, {
            event_id: draft.triggeredByEventId,
            transition_to: 'voided',
          })
        }
      }
      await clients.ledger.deleteJournalEntry(graphId, draft.id)
      onDeleted()
      onClose()
    } catch (err) {
      setError(
        friendlyError(err instanceof Error ? err.message : String(err)).message
      )
    } finally {
      setDeleting(false)
    }
  }, [graphId, draft, onDeleted, onClose])

  return (
    <Modal show={!!draft} onClose={onClose} size="md">
      <ModalHeader>Delete Draft</ModalHeader>
      <ModalBody>
        {draft && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Delete the draft{' '}
              <span className="font-medium text-gray-900 dark:text-white">
                {draft.memo || draft.number || draft.id}
              </span>{' '}
              dated {formatDate(draft.postingDate)}? It has not been posted, so
              nothing in the books changes. This cannot be undone.
            </p>
            {error && <Alert color="failure">{error}</Alert>}
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button color="gray" onClick={onClose} disabled={deleting}>
          Cancel
        </Button>
        <Button color="failure" onClick={handleDelete} disabled={deleting}>
          {deleting ? 'Deleting…' : 'Delete Draft'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
