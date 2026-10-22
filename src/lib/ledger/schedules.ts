/**
 * Schedule writes over the generated SDK, and the helpers the schedule form
 * and panel share. Errors are thrown in the facade's shape
 * (`"<label> failed: <JSON>"`) so `friendlyError` reads them the same way.
 */

import type {
  CreateScheduleArm,
  PreviewScheduleResponse,
  ScheduleCreatedResponse,
  ScheduleLegRequest,
  ScheduleMechanics,
} from '@robosystems/client'
import {
  createInformationBlock,
  previewSchedule as previewScheduleOp,
  rebuildSchedule as rebuildScheduleOp,
  terminateSchedule as terminateScheduleOp,
} from '@robosystems/client'

/** A schedule's definition, as the operations take it. */
export type ScheduleDefinition = CreateScheduleArm['payload']

export type ScheduleMethod = 'straight_line' | 'custom' | 'effective_interest'

export const SCHEDULE_METHODS: readonly ScheduleMethod[] = [
  'straight_line',
  'custom',
  'effective_interest',
]

export const isScheduleMethod = (value: unknown): value is ScheduleMethod =>
  (SCHEDULE_METHODS as readonly unknown[]).includes(value)

export interface TerminatedSchedule {
  structure_id: string
  name: string
  new_end_date: string
  facts_deleted: number
  obligations_voided: number
}

export interface CreatedSchedule {
  structureId: string
  name: string
}

const failure = (label: string, error: unknown): Error =>
  new Error(`${label} failed: ${JSON.stringify(error ?? {})}`)

/** The last day of a `YYYY-MM` month, as `YYYY-MM-DD`. */
export function monthEnd(period: string): string {
  const [year, month] = period.split('-').map(Number)
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10)
}

/** The first day of a `YYYY-MM` month, as `YYYY-MM-DD`. */
export function monthStart(period: string): string {
  return `${period}-01`
}

/**
 * The `YYYY-MM` months from the start's month through the end's month,
 * inclusive. Mirrors the server's `_generate_monthly_periods`, which
 * iterates whole months regardless of day-of-month.
 */
export function monthsIn(start: string, end: string): string[] {
  const [sy, sm] = start.split('-').map(Number)
  const [ey, em] = end.split('-').map(Number)
  if (!sy || !sm || !ey || !em) return []
  const months: string[] = []
  for (let y = sy, m = sm; y < ey || (y === ey && m <= em);) {
    months.push(`${y}-${String(m).padStart(2, '0')}`)
    m += 1
    if (m > 12) {
      m = 1
      y += 1
    }
  }
  return months
}

/**
 * The last day of the month `months - 1` months after the start's month,
 * so a 12-month life starting 2026-01-15 ends 2026-12-31.
 */
export function lifeEndDate(start: string, months: number): string {
  const [sy, sm] = start.split('-').map(Number)
  if (!sy || !sm || months <= 0) return ''
  const total = sm - 1 + months - 1
  const year = sy + Math.floor(total / 12)
  const month = (total % 12) + 1
  const lastDay = new Date(year, month, 0).getDate()
  return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
}

/**
 * An even curve over `months`, in cents, the last month absorbing the
 * remainder, which is what the straight-line generator books.
 */
export function evenCurve(totalCents: number, months: number): number[] {
  if (months <= 0 || totalCents <= 0) return []
  const each = Math.floor(totalCents / months)
  const curve: number[] = new Array<number>(months).fill(each)
  curve[months - 1] = totalCents - each * (months - 1)
  return curve
}

/**
 * The schedule's generator mechanics from its envelope, or null for a
 * block that is not a schedule. The GraphQL envelope carries
 * `artifact.mechanics` as untyped JSON in the operation's own snake_case
 * shape; this narrows it.
 */
export function readScheduleMechanics(envelope: {
  artifact?: { mechanics?: unknown } | null
}): ScheduleMechanics | null {
  const mechanics = envelope.artifact?.mechanics as
    Partial<ScheduleMechanics> | null | undefined
  if (
    !mechanics ||
    mechanics.kind !== 'closing_entry_generator' ||
    !mechanics.entry_template
  ) {
    return null
  }
  return mechanics as ScheduleMechanics
}

export interface ScheduleFactsFallback {
  periodStart: string
  periodEnd: string
  /** The amount most of the months book, or null when no month has a movement. */
  monthlyAmountCents: number | null
}

/**
 * The bounds and the monthly amount read from a schedule's facts, for a
 * schedule stored before the definition rode the envelope (its mechanics
 * then carry null `period_start` / `period_end` / `monthly_amount`).
 */
export function scheduleFactsFallback(envelope: {
  facts: ReadonlyArray<{
    periodEnd: string
    periodType: string
    value: number
  }>
}): ScheduleFactsFallback | null {
  const months = new Set<string>()
  const amounts = new Map<number, number>()
  for (const fact of envelope.facts) {
    if (!fact.periodEnd) continue
    months.add(fact.periodEnd.slice(0, 7))
    if (fact.periodType === 'duration') {
      const cents = Math.round(fact.value * 100)
      amounts.set(cents, (amounts.get(cents) ?? 0) + 1)
    }
  }
  const sorted = [...months].sort()
  if (sorted.length === 0) return null
  let monthly: number | null = null
  let best = 0
  for (const [cents, count] of amounts) {
    if (
      count > best ||
      (count === best && monthly !== null && cents > monthly)
    ) {
      monthly = cents
      best = count
    }
  }
  return {
    periodStart: monthStart(sorted[0]),
    periodEnd: monthEnd(sorted[sorted.length - 1]),
    monthlyAmountCents: monthly,
  }
}

