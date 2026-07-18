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

interface AccountOption {
  id: string
  code: string | null
  name: string
}

interface NewScheduleModalProps {
  graphId: string
  open: boolean
  onClose: () => void
  onCreated?: (structureId: string) => void
}

type EntryType = 'standard' | 'adjusting' | 'closing' | 'reversing'

const parseMoney = (raw: string): number => {
  const n = Number(raw)
  return Number.isFinite(n) ? Math.round(n * 100) : 0
}

// Local-timezone first day of the current month — schedules are monthly,
// so the natural default start is the month boundary, not today.
const firstOfMonthLocal = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

// Inclusive calendar-month count between two YYYY-MM-DD dates. Mirrors the
// server's `_generate_monthly_periods`, which iterates whole months from
// the start's month through the end's month regardless of day-of-month.
const monthsBetween = (start: string, end: string): number => {
  const [sy, sm] = start.split('-').map(Number)
  const [ey, em] = end.split('-').map(Number)
  if (!sy || !sm || !ey || !em) return 0
  return (ey - sy) * 12 + (em - sm) + 1
}

// Last day of the month `monthsAhead - 1` months after the start month, so
// a 12-month life starting 2026-01-15 ends 2026-12-31.
const lifeEndDate = (start: string, monthsAhead: number): string => {
  const [sy, sm] = start.split('-').map(Number)
  if (!sy || !sm || monthsAhead <= 0) return ''
  const total = sm - 1 + monthsAhead - 1
  const year = sy + Math.floor(total / 12)
  const month = (total % 12) + 1
  const lastDay = new Date(year, month, 0).getDate()
  return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
}

const formatCents = (cents: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    cents / 100
  )

/**
 * Typed schedule creation form — the first human authoring surface for
 * schedule Information Blocks (previously reachable only via MCP/REST/SDK).
 * Posts to `create-information-block` through the `createSchedule` SDK
 * wrapper; the server materializes the forward FactSet + obligation
 * register, and the caller lands on the schedule's BlockView as the
 * post-commit preview.
 */
