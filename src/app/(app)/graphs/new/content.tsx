'use client'

import { useCreateGraphHandoff } from '@/lib/cross-app'
import { getLoginHomeName } from '@robosystems/core/auth-core/config'
import { Card, Spinner } from 'flowbite-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { HiExternalLink } from 'react-icons/hi'

/**
 * Graph creation lives on the login home, not here.
 *
 * Nothing reaches this route by clicking — the "Create Graph" affordances on
 * the home page and in the entity selector hand off directly. It survives
 * for deep links, bookmarks and stale tabs, all of which are cases where the
 * user already asked to create a graph, so forward on arrival rather than
 * asking them to confirm a destination they never chose.
 *
 * Same tab, deliberately: a `window.open` on mount has no user gesture
 * behind it and would be blocked outright.
 */
export function NewGraphContent() {
  const { openCreateGraph } = useCreateGraphHandoff()
  const [failed, setFailed] = useState(false)
  const hostAppName = getLoginHomeName()

  // Effects run twice under StrictMode in dev; the SSO exchange is a real
  // round-trip, so only let the first one through.
  const startedRef = useRef(false)

  const forward = useCallback(async () => {
    setFailed(false)
    const opened = await openCreateGraph('_self')
    if (!opened) {
      setFailed(true)
    }
  }, [openCreateGraph])

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    void forward()
  }, [forward])

  if (!failed) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <Spinner size="xl" />
        <p className="text-gray-600 dark:text-gray-400">
          Taking you to {hostAppName} to create your graph...
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="max-w-md text-center">
        <h2 className="font-heading text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Create a New Graph
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          We couldn&apos;t open graph creation just now. Graphs are created on
          the {hostAppName} platform, and yours will appear here automatically
          once it exists.
        </p>
        <button
          onClick={() => void forward()}
          className="bg-primary-700 hover:bg-primary-800 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 inline-flex w-full items-center justify-center rounded-lg px-5 py-3 text-center text-base font-medium text-white focus:ring-4 disabled:opacity-50"
        >
          <HiExternalLink className="mr-2 h-5 w-5" />
          Try again
        </button>
      </Card>
    </div>
  )
}