/**
 * How a loan schedule's legs settle the payment: `bank` when the schedule
 * only accrues the interest and the payment arrives on the bank feed;
 * `schedule` when the schedule books the whole payment itself.
 */
export type LoanSettlement = 'bank' | 'schedule'

export function loanSettlement(
  legs: ReadonlyArray<ScheduleLegRequest> | undefined
): LoanSettlement {
  return legs?.some((leg) => leg.amount_source === 'payment')
    ? 'schedule'
    : 'bank'
}

/** The legs a loan schedule's entry posts each period, for a settlement. */
export function loanLegs(
  settlement: LoanSettlement,
  accounts: {
    interestElementId: string
    creditElementId: string
    noteElementId: string
  }
): ScheduleLegRequest[] {
  if (settlement === 'schedule') {
    return [
      {
        element_id: accounts.noteElementId,
        side: 'debit',
        amount_source: 'principal',
      },
      {
        element_id: accounts.interestElementId,
        side: 'debit',
        amount_source: 'interest',
      },
      {
        element_id: accounts.creditElementId,
        side: 'credit',
        amount_source: 'payment',
      },
    ]
  }
  return [
    {
      element_id: accounts.interestElementId,
      side: 'debit',
      amount_source: 'interest',
    },
    {
      element_id: accounts.creditElementId,
      side: 'credit',
      amount_source: 'interest',
    },
  ]
}

/** Create a schedule; the server materializes its facts and obligations. */
export async function createSchedule(
  graphId: string,
  definition: ScheduleDefinition
): Promise<CreatedSchedule> {
  const response = await createInformationBlock({
    path: { graph_id: graphId },
    body: { block_type: 'schedule', payload: definition },
  })
  if (response.error) throw failure('Create schedule', response.error)
  const result = (
    response.data as { result?: { id?: string; name?: string } } | undefined
  )?.result
  if (!result?.id) {
    throw failure('Create schedule', {
      detail: 'The response carried no result.',
    })
  }
  return { structureId: result.id, name: result.name ?? definition.name }
}

/**
 * Generate a schedule from its definition without keeping it: the envelope
 * create would leave, the roll-forward, the overlap warnings, and with
 * `replacesStructureId` what the schedule being edited has posted.
 */
export async function previewSchedule(
  graphId: string,
  definition: ScheduleDefinition,
  replacesStructureId?: string | null
): Promise<PreviewScheduleResponse> {
  const response = await previewScheduleOp({
    path: { graph_id: graphId },
    body: {
      ...definition,
      replaces_structure_id: replacesStructureId ?? undefined,
    },
  })
  if (response.error) throw failure('Preview schedule', response.error)
  const result = (
    response.data as { result?: PreviewScheduleResponse } | undefined
  )?.result
  if (!result) {
    throw failure('Preview schedule', {
      detail: 'The response carried no result.',
    })
  }
  return result
}

/** The definition fields a rebuild replaces; omitted ones keep their stored values. */
export type ScheduleEdit = Partial<
  Pick<
    ScheduleDefinition,
    | 'period_start'
    | 'period_end'
    | 'monthly_amount'
    | 'entry_template'
    | 'schedule_metadata'
  >
>

/**
 * Save an edited definition: regenerates the schedule in place. Refused
 * once one of its entries has posted.
 */
export async function rebuildSchedule(
  graphId: string,
  structureId: string,
  edit: ScheduleEdit
): Promise<ScheduleCreatedResponse> {
  const response = await rebuildScheduleOp({
    path: { graph_id: graphId },
    body: { structure_id: structureId, ...edit },
  })
  if (response.error) throw failure('Rebuild schedule', response.error)
  const result = (
    response.data as { result?: ScheduleCreatedResponse } | undefined
  )?.result
  if (!result) {
    throw failure('Rebuild schedule', {
      detail: 'The response carried no result.',
    })
  }
  return result
}

/**
 * End a schedule at a month-end without booking an entry: its months after
 * `newEndDate` lose their facts and pending obligations. Refused when an
 * entry has already posted after it.
 */
export async function terminateSchedule(
  graphId: string,
  structureId: string,
  newEndDate: string,
  reason: string
): Promise<TerminatedSchedule> {
  const response = await terminateScheduleOp({
    path: { graph_id: graphId },
    body: { structure_id: structureId, new_end_date: newEndDate, reason },
  })
  if (response.error) throw failure('Terminate schedule', response.error)
  const result = (response.data as { result?: TerminatedSchedule } | undefined)
    ?.result
  if (!result) {
    throw failure('Terminate schedule', {
      detail: 'The response carried no result.',
    })
  }
  return result
}
