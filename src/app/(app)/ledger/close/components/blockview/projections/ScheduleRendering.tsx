'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'flowbite-react'
import type { FC } from 'react'
import { useMemo } from 'react'
import { formatCurrencyDollars, formatMonth } from '../../../utils'
import type { EnvelopeBlock, EnvelopeFact } from '../types'

interface ScheduleRenderingProjectionProps {
  envelope: EnvelopeBlock
}

/** One reconstructed roll-forward row: Beginning + Movement = Ending. */
interface RollForwardRow {
  periodStart: string | null
  periodEnd: string
  beginning: number | null
  movement: number | null
  ending: number
}

/**
 * Charlie's `Rendering` View projection — schedule variant.
 *
 * Schedules don't have a server-computed `view.rendering` (they're not
 * roll-up molecules); instead this component reconstructs the
 * roll-forward from `envelope.facts`:
 *
 *   - `instant` facts on the running-balance element are the period
 *     balances (Beginning / Ending), plus one carry-in opening balance
 *     (the prior closed period's ending balance — see the backend
 *     `build_envelope` carry-in logic).
 *   - `duration` facts on the movement element are the period movements
 *     (amortization / depreciation / accretion).
 *
 * Each period reads Beginning Balance → Movement → Ending Balance, so
 * the schedule ties out arithmetically rather than presenting a flat
 * dump of facts. When the opening balance is missing (e.g. a schedule
 * viewed before the carry-in fix reaches the API), the first row's
 * Beginning degrades to "—" rather than breaking the render.
 *
 * Read-only: closing entries are created on the period-close page
 * (Current Period Status), which is sequence-aware and guards against
 * already-closed / not-yet-due periods.
 */
