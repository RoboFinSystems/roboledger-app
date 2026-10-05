'use client'

import { friendlyError } from '@/lib/ledger/errors'
import { formatDate, formatDollars } from '@/lib/ledger/formatters'
import type { CreateEventBlockRequest } from '@robosystems/client/types'
import { clients } from '@robosystems/core'
import {
  Alert,
  Button,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextInput,
} from 'flowbite-react'
import { type FC, useCallback, useEffect, useState } from 'react'
import { flipLines, type FlippableLine } from './entryActions'

export interface ReversibleEntry {
  id: string
  number: string | null
  postingDate: string
  memo: string | null
  lineItems: (FlippableLine & { id: string })[]
}

interface ReverseEntryModalProps {
  graphId: string
  entry: ReversibleEntry | null
  onClose: () => void
  onReversed: () => void
}

// Local-timezone YYYY-MM-DD; `toISOString()` is UTC and rolls forward in
// the evening for US zones.
const todayLocal = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** The request `reverseJournalEntry` sends, so the preview checks the same one. */
const reversalRequest = (
  entryId: string,
  postingDate: string
): CreateEventBlockRequest => ({
  event_type: 'journal_entry_reversed',
  event_category: 'adjustment',
  source: 'manual',
  occurred_at: `${postingDate}T00:00:00Z`,
  apply_handlers: true,
  metadata: { entry_id: entryId, posting_date: postingDate },
})

/**
 * A preview refusal in this dialog's terms. The shared closed-period copy
 * points at an event's posting_date; here the date is the field above.
 */
const previewReason = (raw: string): string =>
  raw.toLowerCase().includes('closed period')
    ? 'That date is in a closed month. Pick a reversal date in an open one.'
    : friendlyError(raw).message

type PreviewState =
  { kind: 'loading' } | { kind: 'ok' } | { kind: 'refused'; reasons: string[] }

/**
 * Reverse a posted entry: the API posts an entry with every line's sides
 * swapped and marks the original reversed. The lines shown are the
 * original's, flipped here; the API's preview decides whether it would
 * post, and nothing is sent until it says so.
 */
export const ReverseEntryModal: FC<ReverseEntryModalProps> = ({
  graphId,
  entry,
  onClose,
  onReversed,
}) => {
  const [postingDate, setPostingDate] = useState(todayLocal)
  const [memo, setMemo] = useState('')
  const [reason, setReason] = useState('')
  const [preview, setPreview] = useState<PreviewState>({ kind: 'loading' })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!entry) return
    setPostingDate(todayLocal())
    setMemo('')
    setReason('')
    setSubmitError(null)
  }, [entry])

  useEffect(() => {
    if (!entry || !postingDate) return
    let cancelled = false
    setPreview({ kind: 'loading' })
    void (async () => {
      try {
        const result = await clients.ledger.previewEventBlock(
          graphId,
          reversalRequest(entry.id, postingDate)
        )
        if (cancelled) return
        setPreview(
          result.would_succeed
            ? { kind: 'ok' }
            : {
                kind: 'refused',
                reasons: (result.validation_errors ?? []).map(previewReason),
              }
        )
      } catch (err) {
        if (cancelled) return
        setPreview({
          kind: 'refused',
          reasons: [
            friendlyError(err instanceof Error ? err.message : String(err))
              .message,
          ],
        })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [graphId, entry, postingDate])

  const handleReverse = useCallback(async () => {
    if (!entry || preview.kind !== 'ok') return
    setSubmitting(true)
    setSubmitError(null)
    try {
      await clients.ledger.reverseJournalEntry(graphId, entry.id, {
        postingDate,
        memo: memo.trim() || null,
        reason: reason.trim() || null,
      })
      onReversed()
      onClose()
    } catch (err) {
      setSubmitError(
        friendlyError(err instanceof Error ? err.message : String(err)).message
      )
    } finally {
      setSubmitting(false)
    }
  }, [graphId, entry, preview, postingDate, memo, reason, onReversed, onClose])

  const flipped = entry ? flipLines(entry.lineItems) : []

  return (
    <Modal show={!!entry} onClose={onClose} size="3xl">
      <ModalHeader>Reverse Entry</ModalHeader>
      <ModalBody>
        {entry && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Posts an entry that swaps every debit and credit of{' '}
              <span className="font-medium text-gray-900 dark:text-white">
                {entry.memo || entry.number || entry.id}
              </span>{' '}
              ({formatDate(entry.postingDate)}), and marks the original
              reversed. An entry is reversed at most once.
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="reverse-date">Reversal date</Label>
                <TextInput
                  id="reverse-date"
                  type="date"
                  value={postingDate}
                  onChange={(e) => setPostingDate(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div>
                <Label htmlFor="reverse-memo">Memo (optional)</Label>
                <TextInput
                  id="reverse-memo"
                  placeholder={`Reversal of journal entry ${entry.id}`}
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="reverse-reason">Reason (optional)</Label>
              <TextInput
                id="reverse-reason"
                placeholder="Kept on the record with the reversal"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={submitting}
              />
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase dark:border-gray-600 dark:text-gray-400">
                  <th className="py-2">Account</th>
                  <th className="py-2 text-right">Debit</th>
                  <th className="py-2 text-right">Credit</th>
                </tr>
              </thead>
              <tbody>
                {flipped.map((li) => (
                  <tr
                    key={li.id}
                    className="border-b border-gray-100 dark:border-gray-700"
                  >
                    <td className="py-2 text-gray-900 dark:text-white">
                      {li.accountName || li.accountCode || li.accountId}
                    </td>
                    <td className="py-2 text-right font-mono">
                      {li.debitAmount ? formatDollars(li.debitAmount) : '-'}
                    </td>
                    <td className="py-2 text-right font-mono">
                      {li.creditAmount ? formatDollars(li.creditAmount) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {preview.kind === 'loading' && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Checking the reversal…
              </p>
            )}
            {preview.kind === 'refused' && (
              <Alert color="warning">
                <span className="font-medium">This cannot be reversed:</span>
                <ul className="mt-1 list-disc pl-5">
                  {preview.reasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </Alert>
            )}
            {submitError && <Alert color="failure">{submitError}</Alert>}
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button color="gray" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          color="failure"
          onClick={handleReverse}
          disabled={submitting || preview.kind !== 'ok'}
        >
          {submitting ? 'Reversing…' : 'Post Reversal'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
