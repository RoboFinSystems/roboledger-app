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

/**
 * How QuickBooks relates to this ledger. `synced`: a connection syncs down
 * and RoboLedger writes nothing back. `writeback`: close also publishes
 * RoboLedger's own entries to QuickBooks (`qb_authoritative` / `hybrid`).
 */
export type QuickBooksMode = 'none' | 'synced' | 'writeback'

const WRITEBACK_POLICIES = new Set(['qb_authoritative', 'hybrid'])

/**
 * The mode the graph's connections put the ledger in. Any listed QuickBooks
 * connection counts, whatever its sync status: a disconnect soft-deletes it
 * out of the list, while one in error or awaiting re-auth is still the books
 * of record. The API's own provider check reads connections the same way.
 */
export const quickBooksMode = (
  connections: { provider?: string | null; write_policy?: string | null }[]
): QuickBooksMode => {
  const quickBooks = connections.filter(
    (c) => c.provider?.toLowerCase() === 'quickbooks'
  )
  if (quickBooks.some((c) => WRITEBACK_POLICIES.has(c.write_policy ?? '')))
    return 'writeback'
  return quickBooks.length > 0 ? 'synced' : 'none'
}

export interface ActionContext {
  /** `null` while unknown. */
  quickBooks: QuickBooksMode | null
  /** The fiscal calendar's `closedThrough` (`YYYY-MM`); `null` when none. */
  closedThrough: string | null
  calendarLoaded: boolean
  /** Loading either of the above failed, so it will not arrive. */
  contextFailed?: boolean
}

export interface EntryActions {
  edit: boolean
  delete: boolean
  reverse: boolean
  /** Why nothing is offered, when the row has a verb in principle. */
  note?: string
}

const NONE: EntryActions = { edit: false, delete: false, reverse: false }

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
    if (entry.provenance !== 'manual_entry') {
      return { ...NONE, note: 'Drafted from its source. Change it there.' }
    }
    return { edit: true, delete: true, reverse: false }
  }

  // A reversal posts in RoboLedger only. Whatever QuickBooks also holds
  // (what it synced down, or what close published to it) would keep the
  // original, and the two sets of books would stop agreeing. Until both are
  // known nothing is offered: the preview checks the reversal's date, not
  // the original's.
  if (ctx.quickBooks === null || !ctx.calendarLoaded) {
    return ctx.contextFailed
      ? { ...NONE, note: 'Could not check this ledger. Reload to reverse.' }
      : NONE
  }
  if (ctx.quickBooks === 'writeback') {
    return { ...NONE, note: 'QuickBooks keeps these books. Reverse it there.' }
  }
  if (ctx.quickBooks === 'synced' && entry.provenance === 'source_sync') {
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
