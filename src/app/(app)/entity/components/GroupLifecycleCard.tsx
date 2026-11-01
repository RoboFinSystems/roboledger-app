'use client'

import {
  currentPeriod,
  formatPeriod,
} from '@/components/FiscalCalendarSetupModal'
import { friendlyError } from '@/lib/ledger/errors'
import { formatAmount, parseDollars } from '@/lib/ledger/formatters'
import type { LedgerEntity } from '@robosystems/client/clients'
import type {
  AcquisitionResponse,
  DeconsolidationResponse,
  OwnershipChangeResponse,
} from '@robosystems/client/types'
import { clients } from '@robosystems/core'
import { Alert, Button, Card, Label, TextInput } from '@robosystems/core/ui'
import { type FC, type FormEvent, useEffect, useState } from 'react'

type Mode = 'acquisition' | 'share' | 'deconsolidation' | null

const money = (cents: number): string => formatAmount(cents, 'USD')

interface GroupLifecycleCardProps {
  graphId: string
  entity: LedgerEntity
  /** Called once an entry is recorded, so the page re-reads the entity. */
  onRecorded?: () => void
}

/**
 * A member's life in the group, recorded where it happens: the acquisition
 * that brought it in, a change in the parent's share while it stays, and the
 * deconsolidation once it has left. Each writes a draft in the consolidation
 * entity that the group close posts; the figures each returns are what the
 * group's statements will carry. The parent's own side of each — its
 * purchase, its sale — is a journal entry in the parent's books, named to the
 * seller or buyer, not the member.
 */
