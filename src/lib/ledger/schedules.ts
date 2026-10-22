/**
 * Schedule writes the facade does not carry. Errors are thrown in the
 * facade's shape (`"<label> failed: <JSON>"`) so `friendlyError` reads them
 * the same way.
 */

import { terminateSchedule as terminateScheduleOp } from '@robosystems/client'

export interface TerminatedSchedule {
  structure_id: string
  name: string
  new_end_date: string
  facts_deleted: number
  obligations_voided: number
}

const failure = (label: string, error: unknown): Error =>
  new Error(`${label} failed: ${JSON.stringify(error ?? {})}`)

/** The last day of a `YYYY-MM` month, as `YYYY-MM-DD`. */
export function monthEnd(period: string): string {
  const [year, month] = period.split('-').map(Number)
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10)
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
