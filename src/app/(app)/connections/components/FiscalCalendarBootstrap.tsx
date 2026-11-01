'use client'

import FiscalCalendarSetupModal from '@/components/FiscalCalendarSetupModal'
import { friendlyError } from '@/lib/ledger/errors'
import type { LedgerFiscalCalendar } from '@robosystems/client/clients'
import { clients } from '@robosystems/core'
import { Alert, Badge, Button } from '@robosystems/core/ui'
import { type FC, useCallback, useEffect, useState } from 'react'
import { HiCalendar, HiExclamationCircle } from 'react-icons/hi'

interface FiscalCalendarBootstrapProps {
  graphId: string
  /** The entity whose calendar this is; null for the group parent. */
  entityId: string | null
  entityName: string
  /** Name the entity, when a card reports more than one calendar. */
  showName?: boolean
  /** Offer the opening balance sheet after setup; off for a QuickBooks
   *  import, whose books arrive with their history. */
  offerOpeningBalance?: boolean
}

// §3.0 — Calendar bootstrap fallback for a connection card when the
// first-sync auto-init couldn't derive a fiscal-year start, for one entity
// the connection keeps books for.
export const FiscalCalendarBootstrap: FC<FiscalCalendarBootstrapProps> = ({
  graphId,
  entityId,
  entityName,
  showName = false,
  offerOpeningBalance = true,
}) => {
  const [calendar, setCalendar] = useState<
    LedgerFiscalCalendar | null | undefined
  >(undefined)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [setupOpen, setSetupOpen] = useState(false)
  const load = useCallback(async () => {
    if (!graphId) return
    setLoadError(null)
    try {
      const cal = await clients.ledger.getFiscalCalendar(graphId, { entityId })
      setCalendar(cal)
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? friendlyError(err.message).message
          : 'Failed to load fiscal calendar.'
      )
      setCalendar(null)
    }
  }, [graphId, entityId])

  useEffect(() => {
    void load()
  }, [load])

  if (calendar === undefined) {
    return null // still loading; don't flash empty state
  }

  if (loadError) {
    return (
      <Alert color="warning" icon={HiExclamationCircle}>
        Could not load fiscal calendar: {loadError}
      </Alert>
    )
  }

  // Initialized — show compact status.
  if (calendar) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <HiCalendar className="h-4 w-4 text-gray-400" />
        <span>{showName ? `${entityName} calendar:` : 'Calendar:'}</span>
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
              {showName
                ? `${entityName}'s fiscal calendar not initialized`
                : 'Fiscal calendar not initialized'}
            </p>
            <p className="text-xs text-amber-800 dark:text-amber-200">
              The close needs a calendar before it can run. Set where the books
              start.
            </p>
          </div>
        </div>
        <Button color="warning" size="xs" onClick={() => setSetupOpen(true)}>
          Set up calendar
        </Button>
      </div>
      <FiscalCalendarSetupModal
        graphId={graphId}
        entityId={entityId}
        entityName={entityName}
        open={setupOpen}
        offerOpeningBalance={offerOpeningBalance}
        onClose={() => setSetupOpen(false)}
        onInitialized={(cal) => {
          setSetupOpen(false)
          setCalendar(cal)
        }}
      />
    </div>
  )
}
