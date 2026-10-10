'use client'

import {
  DOCUMENT_FILE_ACCEPT,
  isDocumentFileType,
  uploadDocumentFile,
} from '@/lib/ledger/documents'
import { extractDetail } from '@/lib/ledger/errors'
import type { LedgerReconciliation } from '@robosystems/client/clients'
import { clients } from '@robosystems/core'
import {
  Button,
  FileInput,
  HelperText,
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

/** The API's own cap on a stored file. */
const MAX_FILE_BYTES = 25 * 1024 * 1024

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
  /** A subsidiary's id, or null for the group parent: whose chart the accounts come from. */
  entityId?: string | null
  open: boolean
  onClose: () => void
  onRecorded: (reconciliation: LedgerReconciliation) => void
}

/**
 * Record a statement's ending balance for one account, with the statement
 * itself attached. The account is then reconciled to it for the period the
 * statement ends in, and the reconciliation keeps the file as its evidence.
 */
const RecordStatementModal: FC<RecordStatementModalProps> = ({
  graphId,
  entityId = null,
  open,
  onClose,
  onRecorded,
}) => {
  const [accounts, setAccounts] = useState<AccountOption[]>([])
  const [elementId, setElementId] = useState('')
  const [asOf, setAsOf] = useState('')
  const [balance, setBalance] = useState('')
  const [note, setNote] = useState('')
  const [file, setFile] = useState<File | null>(null)
  // Kept so a retry after a refused balance does not upload the file again.
  const [documentId, setDocumentId] = useState<string | null>(null)
  const [stage, setStage] = useState<'uploading' | 'recording' | null>(null)
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
          entityId,
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
  }, [graphId, entityId, open])

  const amount = Number(balance)
  const fileProblem = !file
    ? null
    : !isDocumentFileType(file.type)
      ? 'Attach a PDF, PNG or JPEG.'
      : file.size > MAX_FILE_BYTES
        ? 'The file is larger than 25 MB.'
        : null
  const ready =
    elementId !== '' &&
    asOf !== '' &&
    balance !== '' &&
    !Number.isNaN(amount) &&
    fileProblem === null

  const handleFile = (next: File | null) => {
    setFile(next)
    setDocumentId(null)
  }

  const accountName = (id: string) => {
    const account = accounts.find((a) => a.id === id)
    return account ? account.name : 'Account'
  }

  const handleSubmit = async () => {
    if (!ready) return
    // Read in the catch, where `stage` would be the value from this render.
    let phase: 'uploading' | 'recording' = 'recording'
    try {
      setSubmitting(true)
      setError(null)
      let statementId = documentId
      if (file && !statementId) {
        phase = 'uploading'
        setStage('uploading')
        statementId = await uploadDocumentFile(graphId, file, {
          title: `${accountName(elementId)} statement ending ${asOf}`,
          tags: ['bank-statement'],
        })
        setDocumentId(statementId)
      }
      phase = 'recording'
      setStage('recording')
      const reconciliation = await clients.ledger.recordStatementBalance(
        graphId,
        {
          elementId,
          entityId,
          asOf,
          balance: amount,
          documentId: statementId,
          note: note.trim() || null,
        }
      )
      setBalance('')
      setNote('')
      handleFile(null)
      onRecorded(reconciliation)
    } catch (err) {
      setError(
        describeError(
          err,
          phase === 'uploading'
            ? 'The statement did not upload.'
            : 'The statement balance was not recorded.'
        )
      )
    } finally {
      setStage(null)
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
            <Label htmlFor="statement-file">Statement (optional)</Label>
            <FileInput
              id="statement-file"
              accept={DOCUMENT_FILE_ACCEPT}
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
            <HelperText>
              {fileProblem ??
                (documentId
                  ? 'Uploaded. It will be kept with this reconciliation.'
                  : 'The PDF or a photo of it, up to 25 MB. It is kept as the evidence for the balance.')}
            </HelperText>
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
          {stage === 'uploading' ? 'Uploading statement…' : 'Record balance'}
        </Button>
        <Button color="light" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default RecordStatementModal
