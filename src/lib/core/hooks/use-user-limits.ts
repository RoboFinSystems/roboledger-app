'use client'

import type { OrgLimitsResponse } from '@robosystems/client'
import * as SDK from '@robosystems/client'
import { useCallback, useEffect, useState } from 'react'
import { useOrg } from '../contexts/org-context'
import type { UserGraphsResponse } from '../ui-components/types'

interface UseOrgLimitsReturn {
  limits: OrgLimitsResponse | null
  isLoading: boolean
  error: string | null
  canCreateGraph: boolean
  remainingGraphs: number
  refetch: () => Promise<void>
}

export function useOrgLimits(): UseOrgLimitsReturn {
  const [limits, setLimits] = useState<OrgLimitsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentGraphCount, setCurrentGraphCount] = useState(0)
  const { currentOrg } = useOrg()

  const fetchLimits = useCallback(async () => {
    if (!currentOrg?.id) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Fetch org limits and graphs in parallel
      const [limitsResponse, graphsResponse] = await Promise.allSettled([
        SDK.getOrgLimits({ path: { org_id: currentOrg.id } }),
        SDK.getGraphs(),
      ])

      // Process org limits
      if (limitsResponse.status === 'fulfilled' && limitsResponse.value.data) {
        setLimits(limitsResponse.value.data as OrgLimitsResponse)
      } else {
        setLimits(null)
      }

      // Process graphs to count user graphs (not repositories)
      if (graphsResponse.status === 'fulfilled' && graphsResponse.value.data) {
        const graphsData = graphsResponse.value.data as UserGraphsResponse
        const graphs = graphsData.graphs || []
        // Only count user graphs, not shared repositories
        const userGraphs = graphs.filter((g) => !(g as any).isRepository)
        setCurrentGraphCount(userGraphs.length)
      }
    } catch (err) {
      // Use structured logging instead of console.error for production
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch org limits:', err)
      }
      setError('Failed to fetch org limits')
    } finally {
      setIsLoading(false)
    }
  }, [currentOrg?.id])

  // Fetch limits on mount
  useEffect(() => {
    fetchLimits()
  }, [fetchLimits])

  // Calculate derived values
  // Use the can_create_graph field directly from the API response
  // The backend calculates this based on org limits
  const canCreateGraph = limits?.can_create_graph ?? true
  const remainingGraphs = limits
    ? Math.max(0, limits.max_graphs - currentGraphCount)
    : 999 // Show high number when limits unavailable

  return {
    limits,
    isLoading,
    error,
    canCreateGraph,
    remainingGraphs,
    refetch: fetchLimits,
  }
}

// Backward compatibility export
export const useUserLimits = useOrgLimits
