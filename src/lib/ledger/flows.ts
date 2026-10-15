'use client'

import type { LedgerFlowCandidate } from '@robosystems/client/clients'
import { clients } from '@robosystems/core'
import { useEffect, useState } from 'react'

export interface FlowCandidates {
  /** The rows of this entity's cash flow statement a line may be tagged with; null while loading. */
  flows: LedgerFlowCandidate[] | null
  /** The rows could not be loaded; a prior tag is kept and shown as it is. */
  flowsFailed: boolean
}

/**
 * The cash flow rows a line may be tagged with: the leaf investing and
 * financing rows of one entity's statement. `enabled` false skips the request
 * (a closed modal).
 */
export function useFlowCandidates(
  graphId: string,
  entityId: string | null | undefined,
  enabled = true
): FlowCandidates {
  const [flows, setFlows] = useState<LedgerFlowCandidate[] | null>(null)
  const [flowsFailed, setFlowsFailed] = useState(false)

  useEffect(() => {
    if (!enabled || !graphId) return
    let cancelled = false
    setFlows(null)
    setFlowsFailed(false)
    clients.ledger
      .getFlowCandidates(graphId, { entityId: entityId ?? null })
      .then((rows) => {
        if (!cancelled) setFlows(rows)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        console.error('Error loading cash flow rows:', err)
        setFlows([])
        setFlowsFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [graphId, entityId, enabled])

  return { flows, flowsFailed }
}

/** The row's name when the statement offers it, else the qname's local part. */
export function flowDisplayName(
  qname: string,
  flows: LedgerFlowCandidate[] | null
): string {
  const match = flows?.find((flow) => flow.qname === qname)
  return match?.name ?? qname.replace(/^[^:]+:/, '')
}
