'use client'

import * as SDK from '@robosystems/client'
import { useCallback, useEffect, useState } from 'react'
import type { Entity } from '../types'

interface UseEntitiesResult {
  entities: Entity[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook to fetch entities (Company nodes) from a graph
 *
 * @param graphId - The graph ID to query
 * @param enabled - Whether to fetch entities (default: true)
 * @returns Entities, loading state, error state, and refetch function
 */
export function useEntities(
  graphId: string | null | undefined,
  enabled: boolean = true
): UseEntitiesResult {
  const [entities, setEntities] = useState<Entity[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEntities = useCallback(async () => {
    if (!graphId || !enabled) {
      setEntities([])
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Query for Entity nodes using SDK
      const response = await SDK.executeCypherQuery({
        path: { graph_id: graphId },
        query: { mode: 'sync' },
        body: {
          query: `MATCH (e:Entity)
                  RETURN
                    e.identifier as identifier,
                    e.name as name,
                    e.parent_entity_id as parentEntityId,
                    e.is_parent as isParent
                  ORDER BY COALESCE(e.name, e.identifier)`,
          parameters: {},
        },
      })

      if (response.data) {
        const data = response.data as any
        const rows = data.data || []

        const fetchedEntities: Entity[] = rows.map((row: any) => ({
          identifier: row.identifier || '',
          name: row.name || row.identifier || 'Unnamed Entity',
          parentEntityId: row.parentEntityId,
          isParent: row.isParent,
        }))

        setEntities(fetchedEntities)
      }
    } catch (err) {
      console.error('Error fetching entities:', err)
      const errorMessage =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'detail' in err
            ? String(err.detail)
            : 'Failed to fetch entities'
      setError(errorMessage)
      setEntities([])
    } finally {
      setIsLoading(false)
    }
  }, [graphId, enabled])

  useEffect(() => {
    fetchEntities()
  }, [fetchEntities])

  return {
    entities,
    isLoading,
    error,
    refetch: fetchEntities,
  }
}
