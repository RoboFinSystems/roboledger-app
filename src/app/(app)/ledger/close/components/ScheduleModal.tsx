'use client'

import { formatPeriod } from '@/components/FiscalCalendarSetupModal'
import { extractDetail } from '@/lib/ledger/errors'
import { formatDollars } from '@/lib/ledger/formatters'
import {
  createSchedule,
  evenCurve,
  isScheduleMethod,
  lifeEndDate,
  loanLegs,
  loanSettlement,
  monthsIn,
  previewSchedule,
  rebuildSchedule,
  type LoanSettlement,
  type ScheduleDefinition,
  type ScheduleFactsFallback,
  type ScheduleMethod,
} from '@/lib/ledger/schedules'
import type {
  LoanTermsRequest,
  PreviewScheduleResponse,
  ScheduleMechanics,
} from '@robosystems/client'
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
  Select,
  TextInput,
} from 'flowbite-react'
import { useCallback, useEffect, useMemo, useState, type FC } from 'react'

interface AccountOption {
  id: string
  code: string | null
  name: string
}

export interface EditingSchedule {
  structureId: string
  name: string
  mechanics: ScheduleMechanics
  /**
   * The bounds and amount read from the facts, for a schedule stored before
   * the definition rode the envelope.
   */
  fallback?: ScheduleFactsFallback | null
}

interface ScheduleModalProps {
  graphId: string
  /** A subsidiary's id, or null for the group parent: whose chart the accounts come from. */
  entityId?: string | null
  open: boolean
  onClose: () => void
  /** The schedule created, or the edited one rebuilt. */
  onSaved?: (structureId: string) => void
  /** Set to edit an existing schedule: its definition pre-fills the form. */
  editing?: EditingSchedule | null
}

type EntryType = NonNullable<ScheduleDefinition['entry_template']['entry_type']>
type DayCount = NonNullable<LoanTermsRequest['day_count']>
type PaymentFrequency = NonNullable<LoanTermsRequest['payment_frequency']>

interface LoanForm {
  principal: string
  annualRatePercent: string
  startDate: string
  dayCount: DayCount
  paymentFrequency: PaymentFrequency
  firstPaymentDate: string
  paymentAmount: string
  interestOnly: boolean
  maturityDate: string
  capitalizeInterest: boolean
  noteElementId: string
  currentPortionElementId: string
  settlement: LoanSettlement
}

interface FormState {
  name: string
  method: ScheduleMethod
  debitElementId: string
  creditElementId: string
  periodStart: string
  periodEnd: string
  monthlyAmount: string
  entryType: EntryType
  memoTemplate: string
  showAssetDetails: boolean
  originalAmount: string
  residualValue: string
  usefulLifeMonths: string
  assetElementId: string
  bookedOn: string
  /** Custom curve: one dollars string per month of the range. */
  curve: string[]
  loan: LoanForm
}

const parseMoney = (raw: string): number => {
  const n = Number(raw)
  return Number.isFinite(n) ? Math.round(n * 100) : 0
}

const dollars = (cents: number | null | undefined): string =>
  cents === null || cents === undefined ? '' : (cents / 100).toFixed(2)

const formatCents = (cents: number): string => formatDollars(cents / 100)

// Local-timezone first day of the current month — schedules are monthly,
// so the natural default start is the month boundary, not today.
const firstOfMonthLocal = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

const EMPTY_LOAN: LoanForm = {
  principal: '',
  annualRatePercent: '',
  startDate: '',
  dayCount: '30/360',
  paymentFrequency: 'monthly',
  firstPaymentDate: '',
  paymentAmount: '',
  interestOnly: false,
  maturityDate: '',
  capitalizeInterest: false,
  noteElementId: '',
  currentPortionElementId: '',
  settlement: 'bank',
}

const emptyForm = (): FormState => ({
  name: '',
  method: 'straight_line',
  debitElementId: '',
  creditElementId: '',
  periodStart: firstOfMonthLocal(),
  periodEnd: '',
  monthlyAmount: '',
  entryType: 'closing',
  memoTemplate: '',
  showAssetDetails: false,
  originalAmount: '',
  residualValue: '',
  usefulLifeMonths: '',
  assetElementId: '',
  bookedOn: '',
  curve: [],
  loan: { ...EMPTY_LOAN },
})

