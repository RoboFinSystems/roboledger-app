'use client'

import type { Entity } from '@/lib/core'
import { GraphFilters, useEntity, useGraphContext } from '@/lib/core'
import { useSSO } from '@/lib/core/auth-core/sso'
import * as SDK from '@robosystems/client'
import { useEffect, useMemo, useState } from 'react'
import { HiChevronDown, HiOfficeBuilding } from 'react-icons/hi'

const API_URL =
  process.env.NEXT_PUBLIC_ROBOSYSTEMS_API_URL || 'http://localhost:8000'

/**
 * EntitySelectorDropdown for RoboLedger
 *
 * Loads the parent entity for each roboledger graph via the ledger entity API.
 * Selecting an entity switches to its graph.
 */
export function EntitySelectorDropdown() {
  const { state: graphState, setCurrentGraph } = useGraphContext()
  const { currentEntity, setCurrentEntity } = useEntity()
  const { navigateToApp } = useSSO(API_URL)
  const [isOpen, setIsOpen] = useState(false)
  const [entitiesByGraph, setEntitiesByGraph] = useState<Map<string, Entity>>(
    new Map()
  )
  const [isLoading, setIsLoading] = useState(false)

  // Filter to only roboledger graphs
  const roboledgerGraphs = useMemo(
    () => graphState.graphs.filter(GraphFilters.roboledger),
    [graphState.graphs]
  )

  // Load parent entity for each roboledger graph
  // Only re-fetch when the graph list itself changes, not on entity/graph selection
  useEffect(() => {
    const loadEntities = async () => {
      setIsLoading(true)
      const results = await Promise.allSettled(
        roboledgerGraphs.map((graph) =>
          SDK.getLedgerEntity({ path: { graph_id: graph.graphId } }).then(
            (response) => ({ graph, response })
          )
        )
      )

      const entityMap = new Map<string, Entity>()
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.response.data) {
          const { graph, response } = result.value
          const data = response.data as any
          entityMap.set(graph.graphId, {
            identifier: data.id || data.uri || '',
            name: data.name || 'Unnamed Entity',
            parentEntityId: data.parent_entity_id,
            isParent: data.is_parent,
          })
        } else if (result.status === 'rejected') {
          console.error('Failed to load entity:', result.reason)
        }
      }

      setEntitiesByGraph(entityMap)
      setIsLoading(false)
    }

    if (roboledgerGraphs.length > 0) {
      loadEntities()
    }
  }, [roboledgerGraphs])

  // Sync entity selection with current graph
  // Runs when entities finish loading, graph changes, or entity is cleared
  useEffect(() => {
    if (isLoading || entitiesByGraph.size === 0) return

    if (currentEntity) {
      // Validate current entity still exists in loaded data
      const entityStillValid = Array.from(entitiesByGraph.values()).some(
        (e) => e.identifier === currentEntity.identifier
      )
      if (!entityStillValid) {
        // Stale entity — clear and auto-select for current graph
        const entity = graphState.currentGraphId
          ? entitiesByGraph.get(graphState.currentGraphId)
          : undefined
        setCurrentEntity(entity ?? null)
      }
    } else if (graphState.currentGraphId) {
      // No entity selected — auto-select for current graph
      const entity = entitiesByGraph.get(graphState.currentGraphId)
      if (entity) {
        setCurrentEntity(entity)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally omit currentEntity to avoid re-triggering after setting it
  }, [isLoading, entitiesByGraph, graphState.currentGraphId, setCurrentEntity])

  const handleEntitySelect = async (entity: Entity, graphId: string) => {
    setIsOpen(false)

    if (graphId !== graphState.currentGraphId) {
      await setCurrentGraph(graphId)
    }

    setCurrentEntity(entity)
  }

  const totalEntities = entitiesByGraph.size
  const hasNoGraphs = roboledgerGraphs.length === 0
  const hasNoEntities = !isLoading && totalEntities === 0

  // If no graphs, link to platform to create one
  if (hasNoGraphs) {
    return (
      <button
        onClick={() => navigateToApp('robosystems', '/graphs/new')}
        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
      >
        <HiOfficeBuilding className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <span className="font-medium text-gray-900 dark:text-gray-100">
          Create Graph
        </span>
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => !hasNoEntities && setIsOpen(!isOpen)}
        disabled={hasNoEntities}
        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:disabled:hover:bg-gray-700"
      >
        <HiOfficeBuilding className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {currentEntity?.name || 'Select Entity'}
        </span>
        <HiChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setIsOpen(false)
            }}
            role="button"
            tabIndex={0}
            aria-label="Close entity selector"
          />

          {/* Dropdown */}
          <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  Loading entities...
                </div>
              ) : (
                <>
                  {/* Entity list — one per graph */}
                  {roboledgerGraphs.map((graph) => {
                    const entity = entitiesByGraph.get(graph.graphId)
                    if (!entity) return null

                    const isSelected =
                      currentEntity?.identifier === entity.identifier &&
                      graphState.currentGraphId === graph.graphId

                    return (
                      <button
                        key={graph.graphId}
                        onClick={() =>
                          handleEntitySelect(entity, graph.graphId)
                        }
                        className={`w-full border-b border-gray-200 px-4 py-3 text-left transition-colors last:border-0 dark:border-gray-600 ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-900/30'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span
                            className={`text-sm font-medium ${
                              isSelected
                                ? 'text-blue-700 dark:text-blue-300'
                                : 'text-gray-900 dark:text-gray-100'
                            }`}
                          >
                            {entity.name}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {graph.graphName}
                          </span>
                        </div>
                      </button>
                    )
                  })}

                  {/* Create New Entity — redirects to platform via SSO */}
                  <div className="border-t-2 border-gray-300 dark:border-gray-600">
                    <button
                      onClick={() =>
                        navigateToApp('robosystems', '/graphs/new')
                      }
                      className="flex w-full items-center justify-center px-4 py-3 text-sm font-medium text-blue-600 transition-colors hover:bg-gray-50 dark:text-blue-400 dark:hover:bg-gray-700"
                    >
                      + Create New Entity
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