const GroupLifecycleCard: FC<GroupLifecycleCardProps> = ({
  graphId,
  entity,
  onRecorded,
}) => {
  const [mode, setMode] = useState<Mode>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [acquired, setAcquired] = useState<AcquisitionResponse | null>(null)
  const [changed, setChanged] = useState<OwnershipChangeResponse | null>(null)
  const [left, setLeft] = useState<DeconsolidationResponse | null>(null)

  // Acquisition
  const [price, setPrice] = useState('')
  const [nciFairValue, setNciFairValue] = useState('')
  const [bargainConfirmed, setBargainConfirmed] = useState(false)
  // Change in share
  const [period, setPeriod] = useState(currentPeriod())
  const [sharePct, setSharePct] = useState('')
  const [sharePrice, setSharePrice] = useState('')
  // Deconsolidation
  const [proceeds, setProceeds] = useState('')
  const [basis, setBasis] = useState('')

  // Another entity starts clean: nothing recorded for the last one shows
  // here, and none of its amounts waits in a form.
  useEffect(() => {
    setMode(null)
    setError(null)
    setAcquired(null)
    setChanged(null)
    setLeft(null)
    setPrice('')
    setNciFairValue('')
    setBargainConfirmed(false)
    setPeriod(currentPeriod())
    setSharePct('')
    setSharePrice('')
    setProceeds('')
    setBasis('')
  }, [entity.id])

  if (entity.isParent || entity.entityRole === 'consolidation') return null

  const inFull = entity.consolidationMethod === 'full'
  const held = entity.ownershipPct ?? 100
  const canAcquire = Boolean(entity.joinedOn) && inFull
  const canChangeShare = inFull && !entity.isFormer && !entity.leftOn
  const canDeconsolidate = Boolean(entity.leftOn)

  const open = (next: Mode) => {
    setMode(next)
    setError(null)
    setBasis('')
  }

  const run = async <T,>(
    label: string,
    call: () => Promise<T>,
    done: (result: T) => void
  ) => {
    setSaving(true)
    setError(null)
    try {
      const result = await call()
      done(result)
      setMode(null)
      onRecorded?.()
    } catch (err) {
      setError(
        friendlyError(err instanceof Error ? err.message : `${label} failed.`)
          .message
      )
    } finally {
      setSaving(false)
    }
  }

  const priceCents = parseDollars(price)
  const nciCents =
    nciFairValue.trim() === '' ? null : parseDollars(nciFairValue)
  const acquisitionOk =
    priceCents !== null &&
    priceCents >= 0 &&
    (nciFairValue.trim() === '' || nciCents !== null) &&
    basis.trim() !== ''

  const submitAcquisition = (event: FormEvent) => {
    event.preventDefault()
    if (!acquisitionOk || priceCents === null) return
    void run(
      'Recording the acquisition',
      () =>
        clients.ledger.recordAcquisition(graphId, {
          entity_id: entity.id,
          consideration: priceCents,
          basis: basis.trim(),
          ...(nciCents !== null ? { nci_fair_value: nciCents } : {}),
          ...(bargainConfirmed ? { confirm_bargain_purchase: true } : {}),
        }),
      setAcquired
    )
  }

  const pct = /^\d+(\.\d+)?$/.test(sharePct.trim())
    ? Number(sharePct.trim())
    : null
  const sharePriceCents = parseDollars(sharePrice)
  const shareOk =
    pct !== null &&
    pct >= 50 &&
    pct <= 100 &&
    pct !== held &&
    sharePriceCents !== null &&
    sharePriceCents >= 0 &&
    /^\d{4}-(0[1-9]|1[0-2])$/.test(period) &&
    basis.trim() !== ''
  const selling = pct !== null && pct < held

  const submitShare = (event: FormEvent) => {
    event.preventDefault()
    if (!shareOk || pct === null || sharePriceCents === null) return
    void run(
      'Recording the change in share',
      () =>
        clients.ledger.recordOwnershipChange(graphId, {
          entity_id: entity.id,
          period,
          ownership_pct: pct,
          consideration: sharePriceCents,
          basis: basis.trim(),
        }),
      setChanged
    )
  }

  const proceedsCents = parseDollars(proceeds)
  const deconsolidationOk =
    proceedsCents !== null && proceedsCents >= 0 && basis.trim() !== ''

  const submitDeconsolidation = (event: FormEvent) => {
    event.preventDefault()
    if (!deconsolidationOk || proceedsCents === null) return
    void run(
      'Recording the deconsolidation',
      () =>
        clients.ledger.recordDeconsolidation(graphId, {
          entity_id: entity.id,
          consideration: proceedsCents,
          basis: basis.trim(),
        }),
      setLeft
    )
  }

  const basisField = (id: string, placeholder: string) => (
    <div>
      <Label htmlFor={id} className="mb-1 block">
        Basis
      </Label>
      <TextInput
        id={id}
        sizing="sm"
        value={basis}
        disabled={saving}
        placeholder={placeholder}
        onChange={(e) => setBasis(e.target.value)}
      />
    </div>
  )

  const actions = (
    <div className="flex gap-2">
      <Button type="submit" size="xs" disabled={saving}>
        {saving ? 'Recording…' : 'Record'}
      </Button>
      <Button
        size="xs"
        color="light"
        disabled={saving}
        onClick={() => setMode(null)}
      >
        Cancel
      </Button>
    </div>
  )

  return (
    <Card>
      <div className="mb-4 border-b border-gray-200 pb-4 dark:border-gray-600">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Group lifecycle
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {entity.isFormer
            ? `A former member${entity.leftOn ? `: left after ${entity.leftOn.slice(0, 7)}` : ''}.`
            : entity.leftOn
              ? `Leaves the group after ${entity.leftOn.slice(0, 7)}.`
              : entity.joinedOn
                ? `Joined ${entity.joinedOn.slice(0, 7)}; ${held}% held.`
                : `In the group from the start; ${held}% held.`}{' '}
          Each entry here is a draft in the consolidation entity that the group
          close posts; the parent&apos;s own purchase or sale is a journal entry
          in its books, named to the seller or buyer.
        </p>
      </div>

      {mode === null && (
        <div className="flex flex-wrap gap-2">
          {canAcquire && (
            <Button size="xs" color="light" onClick={() => open('acquisition')}>
              Record the acquisition
            </Button>
          )}
          {canChangeShare && (
            <Button size="xs" color="light" onClick={() => open('share')}>
              Record a change in share
            </Button>
          )}
          {canDeconsolidate && (
            <Button
              size="xs"
              color="light"
              onClick={() => open('deconsolidation')}
            >
              Record the deconsolidation
            </Button>
          )}
          {!canAcquire && !canChangeShare && !canDeconsolidate && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nothing to record: a member formed in the group on the equity or
              cost method has no acquisition or change in share to record here.
            </p>
          )}
        </div>
      )}

      {mode === 'acquisition' && (
        <form onSubmit={submitAcquisition} className="space-y-3 text-sm">
          <p className="text-gray-600 dark:text-gray-300">
            What the parent paid its sellers for {held}% of {entity.name}, the
            day it joined. The excess over the parent&apos;s share of the equity
            it brought is goodwill. Step-ups to named assets are recorded with
            your assistant.
          </p>
          <div>
            <Label htmlFor="acq-price" className="mb-1 block">
              Price paid ($)
            </Label>
            <TextInput
              id="acq-price"
              sizing="sm"
              className="max-w-48"
              inputMode="decimal"
              value={price}
              disabled={saving}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="acq-nci" className="mb-1 block">
              Fair value of the outside owners&apos; interest ($, optional)
            </Label>
            <TextInput
              id="acq-nci"
              sizing="sm"
              className="max-w-48"
              inputMode="decimal"
              value={nciFairValue}
              disabled={saving}
              onChange={(e) => setNciFairValue(e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Leave blank for goodwill on the parent&apos;s share only.
            </p>
          </div>
          <label className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={bargainConfirmed}
              disabled={saving}
              onChange={(e) => setBargainConfirmed(e.target.checked)}
            />
            A bargain purchase, confirmed after the reassessment ASC 805 asks
            for
          </label>
          {basisField('acq-basis', 'The purchase agreement and its date.')}
          {error && <Alert color="failure">{error}</Alert>}
          {actions}
        </form>
      )}

      {mode === 'share' && (
        <form onSubmit={submitShare} className="space-y-3 text-sm">
          <p className="text-gray-600 dark:text-gray-300">
            The parent buys more of {entity.name} from its outside owners, or
            sells some to them while keeping control. No gain or loss in the
            group either way: the difference adjusts the parent&apos;s equity.
            Record the parent&apos;s own purchase or sale in its books first.
          </p>
          <div>
            <Label htmlFor="share-period" className="mb-1 block">
              From month (YYYY-MM)
            </Label>
            <TextInput
              id="share-period"
              sizing="sm"
              className="max-w-48"
              value={period}
              disabled={saving}
              onChange={(e) => setPeriod(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="share-pct" className="mb-1 block">
              The parent&apos;s share from then (%), now {held}%
            </Label>
            <TextInput
              id="share-pct"
              sizing="sm"
              className="max-w-48"
              inputMode="decimal"
              value={sharePct}
              disabled={saving}
              onChange={(e) => setSharePct(e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              50 or more: below that is a change of method, not supported yet.
            </p>
          </div>
          <div>
            <Label htmlFor="share-price" className="mb-1 block">
              {selling ? 'Price received ($)' : 'Price paid ($)'}
            </Label>
            <TextInput
              id="share-price"
              sizing="sm"
              className="max-w-48"
              inputMode="decimal"
              value={sharePrice}
              disabled={saving}
              onChange={(e) => setSharePrice(e.target.value)}
            />
          </div>
          {basisField('share-basis', 'The share purchase or sale agreement.')}
          {error && <Alert color="failure">{error}</Alert>}
          {actions}
        </form>
      )}

      {mode === 'deconsolidation' && (
        <form onSubmit={submitDeconsolidation} className="space-y-3 text-sm">
          <p className="text-gray-600 dark:text-gray-300">
            {entity.name} left after {entity.leftOn?.slice(0, 7)}. What the
            parent received for its shares; 0 for a dissolution. Goodwill and
            the outside owners&apos; interest come off, the results earned in
            the group go back to its equity, and the difference is the
            group&apos;s gain or loss, dated the first day of the month after.
          </p>
          <div>
            <Label htmlFor="decon-proceeds" className="mb-1 block">
              Proceeds ($)
            </Label>
            <TextInput
              id="decon-proceeds"
              sizing="sm"
              className="max-w-48"
              inputMode="decimal"
              value={proceeds}
              disabled={saving}
              onChange={(e) => setProceeds(e.target.value)}
            />
          </div>
          {basisField('decon-basis', 'The sale agreement, or the dissolution.')}
          {error && <Alert color="failure">{error}</Alert>}
          {actions}
        </form>
      )}

      {mode === null && error && <Alert color="failure">{error}</Alert>}

      {acquired && (
        <div className="mt-4 rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-white">
            Acquisition recorded as a draft, dated {acquired.joined_on}.
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            Paid {money(acquired.consideration)} for{' '}
            {money(acquired.parent_share)} of equity: {money(acquired.excess)}{' '}
            above book,{' '}
            {acquired.goodwill >= 0
              ? `goodwill ${money(acquired.goodwill)}`
              : `a bargain purchase gain of ${money(-acquired.goodwill)}`}
            {acquired.noncontrolling_interest
              ? `, the outside owners' interest ${money(acquired.noncontrolling_interest)} above book`
              : ''}
            .
          </p>
        </div>
      )}

      {changed && (
        <div className="mt-4 rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-white">
            Share {changed.from_pct}% → {changed.to_pct}% from{' '}
            {formatPeriod(changed.period)}, recorded as a draft.
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            Book value {changed.to_pct > changed.from_pct ? 'bought' : 'sold'}{' '}
            {money(Math.abs(changed.book_value))}; results{' '}
            {changed.to_pct > changed.from_pct ? 'taken over' : 'given up'}{' '}
            {money(Math.abs(changed.earnings_transferred))}
            {changed.gain_reversed
              ? `; the parent's own ${changed.gain_reversed > 0 ? 'gain' : 'loss'} of ${money(Math.abs(changed.gain_reversed))} reversed, ${money(changed.carrying_released ?? 0)} of carrying amount released`
              : ''}
            ; the parent&apos;s equity{' '}
            {changed.equity_adjustment >= 0 ? 'takes' : 'gains'}{' '}
            {money(Math.abs(changed.equity_adjustment))}.
          </p>
        </div>
      )}

      {left && (
        <div className="mt-4 rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-white">
            Deconsolidation recorded as a draft for {formatPeriod(left.period)}.
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            {left.derecognized.length > 0
              ? `Taken off: ${left.derecognized
                  .map(
                    (d) =>
                      `${d.concept.split(':').pop()} ${money(Math.abs(d.amount))}`
                  )
                  .join(', ')}. `
              : ''}
            {left.earnings_restored
              ? `Results of ${money(left.earnings_restored)} put back into the group's equity. `
              : ''}
            The group&apos;s {left.gain_loss >= 0 ? 'gain' : 'loss'} on its
            leaving: {money(Math.abs(left.gain_loss))}, against the proceeds of{' '}
            {money(left.consideration)}.
          </p>
        </div>
      )}
    </Card>
  )
}

export default GroupLifecycleCard
