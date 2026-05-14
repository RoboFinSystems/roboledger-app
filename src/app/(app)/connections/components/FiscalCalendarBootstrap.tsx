'use client'

import { clients, customTheme } from '@/lib/core'
import type { LedgerFiscalCalendar } from '@robosystems/client/clients'
import { Alert, Badge, Button } from 'flowbite-react'
import { type FC, useCallback, useEffect, useState } from 'react'
import { HiCalendar, HiExclamationCircle } from 'react-icons/hi'

interface FiscalCalendarBootstrapProps {
  graphId: string
}

/**
 * §3.0 — Calendar bootstrap on the QB connection card.
 *
 * The QB first-sync handler auto-initializes the fiscal calendar when
 * it can derive a fiscal-year start from QB company info. When the
 * derivation isn't possible (partial-history sync, no fiscal-year-end
 * configured in QB, etc.), this surface gives the operator a
 * one-click manual bootstrap path instead of blocking the entire
 * close-flow UX on a sidecar tool call.
 *
 * When the calendar is initialized, this collapses to a compact
 * status row showing closed_through / close_target.
 */
export const FiscalCalendarBootstrap: FC<FiscalCalendarBootstrapProps> = ({
  graphId,
}) => {
  const [calendar, setCalendar] = useState<
    LedgerFiscalCalendar | null | undefined
  >(undefined)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [initializing, setInitializing] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!graphId) return
    setLoadError(null)
    try {
      const cal = await clients.ledger.getFiscalCalendar(graphId)
      setCalendar(cal)
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'Failed to load fiscal calendar.'
      )
      setCalendar(null)
    }
  }, [graphId])

  useEffect(() => {
    void load()
  }, [load])

  const handleInitialize = useCallback(async () => {
    if (!graphId) return
    setInitializing(true)
    setInitError(null)
    try {
      const result = await clients.ledger.initializeLedger(graphId)
      setCalendar(result.fiscalCalendar)
    } catch (err) {
      setInitError(
        err instanceof Error
          ? err.message
          : 'Failed to initialize fiscal calendar.'
      )
    } finally {
      setInitializing(false)
    }
  }, [graphId])

  if (calendar === undefined) {
    return null // still loading; don't flash empty state
  }

  if (loadError) {
    return (
      <Alert
        theme={customTheme.alert}
        color="warning"
        icon={HiExclamationCircle}
      >
        Could not load fiscal calendar: {loadError}
      </Alert>
    )
  }

  // Initialized — show compact status.
  if (calendar) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <HiCalendar className="h-4 w-4 text-gray-400" />
        <span>Calendar:</span>
        <Badge color="success" size="xs">
          Closed through {calendar.closedThrough || '—'}
        </Badge>
        {calendar.closeTarget && (
          <Badge color="info" size="xs">
            Target: {calendar.closeTarget}
          </Badge>
        )}
      </div>
    )
  }

  // Not initialized — show bootstrap CTA.
  return (
    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-700/40 dark:bg-amber-900/20">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2">
          <HiCalendar className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
              Fiscal calendar not initialized
            </p>
            <p className="text-xs text-amber-800 dark:text-amber-200">
              The close workflow needs a calendar before it can run. Click
              Initialize to bootstrap from the latest synced data.
            </p>
          </div>
        </div>
        <Button
          theme={customTheme.button}
          color="warning"
          size="xs"
          onClick={handleInitialize}
          disabled={initializing}
        >
          {initializing ? 'Initializing...' : 'Initialize Calendar'}
        </Button>
      </div>
      {initError && (
        <Alert theme={customTheme.alert} color="failure" className="mt-2">
          {initError}
        </Alert>
      )}
    </div>
  )
}