const ScheduleRenderingProjection: FC<ScheduleRenderingProjectionProps> = ({
  envelope,
}) => {
  const model = useMemo(() => buildRollForward(envelope), [envelope])

  if (envelope.facts.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500 dark:text-gray-400">
        No facts found for this schedule.
      </div>
    )
  }

  const { rows, balanceName, movementName, opening, closing } = model

  return (
    <div>
      <div className="border-b border-gray-200 py-4 text-center dark:border-gray-700">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {envelope.name}
        </p>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          {balanceName ? `${balanceName} roll-forward · ` : ''}
          {rows.length} {rows.length === 1 ? 'period' : 'periods'}
        </p>
      </div>

      {/* Opening → Closing summary strip. */}
      {(opening !== null || closing !== null) && (
        <div className="flex items-stretch justify-center gap-4 border-b border-gray-200 bg-gray-50 py-3 text-center dark:border-gray-700 dark:bg-gray-800/40">
          <SummaryStat label="Opening Balance" value={opening} />
          <div className="w-px bg-gray-200 dark:bg-gray-700" />
          <SummaryStat
            label="Net Change"
            value={
              opening !== null && closing !== null ? closing - opening : null
            }
          />
          <div className="w-px bg-gray-200 dark:bg-gray-700" />
          <SummaryStat label="Closing Balance" value={closing} emphasize />
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHead>
            <TableHeadCell>Period</TableHeadCell>
            <TableHeadCell className="text-right">Beginning</TableHeadCell>
            <TableHeadCell className="text-right">
              {movementName ?? 'Movement'}
            </TableHeadCell>
            <TableHeadCell className="text-right">Ending</TableHeadCell>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={`${row.periodStart ?? ''}_${row.periodEnd}`}>
                <TableCell className="font-medium text-gray-900 dark:text-white">
                  {formatMonth(row.periodStart ?? row.periodEnd)}
                </TableCell>
                <BalanceCell value={row.beginning} muted />
                <MovementCell value={row.movement} />
                <BalanceCell value={row.ending} />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// ── Cells ────────────────────────────────────────────────────────────

const BalanceCell: FC<{ value: number | null; muted?: boolean }> = ({
  value,
  muted,
}) => (
  <TableCell
    className={`text-right font-mono ${
      muted
        ? 'text-gray-500 dark:text-gray-400'
        : 'text-gray-900 dark:text-white'
    }`}
  >
    {value !== null ? formatCurrencyDollars(value) : '—'}
  </TableCell>
)

const MovementCell: FC<{ value: number | null }> = ({ value }) => (
  <TableCell
    className={`text-right font-mono ${
      value !== null && value < 0
        ? 'text-red-500 dark:text-red-400'
        : 'text-gray-700 dark:text-gray-300'
    }`}
  >
    {value !== null ? formatCurrencyDollars(value) : '—'}
  </TableCell>
)

const SummaryStat: FC<{
  label: string
  value: number | null
  emphasize?: boolean
}> = ({ label, value, emphasize }) => (
  <div className="px-2">
    <p className="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">
      {label}
    </p>
    <p
      className={`mt-0.5 font-mono text-sm ${
        emphasize
          ? 'font-semibold text-gray-900 dark:text-white'
          : 'text-gray-700 dark:text-gray-300'
      } ${value !== null && value < 0 ? 'text-red-500 dark:text-red-400' : ''}`}
    >
      {value !== null ? formatCurrencyDollars(value) : '—'}
    </p>
  </div>
)

// ── Roll-forward reconstruction ──────────────────────────────────────

interface RollForwardModel {
  rows: RollForwardRow[]
  balanceName: string | null
  movementName: string | null
  opening: number | null
  closing: number | null
}

/**
 * Reconstruct a Beginning → Movement → Ending roll-forward from the flat
 * fact list. `instant` facts on the running-balance element carry the
 * period balances (one carry-in opening + one per period); `duration`
 * facts on the movement element name the driver and define the periods.
 *
 * The signed movement is derived as `ending - beginning` so each row
 * ties by construction; its magnitude equals the period's duration fact.
 */
function buildRollForward(envelope: EnvelopeBlock): RollForwardModel {
  const elementsById = new Map(envelope.elements.map((e) => [e.id, e]))
  const instants = envelope.facts.filter((f) => f.periodType === 'instant')
  const movements = envelope.facts.filter((f) => f.periodType === 'duration')

  // Primary running-balance element: the instant element with the most
  // facts (the credit/running-balance series; ties broken deterministically
  // by element id so the choice is stable across renders).
  const balanceElementId = pickDominantElement(instants)
  const movementElementId = pickDominantElement(movements)
  const balanceName = balanceElementId
    ? (elementsById.get(balanceElementId)?.name ?? null)
    : null
  const movementName = movementElementId
    ? (elementsById.get(movementElementId)?.name ?? null)
    : null

  // Balance timeline for the primary element, oldest first. The earliest
  // instant is the opening balance; each later one is a period ending.
  const balances = instants
    .filter((f) => f.elementId === balanceElementId)
    .sort(byPeriodEnd)

  const balanceByEnd = new Map(balances.map((f) => [f.periodEnd, f.value]))

  // Drive rows off the movement periods so every period surfaces even if
  // its opening balance is absent. Fall back to the balance instants when
  // there are no movement facts at all.
  const periods = (movements.length > 0 ? movements : balances)
    .slice()
    .sort(byPeriodEnd)

  const rows: RollForwardRow[] = []
  for (const period of periods) {
    const ending = balanceByEnd.get(period.periodEnd)
    if (ending === undefined) continue
    const beginning = precedingBalance(balances, period.periodEnd)
    rows.push({
      periodStart: period.periodStart,
      periodEnd: period.periodEnd,
      beginning,
      movement: beginning !== null ? round2(ending - beginning) : null,
      ending,
    })
  }

  return {
    rows,
    balanceName,
    movementName,
    opening: rows.length > 0 ? rows[0].beginning : null,
    closing: rows.length > 0 ? rows[rows.length - 1].ending : null,
  }
}

/** The most-recent balance strictly before `periodEnd`, or null. */
function precedingBalance(
  balances: EnvelopeFact[],
  periodEnd: string
): number | null {
  let prior: number | null = null
  for (const b of balances) {
    if (b.periodEnd < periodEnd) prior = b.value
    else break
  }
  return prior
}

/** Element id contributing the most facts in `facts` (stable tiebreak). */
function pickDominantElement(facts: EnvelopeFact[]): string | null {
  const counts = new Map<string, number>()
  for (const f of facts)
    counts.set(f.elementId, (counts.get(f.elementId) ?? 0) + 1)
  let best: string | null = null
  let bestCount = -1
  for (const [id, count] of counts) {
    if (
      count > bestCount ||
      (count === bestCount && best !== null && id < best)
    ) {
      best = id
      bestCount = count
    }
  }
  return best
}

const byPeriodEnd = (a: EnvelopeFact, b: EnvelopeFact): number =>
  a.periodEnd < b.periodEnd ? -1 : a.periodEnd > b.periodEnd ? 1 : 0

const round2 = (n: number): number => Math.round(n * 100) / 100

export default ScheduleRenderingProjection
