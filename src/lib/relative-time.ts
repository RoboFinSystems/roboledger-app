const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/**
 * Compact last-fetched label for RefreshControl. Client-side display
 * only — never a poll interval.
 */
export function formatFetchedLabel(
  fetchedAt: Date | null,
  now: Date = new Date()
): string | null {
  if (!fetchedAt) return null
  const elapsed = Math.max(0, now.getTime() - fetchedAt.getTime())
  if (elapsed < MINUTE) return 'Fetched just now'
  if (elapsed < HOUR) return `Fetched ${Math.floor(elapsed / MINUTE)}m ago`
  if (elapsed < DAY) return `Fetched ${Math.floor(elapsed / HOUR)}h ago`
  return `Fetched ${Math.floor(elapsed / DAY)}d ago`
}
