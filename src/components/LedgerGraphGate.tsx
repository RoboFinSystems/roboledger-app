'use client'

import { useEntityScope } from '@/lib/entity-scope'
import { useLedgerGraph } from '@/lib/useLedgerGraph'
import {
  EmptyState,
  LoadingState,
  PageLayout,
  useGraphContext,
} from '@robosystems/core'
import { Button, Card } from 'flowbite-react'
import { usePathname } from 'next/navigation'
import type { PropsWithChildren } from 'react'
import { HiExclamationCircle, HiSwitchHorizontal } from 'react-icons/hi'

/**
 * Routes that do not read or write one ledger graph's books: they list every
 * ledger graph, or forward to another app, so a non-ledger selection is fine.
 */
const GRAPH_INDEPENDENT_ROUTES = [
  '/settings',
  '/graphs/new',
  '/console',
  '/search',
]

/** A report's own page names its graph in the URL (`?graph=`), not the selector. */
const REPORT_DETAIL =
  /^\/reports\/(?!new$|publish-lists$|blocked-senders$)[^/]+$/

function isGraphIndependent(pathname: string): boolean {
  return (
    REPORT_DETAIL.test(pathname) ||
    GRAPH_INDEPENDENT_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    )
  )
}

/**
 * When the selected graph is not a RoboLedger graph, a ledger page shows this
 * prompt instead of rendering against it (empty books) or against some other
 * ledger graph the header does not name. Switching is the user's choice.
 */
export function LedgerGraphGate({ children }: PropsWithChildren) {
  const pathname = usePathname() ?? ''
  const { mismatch, ledgerGraphs } = useLedgerGraph()
  const { setCurrentGraph } = useGraphContext()
  const scope = useEntityScope()

  if (isGraphIndependent(pathname)) return <>{children}</>

  if (!mismatch) {
    // The entity in scope decides whose books every ledger page reads and
    // writes. Until the selected graph's list has been read it would default
    // to the parent, and a failed read would do so silently — so the page
    // waits, and a failure says so rather than showing the wrong books.
    if (scope.error) {
      return (
        <PageLayout>
          <Card>
            <EmptyState
              icon={HiExclamationCircle}
              title="Entities could not be loaded"
              description={`${scope.error} The pages need to know which entity is selected before they read its books.`}
              action={
                <Button
                  size="sm"
                  color="light"
                  onClick={() => void scope.refresh()}
                >
                  Retry
                </Button>
              }
            />
          </Card>
        </PageLayout>
      )
    }
    if (!scope.isResolved) {
      return (
        <PageLayout>
          <LoadingState size="xl" className="py-24" />
        </PageLayout>
      )
    }
    return <>{children}</>
  }

  return (
    <PageLayout>
      <Card>
        <EmptyState
          icon={HiSwitchHorizontal}
          title="Select a RoboLedger graph"
          description="The graph selected right now is not a RoboLedger graph, so there are no books to show here. Choose one of your ledger graphs to continue."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              {ledgerGraphs.map((g) => (
                <Button
                  key={g.graphId}
                  size="sm"
                  color="light"
                  onClick={() => void setCurrentGraph(g.graphId)}
                >
                  {g.graphName || g.graphId}
                </Button>
              ))}
            </div>
          }
        />
      </Card>
    </PageLayout>
  )
}
