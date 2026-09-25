/**
 * Shared error mapping for ledger write surfaces.
 *
 * The SDK's facade methods throw `Error("<label> failed: <JSON>")`, where the
 * JSON is FastAPI's error body — so `err.message` carries a raw
 * `{"detail":"…"}` blob that must never reach a user. `extractDetail` unwraps
 * it; `friendlyError` turns the error classes we know about into something
 * actionable.
 *
 * Promoted here from `ledger/inbox/EventBlockDetailModal.tsx` when the
 * cross-graph share controls landed — that modal owned the only copy, and the
 * share surfaces need the same mapping. New write surfaces should import from
 * here rather than re-deriving a local one.
 */

export interface FriendlyError {
  message: string
  link?: { href: string; label: string }
}

/** Index of the first `{` or `[`, or -1 when the string carries no JSON. */
const firstJsonIndex = (raw: string): number => {
  const brace = raw.indexOf('{')
  const bracket = raw.indexOf('[')
  if (brace === -1) return bracket
  if (bracket === -1) return brace
  return Math.min(brace, bracket)
}

const joinValidationMessages = (items: unknown[]): string | null => {
  const messages = items
    .map((item) =>
      typeof item === 'object' && item !== null && 'msg' in item
        ? String((item as { msg: unknown }).msg)
        : null
    )
    .filter((m): m is string => Boolean(m))
  return messages.length > 0 ? messages.join('; ') : null
}

/**
 * Pull FastAPI's `detail` out of the SDK's stringified error envelope.
 *
 * Falls back to the original string whenever the shape isn't recognized — a
 * slightly noisy message beats swallowing the only diagnostic we have.
 */
export const extractDetail = (raw: string): string => {
  const start = firstJsonIndex(raw)
  if (start === -1) return raw

  let parsed: unknown
  try {
    parsed = JSON.parse(raw.slice(start))
  } catch {
    return raw
  }

  if (typeof parsed === 'string') return parsed
  if (Array.isArray(parsed)) return joinValidationMessages(parsed) ?? raw

  if (typeof parsed === 'object' && parsed !== null && 'detail' in parsed) {
    const detail = (parsed as { detail: unknown }).detail
    if (typeof detail === 'string') return detail
    // 422 validation errors arrive as a list of {loc, msg, type}.
    if (Array.isArray(detail)) return joinValidationMessages(detail) ?? raw
    // Some routers nest it: `{"detail": {"detail": "…", "code": "…"}}`.
    if (typeof detail === 'object' && detail !== null) {
      const inner = (detail as { detail?: unknown }).detail
      if (typeof inner === 'string') return inner
    }
  }

  return raw
}

/**
 * Map a thrown SDK error message into user-facing copy.
 *
 * Accepts the raw `err.message`; unwrapping is handled internally so call
 * sites stay a single `friendlyError(err.message)`.
 */
export const friendlyError = (raw: string): FriendlyError => {
  const detail = extractDetail(raw)
  const lower = detail.toLowerCase()

  // 409 RowLockedError: a sync or sweep holds the rows this write needs.
  // Retryable, and not the user's mistake.
  if (lower.includes('being written by another process')) {
    return {
      message:
        'Another process (usually a running sync) is writing this right now. Wait a moment and try again.',
    }
  }

  if (lower.includes('closed period')) {
    return {
      message:
        detail +
        " Reopen it from the close page or change the event's posting_date.",
      link: { href: '/ledger/close', label: 'Open close page' },
    }
  }

  // The event names a QuickBooks account the ledger has no element for yet
  // (the backend's ElementResolutionError, classified `element_unmapped`).
  // The fix is a sync that brings the account in, not a reporting mapping.
  if (
    lower.includes('element') &&
    (lower.includes('unmapped') ||
      lower.includes('resolve') ||
      lower.includes('not found'))
  ) {
    return {
      message:
        "Some accounts in this event aren't in RoboLedger's chart of accounts yet. Sync the connection they came from, then try again.",
      link: { href: '/connections', label: 'Open Connections' },
    }
  }

  // --- Chart of accounts -----------------------------------------------

  // initialize-chart-of-accounts is one-time: the 409 means a chart exists
  // (QuickBooks-synced, authored, or already initialized) and the page just
  // has not loaded it.
  if (lower.includes('already has a chart of accounts')) {
    return {
      message:
        'This graph already has a chart of accounts, so nothing was created. Reload the page to see it; customize it from here rather than starting over.',
    }
  }

  // --- Cross-graph share controls -------------------------------------

  if (lower.includes('cannot block itself')) {
    return {
      message:
        "A graph can't block itself. This report shows your own graph as its sender, which usually means it wasn't shared in from elsewhere.",
    }
  }

  // Two distinct admin-only halves: purging what already landed, and
  // re-opening a channel. The backend copy is already user-facing, so keep it
  // and just drop the backticks it quotes `purge` with.
  if (lower.includes('requires the graph admin role')) {
    return { message: detail.replace(/`/g, '') }
  }

  if (lower.includes('is not blocked')) {
    return {
      message:
        "That sender isn't on the block list — someone may have lifted the block already.",
      link: { href: '/reports/blocked-senders', label: 'View blocked senders' },
    }
  }

  if (lower.includes('no active share of report')) {
    return {
      message:
        'This report was never shared to that recipient, or the share has already been revoked.',
    }
  }

  if (lower.includes('not authorized to revoke')) {
    return {
      message:
        "You don't have permission to revoke shares of this report. Only the person who shared it or a graph admin can.",
    }
  }

  if (lower.includes('not authorized to delete')) {
    return {
      message:
        "You don't have permission to delete this report. Removing a copy shared in from another graph requires the graph admin role.",
    }
  }

  return { message: detail }
}

/**
 * User-facing copy for a failed call. An `ApiError` (what core's `unwrapSdk`
 * throws) carries the server's refusal as `detail`, which is mapped through
 * `friendlyError`; anything else — a network failure, a thrown TypeError —
 * gets the caller's fallback, never a raw message.
 *
 * Duck-typed rather than `isApiError` so this module stays free of a core
 * import (it is imported by surfaces whose tests mock core wholesale).
 */
export const apiErrorMessage = (err: unknown, fallback: string): string => {
  const api = err as { status?: unknown; detail?: unknown } | null
  if (
    err instanceof Error &&
    typeof api?.status === 'number' &&
    api.status > 0
  ) {
    const detail = api.detail
    // core's placeholder when the body carried no detail says nothing useful.
    if (
      typeof detail === 'string' &&
      detail &&
      !detail.startsWith('Request failed with status')
    ) {
      return friendlyError(detail).message
    }
  }
  return fallback
}
