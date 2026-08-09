'use client'

import { friendlyError } from '@/lib/ledger/errors'
import { clients } from '@robosystems/core'
import {
  Alert,
  Button,
  Checkbox,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Spinner,
  Textarea,
} from 'flowbite-react'
import type { FC } from 'react'
import { useState } from 'react'
import { HiExclamationCircle } from 'react-icons/hi'

interface Props {
  graphId: string
  /** The sender's graph, read off the received report's provenance. */
  sourceGraphId: string
  /** Human-readable sender, when the package carried one. */
  sourceLabel?: string | null
  /** Purging is admin-only; plain blocking is not. */
  isAdmin: boolean
  onClose: () => void
  /** Fired after a successful block so the caller can refresh. */
  onBlocked: () => void
}

/**
 * The recipient's half of the cross-graph share controls: bar a sender from
 * pushing further reports into this graph, and optionally purge what already
 * landed.
 *
 * The two halves carry different authority — stopping a sender is open to any
 * writer, while purging received reports requires the graph admin role — so
 * the purge checkbox is gated separately from the action itself.
 */
const BlockSenderModal: FC<Props> = function ({
  graphId,
  sourceGraphId,
  sourceLabel,
  isAdmin,
  onClose,
  onBlocked,
}) {
  const [reason, setReason] = useState('')
  const [purge, setPurge] = useState(false)
  const [isBlocking, setIsBlocking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  const handleBlock = async () => {
    try {
      setIsBlocking(true)
      setError(null)
      setResult(null)
      const res = await clients.ledger.blockSourceGraph(
        graphId,
        sourceGraphId,
        {
          ...(reason.trim() ? { reason: reason.trim() } : {}),
          purge,
        }
      )

      const purged = res.purged_report_count ?? 0
      const parts = [
        res.already_blocked
          ? 'That sender was already blocked.'
          : 'Sender blocked — they can no longer share reports into this graph.',
      ]
      if (purged > 0) {
        parts.push(
          `Removed ${purged} report${purged !== 1 ? 's' : ''} already shared in.`
        )
      } else if (purge) {
        parts.push('There were no previously shared reports to remove.')
      }
      setResult(parts.join(' '))
      onBlocked()
    } catch (err) {
      console.error('Block sender failed:', err)
      const message =
        err instanceof Error ? err.message : 'Failed to block this sender.'
      setError(friendlyError(message).message)
    } finally {
      setIsBlocking(false)
    }
  }

  return (
    <Modal show onClose={onClose} size="md">
      <ModalHeader>Block sender</ModalHeader>
      <ModalBody>
        {error && (
          <Alert color="failure" icon={HiExclamationCircle} className="mb-4">
            {error}
          </Alert>
        )}
        {result && (
          <Alert color="success" className="mb-4">
            {result}
          </Alert>
        )}

        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Stop{' '}
            <span className="font-medium text-gray-900 dark:text-white">
              {sourceLabel || sourceGraphId}
            </span>{' '}
            from sharing further reports into this graph. Your reason is a note
            for your own records and is never disclosed to the sender.
          </p>

          <div className="space-y-2">
            <Label htmlFor="block-reason">Reason (optional)</Label>
            <Textarea
              id="block-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why this sender is being blocked"
              disabled={isBlocking || Boolean(result)}
            />
          </div>

          <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <div className="flex items-start gap-2">
              <Checkbox
                id="block-purge"
                checked={purge}
                onChange={(e) => setPurge(e.target.checked)}
                disabled={!isAdmin || isBlocking || Boolean(result)}
                className="mt-0.5"
              />
              <div>
                <Label htmlFor="block-purge" className="font-medium">
                  Also delete reports already shared in
                </Label>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {isAdmin
                    ? 'Deletes every report this sender already shared to you, along with its facts. Reports you authored are never touched, and this cannot be undone — unblocking later does not restore them.'
                    : 'Requires the graph admin role. You can still block the sender to stop further shares.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        {result ? (
          <Button color="gray" onClick={onClose}>
            Close
          </Button>
        ) : (
          <>
            <Button color="failure" onClick={handleBlock} disabled={isBlocking}>
              {isBlocking ? <Spinner size="sm" className="mr-2" /> : null}
              {purge ? 'Block and delete' : 'Block sender'}
            </Button>
            <Button color="gray" onClick={onClose} disabled={isBlocking}>
              Cancel
            </Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  )
}

export default BlockSenderModal
