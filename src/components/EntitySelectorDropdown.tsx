'use client'

import type { Entity } from '@/lib/core'
import { GraphFilters, useEntity, useGraphContext } from '@/lib/core'
import * as SDK from '@robosystems/client'
import { useEffect, useMemo, useState } from 'react'
import { HiChevronDown, HiOfficeBuilding } from 'react-icons/hi'

/**
 * EntitySelectorDropdown for RoboLedger
 *
 * Shows all entities across all roboledger graphs.
 * Selecting an entity automatically switches to its graph.
 */
export function EntitySelectorDropdown() {
  const { state: graphState, setCurrentGraph } = useGraphContext()
  const { currentEntity, setCurrentEntity } = useEntity()
  const [isOpen, setIsOpen] = useState(false)
  const [entitiesByGraph, setEntitiesByGraph] = useState<Map<string, Entity[]>>(
    new Map()
  )
  const [isLoading, setIsLoading] = useState(false)

  // Filter to only roboledger graphs
  const roboledgerGraphs = useMemo(
    () => graphState.graphs.filter(GraphFilters.roboledger),
    [graphState.graphs]
  )

  // Load entities for all roboledger graphs
  useEffect(() => {
    const loadAllEntities = async () => {
      setIsLoading(true)
      const entitiesMap = new Map<string, Entity[]>()

      for (const graph of roboledgerGraphs) {
        try {
          const response = await SDK.executeCypherQuery({
            path: { graph_id: graph.graphId },
            query: { mode: 'sync' },
            body: {
              query: `MATCH (e:Entity)
                      RETURN
                        e.identifier as identifier,
                        e.name as name,
                        e.parent_entity_id as parentEntityId,
                        e.is_parent as isParent
                      ORDER BY e.name`,
              parameters: {},
            },
          })

          if (response.data) {
            const data = response.data as any
            const rows = data.data || []

            const entities: Entity[] = rows.map((row: any) => ({
              identifier: row.identifier || '',
              name: row.name || row.identifier || 'Unnamed Entity',
              parentEntityId: row.parentEntityId,
              isParent: row.isParent,
            }))

            if (entities.length > 0) {
              entitiesMap.set(graph.graphId, entities)
            }
          }
        } catch (error) {
          console.error(
            `Failed to load entities for graph ${graph.graphId}:`,
            error
          )
        }
      }

      setEntitiesByGraph(entitiesMap)
      setIsLoading(false)
    }

    if (roboledgerGraphs.length > 0) {
      loadAllEntities()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roboledgerGraphs]) // Only reload when graphs change, not on every entity selection

  const handleEntitySelect = async (entity: Entity, graphId: string) => {
    setIsOpen(false)

    // Switch graph if different from current
    if (graphId !== graphState.currentGraphId) {
      await setCurrentGraph(graphId)
    }

    // Set the selected entity
    setCurrentEntity(entity)
  }

  // Get current graph name
  const currentGraph = roboledgerGraphs.find(
    (g) => g.graphId === graphState.currentGraphId
  )

  // Calculate total entities across all graphs
  const totalEntities = Array.from(entitiesByGraph.values()).reduce(
    (sum, entities) => sum + entities.length,
    0
  )

  // Determine empty state
  const hasNoGraphs = roboledgerGraphs.length === 0
  const hasNoEntities = !isLoading && totalEntities === 0

  // If no graphs, show create graph link
  if (hasNoGraphs) {
    return (
      <a
        href="/graphs/new"
        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
      >
        <HiOfficeBuilding className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <span className="font-medium text-gray-900 dark:text-gray-100">
          Create Graph
        </span>
      </a>
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
                  {/* Currently selected entity at the top */}
                  {currentEntity &&
                    graphState.currentGraphId &&
                    (() => {
                      const currentGraphEntities =
                        entitiesByGraph.get(graphState.currentGraphId) || []
                      const selectedEntity = currentGraphEntities.find(
                        (e) => e.identifier === currentEntity.identifier
                      )
                      const selectedGraph = roboledgerGraphs.find(
                        (g) => g.graphId === graphState.currentGraphId
                      )

                      if (selectedEntity && selectedGraph) {
                        return (
                          <>
                            <div className="border-b-2 border-gray-300 dark:border-gray-500">
                              <div className="bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                Current Selection
                              </div>
                              <button
                                onClick={() =>
                                  handleEntitySelect(
                                    selectedEntity,
                                    selectedGraph.graphId
                                  )
                                }
                                className="w-full bg-blue-50 px-4 py-2 text-left hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/40"
                              >
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                    {selectedEntity.name}
                                  </span>
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {selectedGraph.graphName}
                                    {selectedEntity.parentEntityId &&
                                      ' • Subsidiary'}
                                    {selectedEntity.isParent && ' • Parent'}
                                  </span>
                                </div>
                              </button>
                            </div>
                          </>
                        )
                      }
                      return null
                    })()}

                  {/* All other entities grouped by graph */}
                  {roboledgerGraphs.map((graph) => {
                    const entities = entitiesByGraph.get(graph.graphId) || []
                    // Filter out the currently selected entity
                    const otherEntities = entities.filter(
                      (e) =>
                        !(
                          currentEntity?.identifier === e.identifier &&
                          graphState.currentGraphId === graph.graphId
                        )
                    )

                    if (otherEntities.length === 0) return null

                    return (
                      <div
                        key={graph.graphId}
                        className="border-b border-gray-200 last:border-0 dark:border-gray-600"
                      >
                        {/* Graph header */}
                        <div className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                          {graph.graphName}
                        </div>

                        {/* Entities */}
                        {otherEntities.map((entity) => (
                          <button
                            key={`${graph.graphId}-${entity.identifier}`}
                            onClick={() =>
                              handleEntitySelect(entity, graph.graphId)
                            }
                            className="w-full px-4 py-2 text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {entity.name}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {entity.identifier}
                                {entity.parentEntityId && ' • Subsidiary'}
                                {entity.isParent && ' • Parent'}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )
                  })}

                  {/* Create New Entity Link */}
                  <div className="border-t-2 border-gray-300 dark:border-gray-600">
                    <a
                      href="/graphs/new"
                      className="flex w-full items-center justify-center px-4 py-3 text-sm font-medium text-blue-600 transition-colors hover:bg-gray-50 dark:text-blue-400 dark:hover:bg-gray-700"
                    >
                      + Create New Entity
                    </a>
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
