/**
 * Links into the account register, from any surface that shows an account or
 * a figure an account was summed into.
 */

export interface RegisterLink {
  accountId: string
  /** The entity whose books hold the lines; omitted, the selected entity. */
  entityId?: string | null
  start?: string | null
  end?: string | null
  /** A management dimension slice: the axis and one member, or `unallocated`. */
  dimension?: { type: string; memberId: string } | null
}

export function registerHref(link: RegisterLink): string {
  const params = new URLSearchParams({ accountId: link.accountId })
  if (link.entityId) params.set('entityId', link.entityId)
  if (link.start) params.set('start', link.start)
  if (link.end) params.set('end', link.end)
  if (link.dimension) {
    params.set('dimensionType', link.dimension.type)
    params.set('dimensionMemberId', link.dimension.memberId)
  }
  return `/ledger/account-register?${params.toString()}`
}

const isoDay = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`

/** The month holding `now`, from its first day to `now`. */
export function monthToDate(now: Date): { start: string; end: string } {
  return {
    start: isoDay(new Date(now.getFullYear(), now.getMonth(), 1)),
    end: isoDay(now),
  }
}
