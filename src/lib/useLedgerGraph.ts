import type { GraphInfo } from '@robosystems/client'
import { GraphFilters, useGraphContext } from '@robosystems/core'
import { useMemo } from 'react'

export interface LedgerGraphResolution {
  /** The selected graph, when it is a RoboLedger graph; otherwise null. */
  graph: GraphInfo | null
  /** Every RoboLedger graph the user can reach. */
  ledgerGraphs: GraphInfo[]
  /**
   * The selector names a graph that is not a RoboLedger graph (a RoboInvestor
   * graph picked last in the other app, a shared repository). Pages show the
   * switch prompt rather than acting on some other ledger graph.
   */
  mismatch: boolean
}

/**
 * The RoboLedger graph a page is about: the selected graph, and only when it
 * is a RoboLedger graph. There is deliberately no fallback to another ledger
 * graph — the header names the selected graph, so a page that quietly used a
 * different one would read or write books the user is not looking at.
 */
export function useLedgerGraph(): LedgerGraphResolution {
  const { state } = useGraphContext()
  return useMemo(() => {
    const ledgerGraphs = state.graphs.filter(GraphFilters.roboledger)
    const graph =
      ledgerGraphs.find((g) => g.graphId === state.currentGraphId) ?? null
    const selectedIsKnown = state.graphs.some(
      (g) => g.graphId === state.currentGraphId
    )
    const mismatch =
      !graph &&
      !!state.currentGraphId &&
      selectedIsKnown &&
      ledgerGraphs.length > 0
    return { graph, ledgerGraphs, mismatch }
  }, [state.graphs, state.currentGraphId])
}
