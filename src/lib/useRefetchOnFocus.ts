import { useEffect, useRef } from 'react'

const DEFAULT_MIN_INTERVAL_MS = 30_000

/**
 * Re-runs `refetch` when the tab comes back into view, so a write made
 * elsewhere (an MCP chat client, another tab) shows up without a manual
 * refresh. Focus and visibility often fire together; `minIntervalMs` keeps
 * that to one reload and skips quick tab flicks.
 */
export function useRefetchOnFocus(
  refetch: () => void,
  minIntervalMs: number = DEFAULT_MIN_INTERVAL_MS
): void {
  const refetchRef = useRef(refetch)
  refetchRef.current = refetch
  const lastRun = useRef(Date.now())

  useEffect(() => {
    const maybeRefetch = () => {
      if (document.visibilityState !== 'visible') return
      const now = Date.now()
      if (now - lastRun.current < minIntervalMs) return
      lastRun.current = now
      refetchRef.current()
    }

    window.addEventListener('focus', maybeRefetch)
    document.addEventListener('visibilitychange', maybeRefetch)
    return () => {
      window.removeEventListener('focus', maybeRefetch)
      document.removeEventListener('visibilitychange', maybeRefetch)
    }
  }, [minIntervalMs])
}
