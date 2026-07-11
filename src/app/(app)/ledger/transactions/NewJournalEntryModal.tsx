'use client'

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
import { type FC, useCallback, useEffect, useState } from 'react'
import { HiPlus, HiTrash } from 'react-icons/hi'

interface AccountOption {
  id: string
  code: string | null
  name: string
}

interface LineItemDraft {
  // Stable per-row id so React reconciles correctly when a middle row
  // is removed. Index keys would swap DR/CR amounts between rows on
  // delete; the `_id` decouples row identity from list position.
  _id: string
  elementId: string
  debit: string
  credit: string
  description: string
}

interface NewJournalEntryModalProps {
  graphId: string
  open: boolean
  onClose: () => void
  onCreated?: () => void
}

const newLine = (): LineItemDraft => ({
  _id:
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `line_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  elementId: '',
  debit: '',
  credit: '',
  description: '',
})

const parseMoney = (raw: string): number => {
  const n = Number(raw)
  return Number.isFinite(n) ? Math.round(n * 100) : 0
}

// Local-timezone YYYY-MM-DD. `toISOString().slice(0, 10)` returns UTC,
// which rolls forward to tomorrow for evening users in US zones.
const todayLocal = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const formatBalance = (cents: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    cents / 100
  )

// §3.10 — Manual journal entry creation modal with running DR/CR balance check.
export const NewJournalEntryModal: FC<NewJournalEntryModalProps> = ({
  graphId,
  open,
  onClose,
  onCreated,
}) => {
  const [postingDate, setPostingDate] = useState<string>(() => todayLocal())
  const [memo, setMemo] = useState('')
  const [entryType, setEntryType] = useState<
    'standard' | 'adjusting' | 'closing' | 'reversing'
  >('standard')
  const [status, setStatus] = useState<'draft' | 'posted'>('draft')
  const [lineItems, setLineItems] = useState<LineItemDraft[]>([
    newLine(),
    newLine(),
  ])
  const [accounts, setAccounts] = useState<AccountOption[]>([])
  const [accountsLoading, setAccountsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Load accounts when the modal opens.
  useEffect(() => {
    if (!open || !graphId) return
    let cancelled = false
    setAccountsLoading(true)
    void (async () => {
      try {
        const list = await clients.ledger.listAccounts(graphId, {
          isActive: true,
          limit: 500,
        })
        if (cancelled) return
        const rows = (list?.accounts ?? []).map((a) => ({
          id: a.id,
          code: a.code ?? null,
          name: a.name ?? a.id,
        }))
        // The CoA cap above is generous for the typical tenant. If
        // the entity has >500 accounts we silently truncate — log so
        // operators notice. A typed search param on `listAccounts`
        // would let the picker narrow without a full re-fetch; tracked
        // as a follow-up.
        if (rows.length === 500) {
          console.warn(
            'NewJournalEntryModal: account list hit the 500-row cap — picker may not show every account.'
          )
        }
        setAccounts(rows)
      } catch (err) {
        console.error('Failed to load accounts for JE modal:', err)
      } finally {
        if (!cancelled) setAccountsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, graphId])

  // Reset state every time the modal opens.
  useEffect(() => {
    if (!open) return
    setMemo('')
    setEntryType('standard')
    setStatus('draft')
    setLineItems([newLine(), newLine()])
    setSubmitError(null)
    setPostingDate(todayLocal())
  }, [open])

  const updateLine = (idx: number, patch: Partial<LineItemDraft>) => {
    setLineItems((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, ...patch } : row))
    )
  }

  const addLine = () => setLineItems((prev) => [...prev, newLine()])

  const removeLine = (idx: number) =>
    setLineItems((prev) =>
      prev.length <= 2 ? prev : prev.filter((_, i) => i !== idx)
    )

  // Running totals in cents.
  const totalDebit = lineItems.reduce((sum, l) => sum + parseMoney(l.debit), 0)
  const totalCredit = lineItems.reduce(
    (sum, l) => sum + parseMoney(l.credit),
    0
  )
  const diff = totalDebit - totalCredit

  const linesValid = lineItems.every((l) => {
    if (!l.elementId) return false
    const d = parseMoney(l.debit)
    const c = parseMoney(l.credit)
    // Exactly one of debit / credit must be > 0
    return (d > 0 && c === 0) || (c > 0 && d === 0)
  })
  const canSubmit =
    !submitting &&
    !!graphId &&
    !!postingDate &&
    memo.trim().length > 0 &&
    linesValid &&
    diff === 0

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      await clients.ledger.createJournalEntry(graphId, {
        postingDate,
        memo: memo.trim(),
        type: entryType,
        status,
        source: 'manual',
        lineItems: lineItems.map((l) => ({
          elementId: l.elementId,
          debitAmount: parseMoney(l.debit) || undefined,
          creditAmount: parseMoney(l.credit) || undefined,
          description: l.description.trim() || undefined,
        })),
      })
      onCreated?.()
      onClose()
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to create journal entry.'
      setSubmitError(msg)
    } finally {
      setSubmitting(false)
    }
  }, [
    canSubmit,
    graphId,
    postingDate,
    memo,
    entryType,
    status,
    lineItems,
    onClose,
    onCreated,
  ])

  return (
    <Modal show={open} onClose={onClose} size="4xl">
      <ModalHeader>New Journal Entry</ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="je-posting-date">Posting Date</Label>
              <TextInput
                id="je-posting-date"
                type="date"
                value={postingDate}
                onChange={(e) => setPostingDate(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div>
              <Label htmlFor="je-type">Entry Type</Label>
              <Select
                id="je-type"
                value={entryType}
                onChange={(e) =>
                  setEntryType(
                    e.target.value as
                      | 'standard'
                      | 'adjusting'
                      | 'closing'
                      | 'reversing'
                  )
                }
                disabled={submitting}
              >
                <option value="standard">Standard</option>
                <option value="adjusting">Adjusting</option>
                <option value="closing">Closing</option>
                <option value="reversing">Reversing</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="je-status">Status on Submit</Label>
              <Select
                id="je-status"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as 'draft' | 'posted')
                }
                disabled={submitting}
              >
                <option value="draft">Draft</option>
                <option value="posted">Posted</option>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="je-memo">Memo</Label>
            <TextInput
              id="je-memo"
              placeholder="Describe this entry (visible on the transaction)"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Line Items
              </h4>
              <Button
                size="xs"
                color="light"
                onClick={addLine}
                disabled={submitting}
              >
                <HiPlus className="mr-1 h-3 w-3" />
                Add line
              </Button>
            </div>

            {accountsLoading && (
              <p className="mb-2 text-xs text-gray-500">Loading accounts…</p>
            )}

            <div className="space-y-2">
              {lineItems.map((line, idx) => (
                <div
                  key={line._id}
                  className="grid grid-cols-12 items-end gap-2 rounded border border-gray-200 p-2 dark:border-gray-700"
                >
                  <div className="col-span-12 sm:col-span-4">
                    <Label htmlFor={`line-account-${idx}`} className="text-xs">
                      Account
                    </Label>
                    <Select
                      id={`line-account-${idx}`}
                      value={line.elementId}
                      onChange={(e) =>
                        updateLine(idx, { elementId: e.target.value })
                      }
                      disabled={submitting || accountsLoading}
                    >
                      <option value="">Select account…</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.code ? `${a.code} — ${a.name}` : a.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="col-span-6 sm:col-span-2">
                    <Label htmlFor={`line-debit-${idx}`} className="text-xs">
                      Debit
                    </Label>
                    <TextInput
                      id={`line-debit-${idx}`}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={line.debit}
                      onChange={(e) =>
                        updateLine(idx, { debit: e.target.value })
                      }
                      disabled={submitting}
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-2">
                    <Label htmlFor={`line-credit-${idx}`} className="text-xs">
                      Credit
                    </Label>
                    <TextInput
                      id={`line-credit-${idx}`}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={line.credit}
                      onChange={(e) =>
                        updateLine(idx, { credit: e.target.value })
                      }
                      disabled={submitting}
                    />
                  </div>
                  <div className="col-span-10 sm:col-span-3">
                    <Label
                      htmlFor={`line-description-${idx}`}
                      className="text-xs"
                    >
                      Description (optional)
                    </Label>
                    <TextInput
                      id={`line-description-${idx}`}
                      value={line.description}
                      onChange={(e) =>
                        updateLine(idx, { description: e.target.value })
                      }
                      disabled={submitting}
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <Button
                      size="xs"
                      color="failure"
                      onClick={() => removeLine(idx)}
                      disabled={submitting || lineItems.length <= 2}
                      title="Remove line"
                    >
                      <HiTrash className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Balance check */}
            <div className="mt-3 grid grid-cols-3 gap-2 rounded-md border border-gray-200 p-3 dark:border-gray-700">
              <div>
                <p className="text-xs text-gray-500 uppercase">Total Debit</p>
                <p className="font-mono text-sm">{formatBalance(totalDebit)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Total Credit</p>
                <p className="font-mono text-sm">
                  {formatBalance(totalCredit)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Balance</p>
                <p
                  className={`font-mono text-sm font-semibold ${
                    diff === 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {formatBalance(diff)}
                </p>
              </div>
            </div>
          </div>

          {submitError && <Alert color="failure">{submitError}</Alert>}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button color="gray" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button color="primary" onClick={handleSubmit} disabled={!canSubmit}>
          {submitting
            ? 'Submitting…'
            : status === 'posted'
              ? 'Post Entry'
              : 'Save Draft'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
