'use client'

import { friendlyError } from '@/lib/ledger/errors'
import { formatDate, formatDollars } from '@/lib/ledger/formatters'
import { clients } from '@robosystems/core'
import {
  Alert,
  Button,
  Label,
  ModalBody,
  ModalFooter,
  Select,
  Spinner,
  TextInput,
} from '@robosystems/core/ui'
import { type FC, type FormEvent, useEffect, useMemo, useState } from 'react'

/** One line of an opening entry already recorded, in dollars. */
export interface OpeningLine {
  accountId: string
  debitAmount: number
  creditAmount: number
}

interface Account {
  id: string
  code: string | null
  name: string
  balanceType: 'debit' | 'credit'
}

const SECTIONS = [
  { classification: 'asset', title: 'Assets' },
  { classification: 'liability', title: 'Liabilities' },
  { classification: 'equity', title: 'Equity' },
] as const

type Classification = (typeof SECTIONS)[number]['classification']

/** The ISO date one day before `iso` (a `YYYY-MM-DD`), in UTC. */
export function dayBefore(iso: string): string {
  const t = new Date(`${iso}T00:00:00Z`)
  t.setUTCDate(t.getUTCDate() - 1)
  return t.toISOString().slice(0, 10)
}

/** Dollars typed by a person, or NaN; blank is 0. Commas and `$` are allowed. */
export function parseDollars(raw: string): number {
  const cleaned = raw.replace(/[$,\s]/g, '')
  if (cleaned === '' || cleaned === '-') return 0
  return /^-?\d*(\.\d{0,2})?$/.test(cleaned) ? Number(cleaned) : Number.NaN
}

/** An amount in the account's normal direction as a debit and a credit in
 *  cents; a negative amount sits on the other side. */
export function toSides(
  amount: number,
  balanceType: 'debit' | 'credit'
): { debit: number; credit: number } {
  const cents = Math.round(Math.abs(amount) * 100)
  const normal = amount >= 0
  const isDebit = balanceType === 'debit' ? normal : !normal
  return isDebit ? { debit: cents, credit: 0 } : { debit: 0, credit: cents }
}

interface OpeningBalanceFormProps {
  graphId: string
  /** A subsidiary's id, or null for the group parent. */
  entityId: string | null
  entityName: string
  /** The date the balances are as of: the eve of the first fiscal month. */
  asOf: string
  /** The opening already recorded, to replace; its lines prefill the form. */
  existing?: OpeningLine[] | null
  cancelLabel?: string
  onCancel: () => void
  onRecorded: () => void
}

/**
 * The balance sheet an entity's books start from, entered once: one amount
 * per balance-sheet account in its normal direction, any difference taken by
 * an equity account the person names. Rendered inside a Modal — it brings its
 * own body and footer.
 */
