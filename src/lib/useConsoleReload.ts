import { useGraphWrites } from '@robosystems/core'
import { useCallback, useRef, useState } from 'react'

/**
 * A reload trigger for a page whose data a `/do` in the console drawer can
 * change. `reloadKey` bumps when the console writes to `graphId`; put it in
 * the loading effect's dependencies. `takeQuiet()` says whether this run of
 * the effect is such a reload, which should keep what is on screen rather
 * than swap in a spinner. `reloadQuietly()` asks for the same reload after a
 * write the page made itself.
 */
export function useConsoleReload(graphId: string | null | undefined): {
  reloadKey: number
  takeQuiet: () => boolean
  reloadQuietly: () => void
} {
  const [reloadKey, setReloadKey] = useState(0)
  const quiet = useRef(false)

  const reloadQuietly = useCallback(() => {
    quiet.current = true
    setReloadKey((k) => k + 1)
  }, [])

  useGraphWrites(graphId, reloadQuietly)

  const takeQuiet = useCallback(() => {
    const was = quiet.current
    quiet.current = false
    return was
  }, [])

  return { reloadKey, takeQuiet, reloadQuietly }
}
