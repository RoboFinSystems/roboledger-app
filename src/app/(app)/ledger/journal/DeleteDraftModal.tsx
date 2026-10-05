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

const isSoleDraftOfLiveEvent = (err: unknown): boolean =>
  err instanceof Error &&
  err.message.includes('is the only ledger entry of event')

/**
 * Delete a manual draft. Every manual entry is recorded through an event.
 * The API deletes one of an event's several drafts as asked, but refuses
 * the only draft of a live event; that one is deleted by voiding its event
 * first, which nothing else hangs off. The order is the safe one: close no
 * longer posts a voided event's draft, so a delete that then fails leaves
 * nothing that reaches the books, and trying again finishes it.
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
      try {
        await clients.ledger.deleteJournalEntry(graphId, draft.id)
      } catch (err) {
        if (!draft.triggeredByEventId || !isSoleDraftOfLiveEvent(err)) throw err
        await clients.ledger.updateEventBlock(graphId, {
          event_id: draft.triggeredByEventId,
          transition_to: 'voided',
        })
        await clients.ledger.deleteJournalEntry(graphId, draft.id)
      }
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
