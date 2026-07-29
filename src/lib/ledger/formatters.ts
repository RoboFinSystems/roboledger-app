// Shared ledger formatters used across inbox, agents, and detail modals.
// All amount helpers expect cents (the wire format from the GraphQL API)
// and divide by 100 internally.

/** Matches a date-only value (no time component), e.g. "2026-01-15". */
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  // A bare YYYY-MM-DD parses as UTC midnight, so rendering it in the viewer's
  // local zone shows the previous day anywhere west of Greenwich — a
  // transaction dated the 15th displayed as the 14th in PST. Pin those to UTC
  // and leave real timestamps in local time.
  const dateOnly = DATE_ONLY.test(iso)
  return new Date(dateOnly ? `${iso}T00:00:00Z` : iso).toLocaleDateString(
    'en-US',
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...(dateOnly ? { timeZone: 'UTC' } : {}),
    }
  )
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatAmount(
  cents: number | null | undefined,
  currency: string | null | undefined
): string {
  if (cents === null || cents === undefined) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(cents / 100)
}

// Reads a JSON address blob (typed as `any` from the GraphQL schema)
// and returns a comma-joined display string. Returns `'—'` when the
// blob is missing or has no recognizable parts. Field names match the
// QuickBooks shape.
export function formatAddress(addr: unknown): string {
  if (!addr || typeof addr !== 'object') return '—'
  const a = addr as Record<string, unknown>
  const parts = [
    a.Line1,
    a.City,
    a.CountrySubDivisionCode,
    a.PostalCode,
  ].filter((x): x is string => typeof x === 'string' && x.length > 0)
  return parts.length > 0 ? parts.join(', ') : '—'
}