const OpeningBalanceForm: FC<OpeningBalanceFormProps> = ({
  graphId,
  entityId,
  entityName,
  asOf,
  existing = null,
  cancelLabel = 'Cancel',
  onCancel,
  onRecorded,
}) => {
  const [accounts, setAccounts] = useState<Record<Classification, Account[]>>({
    asset: [],
    liability: [],
    equity: [],
  })
  const [loading, setLoading] = useState(true)
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [equityId, setEquityId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    void (async () => {
      try {
        const lists = await Promise.all(
          SECTIONS.map(({ classification }) =>
            clients.ledger.listAccounts(graphId, {
              classification,
              isActive: true,
              limit: 500,
              entityId,
            })
          )
        )
        if (cancelled) return
        const loaded = Object.fromEntries(
          SECTIONS.map(({ classification }, i) => [
            classification,
            (lists[i]?.accounts ?? [])
              .filter((a) => !a.isPlaceholder)
              .map((a) => ({
                id: a.id,
                code: a.code ?? null,
                name: a.name ?? a.id,
                balanceType: (a.balanceType === 'credit'
                  ? 'credit'
                  : 'debit') as Account['balanceType'],
              })),
          ])
        ) as Record<Classification, Account[]>
        setAccounts(loaded)

        const byId = new Map(
          SECTIONS.flatMap(({ classification }) =>
            loaded[classification].map((a) => [a.id, a] as const)
          )
        )
        const prefill: Record<string, string> = {}
        for (const line of existing ?? []) {
          const account = byId.get(line.accountId)
          if (!account) continue
          const net =
            account.balanceType === 'debit'
              ? line.debitAmount - line.creditAmount
              : line.creditAmount - line.debitAmount
          if (net) prefill[line.accountId] = net.toFixed(2)
        }
        setAmounts(prefill)
        const openingEquity = loaded.equity.find((a) =>
          /opening balance/i.test(a.name)
        )
        setEquityId(openingEquity?.id ?? '')
      } catch (err) {
        if (cancelled) return
        console.error('Failed to load the chart for the opening balance:', err)
        setError('Failed to load the chart of accounts.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [graphId, entityId, existing])

  const all = useMemo(
    () => SECTIONS.flatMap(({ classification }) => accounts[classification]),
    [accounts]
  )

  const { lines, debits, credits, invalid } = useMemo(() => {
    let debits = 0
    let credits = 0
    let invalid = false
    const lines: {
      element_id: string
      debit_amount: number
      credit_amount: number
    }[] = []
    for (const account of all) {
      const amount = parseDollars(amounts[account.id] ?? '')
      if (Number.isNaN(amount)) {
        invalid = true
        continue
      }
      if (!amount) continue
      const { debit, credit } = toSides(amount, account.balanceType)
      debits += debit
      credits += credit
      lines.push({
        element_id: account.id,
        debit_amount: debit,
        credit_amount: credit,
      })
    }
    return { lines, debits, credits, invalid }
  }, [all, amounts])

  const difference = debits - credits
  const absorberEntered = Boolean(
    equityId && difference && lines.some((l) => l.element_id === equityId)
  )
  const absorber = accounts.equity.find((a) => a.id === equityId)
  const canSubmit =
    !loading &&
    !submitting &&
    !invalid &&
    lines.length > 0 &&
    (difference === 0 || Boolean(equityId)) &&
    !absorberEntered

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      await clients.ledger.recordOpeningBalance(graphId, {
        ...(entityId ? { entity_id: entityId } : {}),
        balances: lines,
        equity_element_id: difference ? equityId : null,
        memo: 'Opening balances',
      })
      onRecorded()
    } catch (err) {
      setError(
        friendlyError(
          err instanceof Error
            ? err.message
            : 'Failed to record the opening balance.'
        ).message
      )
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <ModalBody>
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            The balance sheet <span className="font-medium">{entityName}</span>
            &apos;s books start from, as of{' '}
            <span className="font-medium">{formatDate(asOf)}</span>. Enter each
            balance in the account&apos;s normal direction; a negative amount is
            the other side, such as an overdrawn bank account. Leave blank what
            is zero. It can be replaced until the first month closes; after
            that, a correction is an adjusting entry.
          </p>

          {existing && (
            <Alert color="warning">
              Recording this replaces the opening balance already recorded.
            </Alert>
          )}
          {error && <Alert color="failure">{error}</Alert>}

          {loading ? (
            <div className="flex justify-center py-6">
              <Spinner aria-label="Loading the chart of accounts" />
            </div>
          ) : all.length === 0 ? (
            <p className="rounded-lg border border-gray-200 p-4 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              This chart has no balance-sheet accounts yet. Set up the chart of
              accounts first.
            </p>
          ) : (
            <div className="max-h-96 space-y-4 overflow-y-auto pr-1">
              {SECTIONS.map(({ classification, title }) =>
                accounts[classification].length === 0 ? null : (
                  <fieldset key={classification} className="space-y-1">
                    <legend className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
                      {title}
                    </legend>
                    {accounts[classification].map((account) => {
                      const raw = amounts[account.id] ?? ''
                      const bad = Number.isNaN(parseDollars(raw))
                      const isAbsorber = account.id === equityId
                      return (
                        <div
                          key={account.id}
                          className="flex items-center justify-between gap-3"
                        >
                          <Label
                            htmlFor={`opening-${account.id}`}
                            className="min-w-0 truncate text-sm font-normal"
                          >
                            {account.code ? `${account.code} · ` : ''}
                            {account.name}
                          </Label>
                          <TextInput
                            id={`opening-${account.id}`}
                            sizing="sm"
                            inputMode="decimal"
                            className="w-36 shrink-0"
                            placeholder={isAbsorber ? 'the difference' : '0.00'}
                            value={raw}
                            color={bad ? 'failure' : undefined}
                            disabled={submitting}
                            onChange={(e) =>
                              setAmounts((prev) => ({
                                ...prev,
                                [account.id]: e.target.value,
                              }))
                            }
                          />
                        </div>
                      )
                    })}
                  </fieldset>
                )
              )}
            </div>
          )}

          {!loading && all.length > 0 && (
            <div
              className="space-y-3 rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800"
              data-testid="opening-balance-totals"
            >
              <div className="flex justify-between">
                <span>Debits</span>
                <span className="tabular-nums">
                  {formatDollars(debits / 100)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Credits</span>
                <span className="tabular-nums">
                  {formatDollars(credits / 100)}
                </span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Difference</span>
                <span className="tabular-nums">
                  {formatDollars(Math.abs(difference) / 100)}
                </span>
              </div>
              <div>
                <Label htmlFor="opening-equity" className="mb-1 block">
                  Equity account that takes the difference
                </Label>
                <Select
                  id="opening-equity"
                  sizing="sm"
                  value={equityId}
                  disabled={submitting}
                  onChange={(e) => setEquityId(e.target.value)}
                >
                  <option value="">None — the balances balance</option>
                  {accounts.equity.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code ? `${a.code} · ` : ''}
                      {a.name}
                    </option>
                  ))}
                </Select>
                {difference !== 0 && !equityId && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    Debits and credits differ; name the equity account that
                    takes the difference, usually Opening Balance Equity.
                  </p>
                )}
                {difference !== 0 && absorber && !absorberEntered && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {absorber.name} takes{' '}
                    {formatDollars(Math.abs(difference) / 100)} as a{' '}
                    {difference > 0 ? 'credit' : 'debit'}.
                  </p>
                )}
                {absorberEntered && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    Leave {absorber?.name} blank: it takes the difference.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button type="submit" color="blue" disabled={!canSubmit}>
          {submitting
            ? 'Recording…'
            : existing
              ? 'Replace opening balance'
              : 'Record opening balance'}
        </Button>
        <Button color="light" onClick={onCancel} disabled={submitting}>
          {cancelLabel}
        </Button>
      </ModalFooter>
    </form>
  )
}

export default OpeningBalanceForm