/** The form pre-filled from a schedule's definition, as its envelope reads it back. */
const formFromEditing = (editing: EditingSchedule): FormState => {
  const { mechanics, fallback } = editing
  const template = mechanics.entry_template
  const meta = mechanics.schedule_metadata ?? null
  const terms = meta?.loan_terms ?? null
  const method: ScheduleMethod = isScheduleMethod(meta?.method)
    ? meta.method
    : 'straight_line'
  const monthly =
    mechanics.monthly_amount ?? fallback?.monthlyAmountCents ?? null
  const hasAssetDetails = !!(
    meta &&
    (meta.original_amount ||
      meta.residual_value ||
      meta.useful_life_months ||
      meta.asset_element_id ||
      meta.booked_on)
  )
  return {
    name: editing.name,
    method,
    debitElementId: template.debit_element_id,
    creditElementId: template.credit_element_id,
    periodStart:
      mechanics.period_start ?? fallback?.periodStart ?? firstOfMonthLocal(),
    periodEnd: mechanics.period_end ?? fallback?.periodEnd ?? '',
    monthlyAmount: method === 'straight_line' ? dollars(monthly) : '',
    entryType: template.entry_type ?? 'closing',
    memoTemplate: template.memo_template ?? '',
    showAssetDetails: hasAssetDetails,
    originalAmount: meta?.original_amount ? dollars(meta.original_amount) : '',
    residualValue: meta?.residual_value ? dollars(meta.residual_value) : '',
    usefulLifeMonths: meta?.useful_life_months
      ? String(meta.useful_life_months)
      : '',
    assetElementId: meta?.asset_element_id ?? '',
    bookedOn: meta?.booked_on ?? '',
    curve: (meta?.periodic_amounts ?? []).map((cents) => dollars(cents)),
    loan: terms
      ? {
          principal: dollars(terms.principal),
          annualRatePercent: String(Math.round(terms.annual_rate * 1e6) / 1e4),
          startDate: terms.start_date,
          dayCount: terms.day_count ?? '30/360',
          paymentFrequency: terms.payment_frequency ?? 'monthly',
          firstPaymentDate: terms.first_payment_date ?? '',
          paymentAmount: dollars(terms.payment_amount),
          interestOnly: terms.interest_only ?? false,
          maturityDate: terms.maturity_date ?? '',
          capitalizeInterest: terms.capitalize_interest ?? false,
          noteElementId: terms.note_element_id,
          currentPortionElementId: terms.current_portion_element_id ?? '',
          settlement: loanSettlement(template.legs),
        }
      : { ...EMPTY_LOAN },
  }
}

const accountLabel = (accounts: AccountOption[], id: string): string => {
  const a = accounts.find((acc) => acc.id === id)
  if (!a) return id
  return a.code ? `${a.code} — ${a.name}` : a.name
}

/**
 * The schedule form: create a schedule, or edit one in place. Three
 * methods — straight-line, a custom curve (one amount per month), and a
 * loan (the amortization table computed from its terms) — with the
 * server's preview before the save, and the edit saved through
 * `rebuild-schedule` while nothing has posted. Posts through the
 * generated SDK (`@/lib/ledger/schedules`); the caller lands on the
 * schedule's BlockView as the post-commit view.
 */
