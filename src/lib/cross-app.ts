'use client'

import type { CrossAppTarget } from '@robosystems/core/hooks'
import { useCrossAppLink } from '@robosystems/core/hooks'
import { useCallback } from 'react'

const API_URL =
  process.env.NEXT_PUBLIC_ROBOSYSTEMS_API_URL || 'http://localhost:8000'

/** Graph creation lives on the login home, not here. */
export const GRAPH_CREATION_PATH = '/graphs/new'

/**
 * Hand off to graph creation on the login home.
 *
 * Defaults to a new tab: creating a graph is a *detour* — you make it there
 * and come back here to use it — so this app's tab should survive the trip.
 * The `/graphs/new` route itself passes `_self`, because a page that exists
 * only to forward has no tab worth keeping, and a `window.open` on mount
 * has no user gesture behind it to survive a popup blocker anyway.
 */
export function useCreateGraphHandoff() {
  const { openLoginHome, isOpening } = useCrossAppLink(API_URL)

  const openCreateGraph = useCallback(
    (target: CrossAppTarget = '_blank') =>
      openLoginHome({ path: GRAPH_CREATION_PATH, target }),
    [openLoginHome]
  )

  return { openCreateGraph, isOpening }
}
