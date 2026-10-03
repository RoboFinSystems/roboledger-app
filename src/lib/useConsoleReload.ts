import { useGraphWrites } from '@robosystems/core'
import { useCallback, useRef, useState } from 'react'

/**
 * A reload trigger for a page whose data a `/do` in the console drawer can
 * change. `reloadKey` bumps when the console writes to `graphId`; put it in
 * the loading effect's dependencies. `takeQuiet()` says whether this run of
 * the effect is such a reload, which should keep what is on screen rather
 * than swap in a spinner.
 */
export function useConsoleReload(graphId: string | null | undefined): {
  reloadKey: number
  takeQuiet: () => boolean
} {
  const [reloadKey, setReloadKey] = useState(0)
  const quiet = useRef(false)

  useGraphWrites(graphId, () => {
    quiet.current = true
    setReloadKey((k) => k + 1)
  })

  const takeQuiet = useCallback(() => {
    const was = quiet.current
    quiet.current = false
    return was
  }, [])

  return { reloadKey, takeQuiet }
}
