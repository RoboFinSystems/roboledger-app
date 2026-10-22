'use client'

import { formatPeriod } from '@/components/FiscalCalendarSetupModal'
import SegmentedControl from '@/components/SegmentedControl'
import { friendlyError } from '@/lib/ledger/errors'
import { formatAmount, parseDollars } from '@/lib/ledger/formatters'
import type {
  LedgerAllocationOverride,
  LedgerAllocationShare,
} from '@robosystems/client/clients'
import { clients } from '@robosystems/core'
import {
  Alert,
  Button,
  Card,
  Label,
  Spinner,
  Textarea,
  TextInput,
} from 'flowbite-react'
import {
  type FC,
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { HiUserGroup } from 'react-icons/hi'

type Mode = 'amount' | 'percentage'

const MODES = [
  { value: 'amount' as const, label: 'Amount' },
  { value: 'percentage' as const, label: 'Percentage' },
]

const money = (cents: number): string => formatAmount(cents, 'USD')

const describeOverride = (
  override: Pick<LedgerAllocationOverride, 'amount' | 'percentage'>
): string =>
  override.amount !== null && override.amount !== undefined
    ? money(override.amount)
    : `${override.percentage ?? 0}% of the month's result`

export { parseDollars }

interface AllocationOverridePanelProps {
  graphId: string
  /** The member, consolidated in full with outside owners. */
  entityId: string
  /** The month, as YYYY-MM. */
  period: string
}

/**
 * The outside owners' share of a member's result for one month: the
 * pro-rata figure from ownership, and an override in its place when the
 * agreement says otherwise (a preferred return, a waterfall). The group's
 * consolidating entries use whichever holds.
 */
const AllocationOverridePanel: FC<AllocationOverridePanelProps> = ({
  graphId,
  entityId,
  period,
}) => {
  const [share, setShare] = useState<LedgerAllocationShare | null>(null)
  const [history, setHistory] = useState<LedgerAllocationOverride[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [mode, setMode] = useState<Mode>('amount')
  const [value, setValue] = useState('')
  const [basis, setBasis] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // The member and month a load or write belongs to; a switch drops the
  // answer of one started before it.
  const scope = `${graphId}:${entityId}:${period}`
  const scopeRef = useRef(scope)
  scopeRef.current = scope

  const load = useCallback(async () => {
    const started = scope
    setLoading(true)
    setLoadError(null)
    try {
      const [found, overrides] = await Promise.all([
        clients.ledger.getAllocationShare(graphId, entityId, period),
        clients.ledger.listAllocationOverrides(graphId, entityId),
      ])
      if (scopeRef.current !== started) return
      setShare(found)
      setHistory(overrides)
    } catch (err) {
      if (scopeRef.current !== started) return
      console.error('Error loading the allocation share:', err)
      setLoadError(
        friendlyError(
          err instanceof Error ? err.message : 'Failed to load the share.'
        ).message
      )
    } finally {
      if (scopeRef.current === started) setLoading(false)
    }
  }, [graphId, entityId, period, scope])

  // A switch starts the new member or month clean: the last one's figures
  // are never shown, or acted on, under the new heading.
  useEffect(() => {
    setShare(null)
    setHistory([])
    setEditing(false)
    setSaving(false)
    setSaveError(null)
    void load()
  }, [load])

  const startEditing = () => {
    const current = share?.override
    if (current?.percentage !== null && current?.percentage !== undefined) {
      setMode('percentage')
      setValue(String(current.percentage))
    } else if (current?.amount !== null && current?.amount !== undefined) {
      setMode('amount')
      setValue((current.amount / 100).toFixed(2))
    } else {
      setMode('amount')
      setValue('')
    }
    setBasis(current?.basis ?? '')
    setSaveError(null)
    setEditing(true)
  }

  const cents = mode === 'amount' ? parseDollars(value) : null
  const pct =
    mode === 'percentage' && /^\d+(\.\d+)?$/.test(value.trim())
      ? Number(value.trim())
      : null
  const valueOk =
    mode === 'amount' ? cents !== null : pct !== null && pct <= 100
  const canSave = valueOk && basis.trim() !== '' && !saving

  const write = async (
    body: Parameters<typeof clients.ledger.setAllocationOverride>[1]
  ) => {
    const started = scope
    setSaving(true)
    setSaveError(null)
    try {
      await clients.ledger.setAllocationOverride(graphId, body)
      if (scopeRef.current !== started) return
      setEditing(false)
      await load()
    } catch (err) {
      if (scopeRef.current !== started) return
      setSaveError(
        friendlyError(
          err instanceof Error ? err.message : 'The override was not saved.'
        ).message
      )
    } finally {
      if (scopeRef.current === started) setSaving(false)
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!canSave) return
    void write({
      entity_id: entityId,
      period,
      basis: basis.trim(),
      ...(mode === 'amount' ? { amount: cents } : { percentage: pct }),
    })
  }

  const month = formatPeriod(period)
  const others = history.filter((item) => item.period !== period)

  return (
    <Card>
      <div className="flex items-center gap-2">
        <HiUserGroup className="h-5 w-5 text-gray-400" />
        <h3 className="font-heading text-lg font-semibold text-gray-900 dark:text-white">
          Outside owners&apos; share — {month}
        </h3>
      </div>

      {loadError ? (
        <Alert color="failure">
          {loadError}{' '}
          <button
            type="button"
            className="font-medium underline"
            onClick={() => void load()}
          >
            Retry
          </button>
        </Alert>
      ) : loading && !share ? (
        <Spinner size="sm" />
      ) : !share ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No outside owners&apos; share for {month}: the company was not a
          member consolidated in full that month.
        </p>
      ) : (
        <div className="space-y-3 text-sm">
          <p className="text-gray-600 dark:text-gray-300">
            Pro rata: {share.outsidePct}% of the month&apos;s result of{' '}
            {money(share.monthResult)}, {money(share.proRataAmount)}.
          </p>

          {share.override ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
              <p className="font-medium text-gray-900 dark:text-white">
                Overridden: {describeOverride(share.override)}
                {share.override.percentage !== null &&
                  share.override.percentage !== undefined &&
                  `, ${money(share.effectiveAmount)}`}
              </p>
              {share.override.basis && (
                <p className="mt-1 text-gray-600 dark:text-gray-300">
                  {share.override.basis}
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-300">
              No override: the consolidating entries use the pro-rata share.
            </p>
          )}

          {share.closed ? (
            <p className="text-gray-500 dark:text-gray-400">
              The group has closed {month}, so its share is fixed. Reopen the
              group&apos;s month on the consolidation entity to change it.
            </p>
          ) : editing ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <SegmentedControl
                options={MODES}
                value={mode}
                onChange={(next) => {
                  setMode(next)
                  setValue('')
                  setSaveError(null)
                }}
                ariaLabel="Override by"
              />
              <div>
                <Label htmlFor="allocation-value" className="mb-1 block">
                  {mode === 'amount'
                    ? "The outside owners' share ($)"
                    : "The outside owners' share (% of the month's result)"}
                </Label>
                <TextInput
                  id="allocation-value"
                  sizing="sm"
                  className="max-w-48"
                  inputMode="decimal"
                  value={value}
                  disabled={saving}
                  onChange={(e) => setValue(e.target.value)}
                />
                {mode === 'amount' && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Negative for their share of a loss.
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="allocation-basis" className="mb-1 block">
                  Basis
                </Label>
                <Textarea
                  id="allocation-basis"
                  rows={2}
                  value={basis}
                  disabled={saving}
                  placeholder="Why the share differs from ownership, e.g. the 8% preferred return under the operating agreement."
                  onChange={(e) => setBasis(e.target.value)}
                />
              </div>
              {saveError && <Alert color="failure">{saveError}</Alert>}
              <div className="flex gap-2">
                <Button type="submit" size="xs" disabled={!canSave}>
                  {saving ? 'Saving…' : 'Save override'}
                </Button>
                <Button
                  size="xs"
                  color="light"
                  disabled={saving}
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex gap-2">
              <Button size="xs" color="light" onClick={startEditing}>
                {share.override ? 'Change override' : 'Override the share'}
              </Button>
              {share.override && (
                <Button
                  size="xs"
                  color="light"
                  disabled={saving}
                  onClick={() =>
                    void write({ entity_id: entityId, period, clear: true })
                  }
                >
                  {saving ? 'Removing…' : 'Back to pro rata'}
                </Button>
              )}
            </div>
          )}

          {!editing && saveError && <Alert color="failure">{saveError}</Alert>}

          {!share.closed && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              The consolidating entries take the change when they are next
              proposed on the consolidation entity&apos;s close.
            </p>
          )}

          {others.length > 0 && (
            <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
              <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                Other months with an override
              </p>
              <ul className="space-y-1 text-gray-600 dark:text-gray-300">
                {others.map((item) => (
                  <li key={item.period}>
                    {formatPeriod(item.period)}: {describeOverride(item)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

export default AllocationOverridePanel
