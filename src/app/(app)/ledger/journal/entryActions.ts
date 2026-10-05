/**
 * Which verbs a journal entry row offers, decided from what the list already
 * carries. The API is the authority on every one of these; this only keeps
 * the panel from offering a button the API would refuse, and says why.
 */

export interface ActionableEntry {
  status: string
  postingDate: string
  provenance: string | null
}

export interface ActionContext {
  /**
   * A QuickBooks connection is on the graph. `null` while unknown, treated
   * as connected: hiding a reversal is recoverable, diverging from
   * QuickBooks is not.
   */
  quickBooksConnected: boolean | null
  /** The fiscal calendar's `closedThrough` (`YYYY-MM`), when loaded. */
  closedThrough: string | null
}

export interface EntryActions {
  edit: boolean
  delete: boolean
  reverse: boolean
  /** Why nothing is offered, when the row has a verb in principle. */
  note?: string
}

const NONE: EntryActions = { edit: false, delete: false, reverse: false }

const AUTHORED_PROVENANCE = new Set(['manual_entry', 'ai_generated'])

/** Periods close in order, so a month on or before `closedThrough` is closed. */
export const isInClosedPeriod = (
  postingDate: string,
  closedThrough: string | null
): boolean => !!closedThrough && postingDate.slice(0, 7) <= closedThrough

export const entryActions = (
  entry: ActionableEntry,
  ctx: ActionContext
): EntryActions => {
  if (entry.status !== 'draft' && entry.status !== 'posted') return NONE

  if (isInClosedPeriod(entry.postingDate, ctx.closedThrough)) {
    return { ...NONE, note: 'In a closed period. Reopen it to change this.' }
  }

  if (entry.status === 'draft') {
    // Every draft hangs off an event, a manual one included, so provenance
    // is what separates an authored draft from one rebuilt from its source
    // (a schedule, an Inbox line), where an edit would be overwritten.
    if (!AUTHORED_PROVENANCE.has(entry.provenance ?? '')) {
      return { ...NONE, note: 'Drafted from its source. Change it there.' }
    }
    return { edit: true, delete: true, reverse: false }
  }

  // A reversal here posts in RoboLedger only, and QuickBooks would keep the
  // original: the two sets of books would stop agreeing.
  if (entry.provenance === 'source_sync' && ctx.quickBooksConnected !== false) {
    return { ...NONE, note: 'Synced from QuickBooks. Correct it there.' }
  }
  return { edit: false, delete: false, reverse: true }
}

export interface FlippableLine {
  accountId: string
  accountName: string | null
  accountCode: string | null
  debitAmount: number
  creditAmount: number
  description: string | null
}

/** The lines a reversal posts: each original line with its sides swapped. */
export const flipLines = <T extends FlippableLine>(lines: T[]): T[] =>
  lines.map((line) => ({
    ...line,
    debitAmount: line.creditAmount,
    creditAmount: line.debitAmount,
  }))