export const ScheduleModal: FC<ScheduleModalProps> = ({
  graphId,
  entityId = null,
  open,
  onClose,
  onSaved,
  editing = null,
}) => {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [accounts, setAccounts] = useState<AccountOption[]>([])
  const [accountsLoading, setAccountsLoading] = useState(false)
  const [preview, setPreview] = useState<PreviewScheduleResponse | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Any edit invalidates the preview: it was of the definition before it.
  const update = useCallback((patch: Partial<FormState>) => {
    setForm((f) => ({ ...f, ...patch }))
    setPreview(null)
    setPreviewError(null)
  }, [])
  const updateLoan = useCallback((patch: Partial<LoanForm>) => {
    setForm((f) => ({ ...f, loan: { ...f.loan, ...patch } }))
    setPreview(null)
    setPreviewError(null)
  }, [])

  // Load accounts when the modal opens.
  useEffect(() => {
    if (!open || !graphId) return
    let cancelled = false
    setAccountsLoading(true)
    void (async () => {
      try {
        const list = await clients.ledger.listAccounts(graphId, {
          entityId,
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
            'ScheduleModal: account list hit the 500-row cap — picker may not show every account.'
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
  }, [open, graphId, entityId])

  // Reset every time the modal opens, and when the entity or the schedule
  // being edited changes under it: the account picks belong to one chart.
  useEffect(() => {
    if (!open) return
    setForm(editing ? formFromEditing(editing) : emptyForm())
    setPreview(null)
    setPreviewError(null)
    setSubmitError(null)
  }, [open, entityId, editing])

  const {
    name,
    method,
    debitElementId,
    creditElementId,
    periodStart,
    periodEnd,
    monthlyAmount,
    entryType,
    memoTemplate,
    showAssetDetails,
    originalAmount,
    residualValue,
    usefulLifeMonths,
    assetElementId,
    bookedOn,
    curve,
    loan,
  } = form

  const isLoan = method === 'effective_interest'
  const isCustom = method === 'custom'
  const isStraight = method === 'straight_line'

  const months = useMemo(
    () =>
      periodStart && periodEnd && periodEnd >= periodStart
        ? monthsIn(periodStart, periodEnd)
        : [],
    [periodStart, periodEnd]
  )

  const monthlyCents = parseMoney(monthlyAmount)
  const originalCents = parseMoney(originalAmount)
  const residualCents = parseMoney(residualValue)
  // The server books `original − residual`; salvage is never written off.
  const depreciableCents = originalCents - residualCents
  // The server refuses a negative salvage, a salvage with no cost basis, and
  // a salvage at or above the cost.
  const residualTooHigh =
    residualCents < 0 ||
    (residualCents > 0 && originalCents <= 0) ||
    (originalCents > 0 && residualCents >= originalCents)

  // Mirror the server's straight-line generator: every period fires the
  // monthly amount, except the final period absorbs rounding so the sum
  // equals the depreciable base exactly (when an original amount is given).
  const finalMonthCents =
    originalCents > 0 && months.length > 1
      ? depreciableCents - monthlyCents * (months.length - 1)
      : monthlyCents
  const totalCents =
    originalCents > 0 ? depreciableCents : monthlyCents * months.length
  const overDepreciated =
    isStraight && originalCents > 0 && !residualTooHigh && finalMonthCents < 0

  // A custom curve must have one non-negative amount per month, summing to
  // the total less salvage exactly; the server proves that with a rule.
  const curveCents = useMemo(() => curve.map(parseMoney), [curve])
  const curveSum = curveCents.reduce((sum, c) => sum + c, 0)
  const curveNegative = curve.some((raw) => Number(raw) < 0)
  const curveMatches =
    originalCents > 0 &&
    !residualTooHigh &&
    curveCents.length === months.length &&
    !curveNegative &&
    curveSum === depreciableCents

  // Keep the grid one row per month; a fresh range, or a grid nobody has
  // typed in yet, starts from the even spread, which is what straight-line
  // would book.
  useEffect(() => {
    if (!isCustom) return
    const untouched = curve.every((raw) => raw === '')
    if (curve.length === months.length && !(untouched && depreciableCents > 0))
      return
    const prefill =
      depreciableCents > 0
        ? evenCurve(depreciableCents, months.length).map(dollars)
        : months.map(() => '')
    setForm((f) => ({ ...f, curve: prefill }))
  }, [isCustom, months, curve, depreciableCents])

  const spreadEvenly = () =>
    update({ curve: evenCurve(depreciableCents, months.length).map(dollars) })

  const principalCents = parseMoney(loan.principal)
  const annualRate = Number(loan.annualRatePercent) / 100
  const drawInFirstMonth =
    !!loan.startDate && loan.startDate.slice(0, 7) === periodStart.slice(0, 7)
  const loanValid =
    principalCents > 0 &&
    Number.isFinite(annualRate) &&
    annualRate >= 0 &&
    annualRate < 1 &&
    drawInFirstMonth &&
    !!loan.noteElementId &&
    loan.noteElementId !== debitElementId &&
    loan.noteElementId !== creditElementId

  const postedPeriods = editing?.mechanics.posted_periods ?? []
  const locked = postedPeriods.length > 0

  const definitionValid =
    !!graphId &&
    name.trim().length > 0 &&
    !!debitElementId &&
    !!creditElementId &&
    debitElementId !== creditElementId &&
    months.length > 0 &&
    (isStraight
      ? monthlyCents > 0 && !overDepreciated && !residualTooHigh
      : isCustom
        ? curveMatches
        : loanValid)

  const buildDefinition = useCallback((): ScheduleDefinition => {
    const loanTerms: LoanTermsRequest | null = isLoan
      ? {
          principal: principalCents,
          annual_rate: annualRate,
          start_date: loan.startDate,
          day_count: loan.dayCount,
          payment_frequency: loan.paymentFrequency,
          first_payment_date: loan.firstPaymentDate || null,
          payment_amount: parseMoney(loan.paymentAmount) || null,
          interest_only: loan.interestOnly,
          maturity_date: loan.maturityDate || null,
          capitalize_interest: loan.capitalizeInterest,
          note_element_id: loan.noteElementId,
          current_portion_element_id: loan.currentPortionElementId || null,
        }
      : null
    const elementIds = Array.from(
      new Set([
        debitElementId,
        creditElementId,
        ...(!isLoan && assetElementId ? [assetElementId] : []),
        ...(isLoan ? [loan.noteElementId] : []),
        ...(isLoan && loan.currentPortionElementId
          ? [loan.currentPortionElementId]
          : []),
      ])
    )
    return {
      name: name.trim(),
      element_ids: elementIds,
      period_start: periodStart,
      period_end: periodEnd,
      ...(isStraight ? { monthly_amount: monthlyCents } : {}),
      entry_template: {
        debit_element_id: debitElementId,
        credit_element_id: creditElementId,
        entry_type: entryType,
        memo_template: memoTemplate.trim(),
        ...(isLoan
          ? {
              legs: loanLegs(loan.settlement, {
                interestElementId: debitElementId,
                creditElementId,
                noteElementId: loan.noteElementId,
              }),
            }
          : {}),
      },
      ...(entityId ? { entity_id: entityId } : {}),
      schedule_metadata: {
        method,
        original_amount: isLoan ? 0 : originalCents,
        residual_value: isLoan ? 0 : residualCents,
        useful_life_months: isLoan ? 0 : Number(usefulLifeMonths) || 0,
        asset_element_id: !isLoan && assetElementId ? assetElementId : null,
        booked_on: !isLoan && bookedOn ? bookedOn : null,
        periodic_amounts: isCustom ? curveCents : null,
        loan_terms: loanTerms,
      },
    }
  }, [
    isLoan,
    isCustom,
    isStraight,
    principalCents,
    annualRate,
    loan,
    debitElementId,
    creditElementId,
    assetElementId,
    name,
    periodStart,
    periodEnd,
    monthlyCents,
    entryType,
    memoTemplate,
    entityId,
    method,
    originalCents,
    residualCents,
    usefulLifeMonths,
    bookedOn,
    curveCents,
  ])

  const handlePreview = useCallback(async () => {
    if (!definitionValid || previewing) return
    setPreviewing(true)
    setPreviewError(null)
    try {
      setPreview(
        await previewSchedule(
          graphId,
          buildDefinition(),
          editing?.structureId ?? null
        )
      )
    } catch (err) {
      setPreviewError(
        err instanceof Error
          ? extractDetail(err.message)
          : 'Failed to preview the schedule.'
      )
    } finally {
      setPreviewing(false)
    }
  }, [definitionValid, previewing, graphId, buildDefinition, editing])

  const canSubmit = definitionValid && !submitting && !locked

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const definition = buildDefinition()
      let structureId: string
      if (editing) {
        await rebuildSchedule(graphId, editing.structureId, {
          period_start: definition.period_start,
          period_end: definition.period_end,
          ...(isStraight ? { monthly_amount: definition.monthly_amount } : {}),
          entry_template: definition.entry_template,
          schedule_metadata: definition.schedule_metadata,
        })
        if (definition.name !== editing.name) {
          await clients.ledger.updateSchedule(graphId, editing.structureId, {
            name: definition.name,
          })
        }
        structureId = editing.structureId
      } else {
        structureId = (await createSchedule(graphId, definition)).structureId
      }
      onSaved?.(structureId)
      onClose()
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? extractDetail(err.message)
          : editing
            ? 'Failed to save the schedule.'
            : 'Failed to create schedule.'
      )
    } finally {
      setSubmitting(false)
    }
  }, [
    canSubmit,
    buildDefinition,
    editing,
    graphId,
    isStraight,
    onSaved,
    onClose,
  ])

  const busy = submitting || previewing
  const label = (id: string) => accountLabel(accounts, id)

  const accountOptions = (allowNone = false) => (
    <>
      <option value="">{allowNone ? 'None' : 'Select account…'}</option>
      {accounts.map((a) => (
        <option key={a.id} value={a.id}>
          {a.code ? `${a.code} — ${a.name}` : a.name}
        </option>
      ))}
    </>
  )

  return (
    <Modal show={open} onClose={onClose} size="3xl">
      <ModalHeader>{editing ? 'Edit schedule' : 'New Schedule'}</ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          {locked && editing?.mechanics.edit_warning && (
            <Alert color="warning">{editing.mechanics.edit_warning}</Alert>
          )}
          {editing?.mechanics.end_date && (
            <p className="text-xs text-gray-500">
              Ended early at {editing.mechanics.end_date}; a rebuild keeps that
              end.
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Label htmlFor="sched-name">Name</Label>
              <TextInput
                id="sched-name"
                placeholder="e.g. Prepaid Insurance Amortization"
                value={name}
                onChange={(e) => update({ name: e.target.value })}
                disabled={busy}
              />
            </div>
            <div>
              <Label htmlFor="sched-method">Method</Label>
              <Select
                id="sched-method"
                value={method}
                onChange={(e) =>
                  update({ method: e.target.value as ScheduleMethod })
                }
                disabled={busy}
              >
                <option value="straight_line">Straight-line</option>
                <option value="custom">Custom curve</option>
                <option value="effective_interest">
                  Loan (effective interest)
                </option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="sched-debit">
                {isLoan ? 'Interest expense account' : 'Debit account'}
              </Label>
              <Select
                id="sched-debit"
                value={debitElementId}
                onChange={(e) => update({ debitElementId: e.target.value })}
                disabled={busy || accountsLoading}
              >
                {accountOptions()}
              </Select>
              <p className="mt-1 text-xs text-gray-500">
                {isLoan
                  ? "The period's interest is debited here"
                  : "Expense side of each period's entry"}
              </p>
            </div>
            <div>
              <Label htmlFor="sched-credit">
                {isLoan
                  ? loan.settlement === 'schedule'
                    ? 'Cash or due-to account'
                    : 'Accrued interest or payable account'
                  : 'Credit account'}
              </Label>
              <Select
                id="sched-credit"
                value={creditElementId}
                onChange={(e) => update({ creditElementId: e.target.value })}
                disabled={busy || accountsLoading}
              >
                {accountOptions()}
              </Select>
              <p className="mt-1 text-xs text-gray-500">
                {isLoan
                  ? loan.settlement === 'schedule'
                    ? 'The whole payment is credited here'
                    : 'The interest accrues here until the payment arrives on the feed'
                  : 'Prepaid asset, accumulated depreciation, or accrual liability'}
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
                onChange={(e) => update({ periodStart: e.target.value })}
                disabled={busy}
              />
            </div>
            <div>
              <Label htmlFor="sched-end">Last period</Label>
              <TextInput
                id="sched-end"
                type="date"
                value={periodEnd}
                onChange={(e) => update({ periodEnd: e.target.value })}
                disabled={busy}
              />
            </div>
            {isStraight && (
              <div>
                <Label htmlFor="sched-monthly">Monthly amount ($)</Label>
                <TextInput
                  id="sched-monthly"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={monthlyAmount}
                  onChange={(e) => update({ monthlyAmount: e.target.value })}
                  disabled={busy}
                />
              </div>
            )}
            {isCustom && (
              <div>
                <Label htmlFor="sched-total">Total to recognize ($)</Label>
                <TextInput
                  id="sched-total"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={originalAmount}
                  onChange={(e) => update({ originalAmount: e.target.value })}
                  disabled={busy}
                />
                <p className="mt-1 text-xs text-gray-500">
                  The curve must sum to this, less any salvage value
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="sched-entry-type">Entry type</Label>
              <Select
                id="sched-entry-type"
                value={entryType}
                onChange={(e) =>
                  update({ entryType: e.target.value as EntryType })
                }
                disabled={busy}
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
                onChange={(e) => update({ memoTemplate: e.target.value })}
                disabled={busy}
              />
            </div>
          </div>

          {isLoan && (
            <div className="space-y-4 rounded-md border border-gray-200 p-3 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Loan terms
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="loan-principal">Principal drawn ($)</Label>
                  <TextInput
                    id="loan-principal"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={loan.principal}
                    onChange={(e) => updateLoan({ principal: e.target.value })}
                    disabled={busy}
                  />
                </div>
                <div>
                  <Label htmlFor="loan-rate">Annual rate (%)</Label>
                  <TextInput
                    id="loan-rate"
                    type="number"
                    step="0.001"
                    placeholder="e.g. 9.9"
                    value={loan.annualRatePercent}
                    onChange={(e) =>
                      updateLoan({ annualRatePercent: e.target.value })
                    }
                    disabled={busy}
                  />
                </div>
                <div>
                  <Label htmlFor="loan-start">Draw date</Label>
                  <TextInput
                    id="loan-start"
                    type="date"
                    value={loan.startDate}
                    onChange={(e) => updateLoan({ startDate: e.target.value })}
                    disabled={busy}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Interest accrues from it; falls in the first period
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="loan-day-count">Day count</Label>
                  <Select
                    id="loan-day-count"
                    value={loan.dayCount}
                    onChange={(e) =>
                      updateLoan({ dayCount: e.target.value as DayCount })
                    }
                    disabled={busy}
                  >
                    <option value="30/360">30/360</option>
                    <option value="actual/365">Actual/365</option>
                    <option value="actual/360">Actual/360 (bank line)</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="loan-frequency">Payment frequency</Label>
                  <Select
                    id="loan-frequency"
                    value={loan.paymentFrequency}
                    onChange={(e) =>
                      updateLoan({
                        paymentFrequency: e.target.value as PaymentFrequency,
                      })
                    }
                    disabled={busy}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annual">Annual</option>
                    <option value="at_maturity">At maturity</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="loan-first-payment">
                    First payment (optional)
                  </Label>
                  <TextInput
                    id="loan-first-payment"
                    type="date"
                    value={loan.firstPaymentDate}
                    onChange={(e) =>
                      updateLoan({ firstPaymentDate: e.target.value })
                    }
                    disabled={busy}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Omitted: one frequency after the first month
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="loan-payment">
                    Payment amount ($, optional)
                  </Label>
                  <TextInput
                    id="loan-payment"
                    type="number"
                    step="0.01"
                    placeholder="Level payment"
                    value={loan.paymentAmount}
                    onChange={(e) =>
                      updateLoan({ paymentAmount: e.target.value })
                    }
                    disabled={busy || loan.interestOnly}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Omitted: the level payment that retires the principal by
                    maturity
                  </p>
                </div>
                <div>
                  <Label htmlFor="loan-maturity">Maturity (optional)</Label>
                  <TextInput
                    id="loan-maturity"
                    type="date"
                    value={loan.maturityDate}
                    onChange={(e) =>
                      updateLoan({ maturityDate: e.target.value })
                    }
                    disabled={busy}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Omitted: a line of credit whose balance carries on
                  </p>
                </div>
                <div className="space-y-2 pt-6">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="loan-interest-only"
                      checked={loan.interestOnly}
                      onChange={(e) =>
                        updateLoan({ interestOnly: e.target.checked })
                      }
                      disabled={busy}
                    />
                    <Label htmlFor="loan-interest-only">Interest only</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="loan-capitalize"
                      checked={loan.capitalizeInterest}
                      onChange={(e) =>
                        updateLoan({ capitalizeInterest: e.target.checked })
                      }
                      disabled={busy}
                    />
                    <Label htmlFor="loan-capitalize">
                      Capitalize interest (PIK)
                    </Label>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="loan-note">Note account</Label>
                  <Select
                    id="loan-note"
                    value={loan.noteElementId}
                    onChange={(e) =>
                      updateLoan({ noteElementId: e.target.value })
                    }
                    disabled={busy || accountsLoading}
                  >
                    {accountOptions()}
                  </Select>
                  <p className="mt-1 text-xs text-gray-500">
                    The liability the principal is carried in; the schedule
                    states its balance each month
                  </p>
                </div>
                <div>
                  <Label htmlFor="loan-current">
                    Current portion account (optional)
                  </Label>
                  <Select
                    id="loan-current"
                    value={loan.currentPortionElementId}
                    onChange={(e) =>
                      updateLoan({ currentPortionElementId: e.target.value })
                    }
                    disabled={busy || accountsLoading}
                  >
                    {accountOptions(true)}
                  </Select>
                  <p className="mt-1 text-xs text-gray-500">
                    Holds the next twelve months&apos; principal, reclassed each
                    month
                  </p>
                </div>
                <div>
                  <Label htmlFor="loan-settlement">Payment</Label>
                  <Select
                    id="loan-settlement"
                    value={loan.settlement}
                    onChange={(e) =>
                      updateLoan({
                        settlement: e.target.value as LoanSettlement,
                      })
                    }
                    disabled={busy}
                  >
                    <option value="bank">Arrives on the bank feed</option>
                    <option value="schedule">Booked by the schedule</option>
                  </Select>
                  <p className="mt-1 text-xs text-gray-500">
                    {loan.settlement === 'schedule'
                      ? 'Each month: debit the note for principal, interest expense for interest, credit the account above'
                      : 'Each month: accrue the interest only; classify the payment against the note and the accrual when it lands'}
                  </p>
                </div>
              </div>
              {loan.startDate && !drawInFirstMonth && (
                <Alert color="warning">
                  The draw date must fall in the first period.
                </Alert>
              )}
              {loan.noteElementId &&
                (loan.noteElementId === debitElementId ||
                  loan.noteElementId === creditElementId) && (
                  <Alert color="warning">
                    The note account must differ from the interest and credit
                    accounts.
                  </Alert>
                )}
            </div>
          )}

          {isCustom && months.length > 0 && (
            <div className="rounded-md border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between px-3 py-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Amount per month
                </p>
                <Button
                  size="xs"
                  color="light"
                  onClick={spreadEvenly}
                  disabled={busy || depreciableCents <= 0}
                >
                  Spread evenly
                </Button>
              </div>
              <div className="grid max-h-72 grid-cols-1 gap-2 overflow-y-auto border-t border-gray-200 p-3 sm:grid-cols-3 dark:border-gray-700">
                {months.map((month, i) => (
                  <div key={month} className="flex items-center gap-2">
                    <Label
                      htmlFor={`curve-${month}`}
                      className="w-20 shrink-0 text-xs"
                    >
                      {formatPeriod(month)}
                    </Label>
                    <TextInput
                      id={`curve-${month}`}
                      type="number"
                      min="0"
                      step="0.01"
                      sizing="sm"
                      value={curve[i] ?? ''}
                      onChange={(e) => {
                        const next = [...curve]
                        next[i] = e.target.value
                        update({ curve: next })
                      }}
                      disabled={busy}
                    />
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 px-3 py-2 text-sm dark:border-gray-700">
                Sum <span className="font-mono">{formatCents(curveSum)}</span>
                {originalCents > 0 && (
                  <>
                    {' '}
                    of{' '}
                    <span className="font-mono">
                      {formatCents(depreciableCents)}
                    </span>
                    {curveSum !== depreciableCents && (
                      <span className="ml-2 text-amber-600 dark:text-amber-400">
                        (off by {formatCents(curveSum - depreciableCents)})
                      </span>
                    )}
                  </>
                )}
              </div>
              {curveNegative && (
                <Alert color="warning" className="m-3">
                  Every month&apos;s amount must be zero or more.
                </Alert>
              )}
            </div>
          )}

          {!isLoan && (
            <div className="rounded-md border border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => update({ showAssetDetails: !showAssetDetails })}
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
                    {isStraight && (
                      <div>
                        <Label htmlFor="sched-original">
                          Original cost ($)
                        </Label>
                        <TextInput
                          id="sched-original"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={originalAmount}
                          onChange={(e) => {
                            const next = e.target.value
                            const base =
                              parseMoney(next) - parseMoney(residualValue)
                            const life = Number(usefulLifeMonths)
                            update({
                              originalAmount: next,
                              ...(base > 0 && Number.isInteger(life) && life > 0
                                ? {
                                    monthlyAmount: (base / 100 / life).toFixed(
                                      2
                                    ),
                                    periodEnd: lifeEndDate(periodStart, life),
                                  }
                                : {}),
                            })
                          }}
                          disabled={busy}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Written off over the life, less salvage value
                        </p>
                      </div>
                    )}
                    <div>
                      <Label htmlFor="sched-life">Useful life (months)</Label>
                      <TextInput
                        id="sched-life"
                        type="number"
                        step="1"
                        placeholder="e.g. 60"
                        value={usefulLifeMonths}
                        onChange={(e) => {
                          const next = e.target.value
                          const base = depreciableCents
                          const life = Number(next)
                          update({
                            usefulLifeMonths: next,
                            ...(isStraight &&
                            base > 0 &&
                            Number.isInteger(life) &&
                            life > 0
                              ? {
                                  monthlyAmount: (base / 100 / life).toFixed(2),
                                  periodEnd: lifeEndDate(periodStart, life),
                                }
                              : {}),
                          })
                        }}
                        disabled={busy}
                      />
                      {isStraight && (
                        <p className="mt-1 text-xs text-gray-500">
                          Pre-fills monthly amount and last period
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="sched-residual">Salvage value ($)</Label>
                      <TextInput
                        id="sched-residual"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={residualValue}
                        onChange={(e) => {
                          const next = e.target.value
                          const base =
                            parseMoney(originalAmount) - parseMoney(next)
                          const life = Number(usefulLifeMonths)
                          update({
                            residualValue: next,
                            ...(isStraight &&
                            base > 0 &&
                            Number.isInteger(life) &&
                            life > 0
                              ? {
                                  monthlyAmount: (base / 100 / life).toFixed(2),
                                  periodEnd: lifeEndDate(periodStart, life),
                                }
                              : {}),
                          })
                        }}
                        disabled={busy}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Deducted from the cost; never written off
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="sched-asset">
                        Asset account (optional)
                      </Label>
                      <Select
                        id="sched-asset"
                        value={assetElementId}
                        onChange={(e) =>
                          update({ assetElementId: e.target.value })
                        }
                        disabled={busy || accountsLoading}
                      >
                        {accountOptions(true)}
                      </Select>
                      <p className="mt-1 text-xs text-gray-500">
                        Balance-sheet asset tracked for net book value
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="sched-booked-on">
                        Cost booked on (optional)
                      </Label>
                      <TextInput
                        id="sched-booked-on"
                        type="date"
                        value={bookedOn}
                        max={periodStart || undefined}
                        onChange={(e) => update({ bookedOn: e.target.value })}
                        disabled={busy}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Only when the cost went on the books before the first
                        period, so its reconciliation counts it from that day
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Derived summary — mirrors the server's straight-line generator */}
          {isStraight && months.length > 0 && monthlyCents > 0 && (
            <div className="rounded-md border border-gray-200 p-3 dark:border-gray-700">
              <p className="text-xs text-gray-500 uppercase">Summary</p>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">
                {months.length} monthly{' '}
                {months.length === 1 ? 'entry' : 'entries'} of{' '}
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
                  Dr {label(debitElementId)} / Cr {label(creditElementId)}
                </p>
              )}
              {residualTooHigh && (
                <Alert color="warning" className="mt-2">
                  The salvage value must be at least zero, needs an original
                  cost, and must be less than it.
                </Alert>
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

          <div className="rounded-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-3 py-2">
              <p className="text-xs text-gray-500 uppercase">Preview</p>
              <Button
                size="xs"
                color="light"
                onClick={handlePreview}
                disabled={!definitionValid || busy}
              >
                {previewing ? 'Previewing…' : 'Preview'}
              </Button>
            </div>
            {previewError && (
              <Alert color="failure" className="m-3">
                {previewError}
              </Alert>
            )}
            {preview ? (
              <PreviewTable preview={preview} isLoan={isLoan} />
            ) : (
              !previewError && (
                <p className="px-3 pb-3 text-xs text-gray-500">
                  The server runs the generator without keeping it and shows the
                  roll-forward, month by month.
                </p>
              )
            )}
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
            ? editing
              ? 'Saving…'
              : 'Creating…'
            : editing
              ? 'Save changes'
              : 'Create Schedule'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

const money = (value: number | null | undefined): string =>
  value === null || value === undefined ? '—' : formatDollars(value)

/** The roll-forward a preview returned, month by month, with its warnings. */
const PreviewTable: FC<{
  preview: PreviewScheduleResponse
  isLoan: boolean
}> = ({ preview, isLoan }) => {
  const rows = preview.roll_forward ?? []
  const hasCurrentPortion = rows.some(
    (row) => row.current_portion !== null && row.current_portion !== undefined
  )
  const replaces = preview.replaces ?? null
  return (
    <div className="border-t border-gray-200 dark:border-gray-700">
      {(preview.warnings ?? []).map((warning) => (
        <Alert key={warning} color="warning" className="m-3">
          {warning}
        </Alert>
      ))}
      {replaces && (
        <Alert
          color={replaces.path === 'rebuild' ? 'info' : 'warning'}
          className="m-3"
        >
          {replaces.posted_entry_count === 0
            ? 'Nothing has posted: saving rebuilds the schedule in place.'
            : `${replaces.posted_entry_count} posted ${
                replaces.posted_entry_count === 1 ? 'month' : 'months'
              } (${(replaces.posted_periods ?? []).join(', ')}): the change cannot rebuild this schedule. End it after its last posted month and create the successor from the month after.`}
        </Alert>
      )}
      <div className="max-h-72 overflow-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-3 py-1 text-left">Period</th>
              <th className="px-3 py-1 text-right">Opening</th>
              <th className="px-3 py-1 text-right">
                {isLoan ? 'Interest' : 'Amount'}
              </th>
              {isLoan && <th className="px-3 py-1 text-right">Payment</th>}
              {isLoan && <th className="px-3 py-1 text-right">Principal</th>}
              {hasCurrentPortion && (
                <th className="px-3 py-1 text-right">Current portion</th>
              )}
              <th className="px-3 py-1 text-right">Closing</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.period_end}
                className={
                  row.scope === 'historical'
                    ? 'text-gray-400 dark:text-gray-500'
                    : 'text-gray-700 dark:text-gray-200'
                }
              >
                <td className="px-3 py-1">
                  {formatPeriod(row.period_end.slice(0, 7))}
                  {row.scope === 'historical' && (
                    <span className="ml-1 text-xs">(history)</span>
                  )}
                </td>
                <td className="px-3 py-1 text-right font-mono">
                  {money(row.opening)}
                </td>
                <td className="px-3 py-1 text-right font-mono">
                  {money(isLoan ? row.interest : row.amount)}
                </td>
                {isLoan && (
                  <td className="px-3 py-1 text-right font-mono">
                    {money(row.payment)}
                  </td>
                )}
                {isLoan && (
                  <td className="px-3 py-1 text-right font-mono">
                    {money(row.principal)}
                  </td>
                )}
                {hasCurrentPortion && (
                  <td className="px-3 py-1 text-right font-mono">
                    {money(row.current_portion)}
                  </td>
                )}
                <td className="px-3 py-1 text-right font-mono">
                  {money(row.closing)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
