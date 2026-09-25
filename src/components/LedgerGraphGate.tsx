'use client'

import { useLedgerGraph } from '@/lib/useLedgerGraph'
import { EmptyState, PageLayout, useGraphContext } from '@robosystems/core'
import { Button, Card } from 'flowbite-react'
import { usePathname } from 'next/navigation'
import type { PropsWithChildren } from 'react'
import { HiSwitchHorizontal } from 'react-icons/hi'

/**
 * Routes that do not read or write one ledger graph's books: they list every
 * ledger graph, or forward to another app, so a non-ledger selection is fine.
 */
const GRAPH_INDEPENDENT_ROUTES = [
  '/entities',
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

  if (!mismatch || isGraphIndependent(pathname)) return <>{children}</>

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
