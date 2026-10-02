'use client'

import { extractDetail } from '@/lib/ledger/errors'
import type { LedgerReconciliation } from '@robosystems/client/clients'
import { clients } from '@robosystems/core'
import {
  Button,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Select,
  Spinner,
  TextInput,
} from 'flowbite-react'
import { type FC, useEffect, useState } from 'react'

/** The API's own words for a refusal, or a fallback when there are none. */
const describeError = (err: unknown, fallback: string): string =>
  err instanceof Error ? extractDetail(err.message) : fallback

interface AccountOption {
  id: string
  code: string | null
  name: string
}

interface RecordStatementModalProps {
  graphId: string
  open: boolean
  onClose: () => void
  onRecorded: (reconciliation: LedgerReconciliation) => void
}

/**
 * Record a statement's ending balance for one account. The account is then
 * reconciled to it for the period the statement ends in.
 */
const RecordStatementModal: FC<RecordStatementModalProps> = ({
  graphId,
  open,
  onClose,
  onRecorded,
}) => {
  const [accounts, setAccounts] = useState<AccountOption[]>([])
  const [elementId, setElementId] = useState('')
  const [asOf, setAsOf] = useState('')
  const [balance, setBalance] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load the chart when the modal opens. The API refuses an account that is
  // not on the balance sheet, so the list is not filtered here.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setError(null)
    void (async () => {
      try {
        const list = await clients.ledger.listAccounts(graphId, {
          isActive: true,
          limit: 500,
        })
        if (cancelled) return
        setAccounts(
          (list?.accounts ?? []).map((a) => ({
            id: a.id,
            code: a.code ?? null,
            name: a.name ?? a.id,
          }))
        )
      } catch (err) {
        if (!cancelled) setError(describeError(err, 'Accounts did not load.'))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [graphId, open])

  const amount = Number(balance)
  const ready =
    elementId !== '' && asOf !== '' && balance !== '' && !Number.isNaN(amount)

  const handleSubmit = async () => {
    if (!ready) return
    try {
      setSubmitting(true)
      setError(null)
      const reconciliation = await clients.ledger.recordStatementBalance(
        graphId,
        { elementId, asOf, balance: amount, note: note.trim() || null }
      )
      setBalance('')
      setNote('')
      onRecorded(reconciliation)
    } catch (err) {
      setError(describeError(err, 'The statement balance was not recorded.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal show={open} onClose={onClose} size="lg">
      <ModalHeader>Record a statement balance</ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <div>
            <Label htmlFor="statement-account">Account</Label>
            <Select
              id="statement-account"
              value={elementId}
              onChange={(e) => setElementId(e.target.value)}
            >
              <option value="">Choose an account</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code ? `${a.code} · ${a.name}` : a.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="statement-as-of">Statement ending date</Label>
            <TextInput
              id="statement-as-of"
              type="date"
              value={asOf}
              onChange={(e) => setAsOf(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="statement-balance">Ending balance</Label>
            <TextInput
              id="statement-balance"
              type="number"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Enter it as the statement shows it. An amount owed on a loan or a
              card is a positive number.
            </p>
          </div>
          <div>
            <Label htmlFor="statement-note">Note (optional)</Label>
            <TextInput
              id="statement-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button
          color="primary"
          disabled={!ready || submitting}
          onClick={handleSubmit}
        >
          {submitting && <Spinner size="sm" className="mr-2 text-white" />}
          Record balance
        </Button>
        <Button color="light" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default RecordStatementModal