export const NewScheduleModal: FC<NewScheduleModalProps> = ({
  graphId,
  open,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState('')
  const [debitElementId, setDebitElementId] = useState('')
  const [creditElementId, setCreditElementId] = useState('')
  const [periodStart, setPeriodStart] = useState<string>(() =>
    firstOfMonthLocal()
  )
  const [periodEnd, setPeriodEnd] = useState('')
  const [monthlyAmount, setMonthlyAmount] = useState('')
  const [entryType, setEntryType] = useState<EntryType>('closing')
  const [memoTemplate, setMemoTemplate] = useState('')
  const [showAssetDetails, setShowAssetDetails] = useState(false)
  const [originalAmount, setOriginalAmount] = useState('')
  const [residualValue, setResidualValue] = useState('')
  const [usefulLifeMonths, setUsefulLifeMonths] = useState('')
  const [assetElementId, setAssetElementId] = useState('')
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
        if (rows.length === 500) {
          console.warn(
            'NewScheduleModal: account list hit the 500-row cap — picker may not show every account.'
          )
        }
        setAccounts(rows)
      } catch (err) {
        console.error('Failed to load accounts for schedule modal:', err)
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
    setName('')
    setDebitElementId('')
    setCreditElementId('')
    setPeriodStart(firstOfMonthLocal())
    setPeriodEnd('')
    setMonthlyAmount('')
    setEntryType('closing')
    setMemoTemplate('')
    setShowAssetDetails(false)
    setOriginalAmount('')
    setResidualValue('')
    setUsefulLifeMonths('')
    setAssetElementId('')
    setSubmitError(null)
  }, [open])

  // When both the write-off total and useful life are known, pre-fill the
  // monthly amount and end date from straight-line math. Both stay
  // editable — this only fires from the two driving fields' onChange.
  const applyStraightLineMath = (nextOriginal: string, nextLife: string) => {
    const originalCents = parseMoney(nextOriginal)
    const life = Number(nextLife)
    if (originalCents > 0 && Number.isInteger(life) && life > 0) {
      setMonthlyAmount((originalCents / 100 / life).toFixed(2))
      setPeriodEnd(lifeEndDate(periodStart, life))
    }
  }

  const monthlyCents = parseMoney(monthlyAmount)
  const originalCents = parseMoney(originalAmount)
  const months =
    periodStart && periodEnd && periodEnd >= periodStart
      ? monthsBetween(periodStart, periodEnd)
      : 0

  // Mirror the server's straight-line generator: every period fires the
  // monthly amount, except the final period absorbs rounding so the sum
  // equals `original_amount` exactly (when provided).
  const finalMonthCents =
    originalCents > 0 && months > 1
      ? originalCents - monthlyCents * (months - 1)
      : monthlyCents
  const totalCents = originalCents > 0 ? originalCents : monthlyCents * months
  const overDepreciated = originalCents > 0 && finalMonthCents < 0

  const accountLabel = (id: string): string => {
    const a = accounts.find((acc) => acc.id === id)
    if (!a) return id
    return a.code ? `${a.code} — ${a.name}` : a.name
  }

  const canSubmit =
    !submitting &&
    !!graphId &&
    name.trim().length > 0 &&
    !!debitElementId &&
    !!creditElementId &&
    debitElementId !== creditElementId &&
    months > 0 &&
    monthlyCents > 0 &&
    !overDepreciated

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const residualCents = parseMoney(residualValue)
      const lifeMonths = Number(usefulLifeMonths) || 0
      const hasMetadata =
        originalCents > 0 ||
        residualCents > 0 ||
        lifeMonths > 0 ||
        !!assetElementId
      const elementIds = Array.from(
        new Set([
          debitElementId,
          creditElementId,
          ...(assetElementId ? [assetElementId] : []),
        ])
      )
      const created = await clients.ledger.createSchedule(graphId, {
        name: name.trim(),
        elementIds,
        periodStart,
        periodEnd,
        monthlyAmount: monthlyCents,
        entryTemplate: {
          debitElementId,
          creditElementId,
          entryType,
          memoTemplate: memoTemplate.trim() || undefined,
        },
        ...(hasMetadata
          ? {
              scheduleMetadata: {
                method: 'straight_line',
                originalAmount: originalCents || undefined,
                residualValue: residualCents || undefined,
                usefulLifeMonths: lifeMonths || undefined,
                assetElementId: assetElementId || undefined,
              },
            }
          : {}),
      })
      onCreated?.(created.structureId)
      onClose()
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to create schedule.'
      setSubmitError(msg)
    } finally {
      setSubmitting(false)
    }
  }, [
    canSubmit,
    graphId,
    name,
    debitElementId,
    creditElementId,
    periodStart,
    periodEnd,
    monthlyCents,
    originalCents,
    entryType,
    memoTemplate,
    residualValue,
    usefulLifeMonths,
    assetElementId,
    onClose,
    onCreated,
  ])

  return (
    <Modal show={open} onClose={onClose} size="2xl">
      <ModalHeader>New Schedule</ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <div>
            <Label htmlFor="sched-name">Name</Label>
            <TextInput
              id="sched-name"
              placeholder="e.g. Prepaid Insurance Amortization"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="sched-debit">Debit account</Label>
              <Select
                id="sched-debit"
                value={debitElementId}
                onChange={(e) => setDebitElementId(e.target.value)}
                disabled={submitting || accountsLoading}
              >
                <option value="">Select account…</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code ? `${a.code} — ${a.name}` : a.name}
                  </option>
                ))}
              </Select>
              <p className="mt-1 text-xs text-gray-500">
                Expense side of each period&apos;s entry
              </p>
            </div>
            <div>
              <Label htmlFor="sched-credit">Credit account</Label>
              <Select
                id="sched-credit"
                value={creditElementId}
                onChange={(e) => setCreditElementId(e.target.value)}
                disabled={submitting || accountsLoading}
              >
                <option value="">Select account…</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code ? `${a.code} — ${a.name}` : a.name}
                  </option>
                ))}
              </Select>
              <p className="mt-1 text-xs text-gray-500">
                Prepaid asset, accumulated depreciation, or accrual liability
              </p>
            </div>
          </div>
          {accountsLoading && (
            <p className="text-xs text-gray-500">Loading accounts…</p>
          )}
          {debitElementId &&
            creditElementId &&
            debitElementId === creditElementId && (
              <Alert color="warning">
                Debit and credit accounts must differ.
              </Alert>
            )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="sched-start">First period</Label>
              <TextInput
                id="sched-start"
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div>
              <Label htmlFor="sched-end">Last period</Label>
              <TextInput
                id="sched-end"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div>
              <Label htmlFor="sched-monthly">Monthly amount ($)</Label>
              <TextInput
                id="sched-monthly"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="sched-entry-type">Entry type</Label>
              <Select
                id="sched-entry-type"
                value={entryType}
                onChange={(e) => setEntryType(e.target.value as EntryType)}
                disabled={submitting}
              >
                <option value="closing">Closing</option>
                <option value="adjusting">Adjusting</option>
                <option value="standard">Standard</option>
                <option value="reversing">Reversing</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="sched-memo">Memo template (optional)</Label>
              <TextInput
                id="sched-memo"
                placeholder="{structure_name} — monthly entry"
                value={memoTemplate}
                onChange={(e) => setMemoTemplate(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          {/* Asset / depreciation details — optional straight-line helper */}
          <div className="rounded-md border border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setShowAssetDetails((v) => !v)}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              <span>Asset &amp; depreciation details (optional)</span>
              <span className="text-xs text-gray-400">
                {showAssetDetails ? 'Hide' : 'Show'}
              </span>
            </button>
            {showAssetDetails && (
              <div className="space-y-4 border-t border-gray-200 p-3 dark:border-gray-700">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="sched-original">
                      Total to write off ($)
                    </Label>
                    <TextInput
                      id="sched-original"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={originalAmount}
                      onChange={(e) => {
                        setOriginalAmount(e.target.value)
                        applyStraightLineMath(e.target.value, usefulLifeMonths)
                      }}
                      disabled={submitting}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Depreciable base — written off in full over the life
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="sched-life">Useful life (months)</Label>
                    <TextInput
                      id="sched-life"
                      type="number"
                      step="1"
                      placeholder="e.g. 60"
                      value={usefulLifeMonths}
                      onChange={(e) => {
                        setUsefulLifeMonths(e.target.value)
                        applyStraightLineMath(originalAmount, e.target.value)
                      }}
                      disabled={submitting}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Pre-fills monthly amount and last period
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="sched-residual">Salvage value ($)</Label>
                    <TextInput
                      id="sched-residual"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={residualValue}
                      onChange={(e) => setResidualValue(e.target.value)}
                      disabled={submitting}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Informational — not deducted from the write-off
                    </p>
                  </div>
                </div>
                <div>
                  <Label htmlFor="sched-asset">Asset account (optional)</Label>
                  <Select
                    id="sched-asset"
                    value={assetElementId}
                    onChange={(e) => setAssetElementId(e.target.value)}
                    disabled={submitting || accountsLoading}
                  >
                    <option value="">None</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code ? `${a.code} — ${a.name}` : a.name}
                      </option>
                    ))}
                  </Select>
                  <p className="mt-1 text-xs text-gray-500">
                    Balance-sheet asset tracked for net book value
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Derived preview — mirrors the server's straight-line generator */}
          {months > 0 && monthlyCents > 0 && (
            <div className="rounded-md border border-gray-200 p-3 dark:border-gray-700">
              <p className="text-xs text-gray-500 uppercase">Preview</p>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">
                {months} monthly {months === 1 ? 'entry' : 'entries'} of{' '}
                <span className="font-mono">{formatCents(monthlyCents)}</span>
                {originalCents > 0 && finalMonthCents !== monthlyCents && (
                  <>
                    {' '}
                    (final month{' '}
                    <span className="font-mono">
                      {formatCents(finalMonthCents)}
                    </span>
                    )
                  </>
                )}{' '}
                — total{' '}
                <span className="font-mono font-semibold">
                  {formatCents(totalCents)}
                </span>
              </p>
              {debitElementId && creditElementId && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Dr {accountLabel(debitElementId)} / Cr{' '}
                  {accountLabel(creditElementId)}
                </p>
              )}
              {overDepreciated && (
                <Alert color="warning" className="mt-2">
                  The monthly amount over-writes the total before the last
                  period — lower the monthly amount, shorten the range, or raise
                  the total.
                </Alert>
              )}
            </div>
          )}

          {submitError && <Alert color="failure">{submitError}</Alert>}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button color="gray" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button color="primary" onClick={handleSubmit} disabled={!canSubmit}>
          {submitting ? 'Creating…' : 'Create Schedule'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
