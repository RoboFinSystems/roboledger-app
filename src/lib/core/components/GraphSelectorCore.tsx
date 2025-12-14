'use client'

import type { GraphInfo } from '@robosystems/client'
import React from 'react'
import { HiDatabase } from 'react-icons/hi'
import { useGraphContext } from '../contexts/graph-context'
import { EntitySelector, type SelectableEntity } from './EntitySelector'

// Transform GraphInfo to SelectableEntity
interface GraphEntity extends SelectableEntity {
  graphInfo: GraphInfo
}

function graphToEntity(graph: GraphInfo): GraphEntity {
  return {
    id: graph.graphId,
    name: graph.graphName,
    subtitle: graph.isRepository
      ? `Shared Repository • ${graph.role}`
      : graph.role,
    icon: HiDatabase,
    metadata: { ...graph, isRepository: graph.isRepository },
    graphInfo: graph,
  }
}

export interface GraphSelectorProps {
  // Optional filtering function
  filter?: (graph: GraphInfo) => boolean

  // Display props
  title?: string
  placeholder?: string
  emptyStateMessage?: string
  emptyStateAction?: {
    label: string
    href: string
  }

  // Styling
  className?: string

  // Additional actions
  additionalActions?: Array<{
    label: string
    href: string
    icon?: React.ComponentType<{ className?: string }>
  }>
}

export function GraphSelectorCore({
  filter,
  title = 'Graph',
  placeholder = 'Select Graph',
  emptyStateMessage = 'No graphs available',
  emptyStateAction,
  className = '',
  additionalActions = [],
}: GraphSelectorProps) {
  const { state, setCurrentGraph } = useGraphContext()

  // Transform graphs to entities
  const entities = React.useMemo(() => {
    const filteredGraphs = filter ? state.graphs.filter(filter) : state.graphs
    return filteredGraphs.map(graphToEntity)
  }, [state.graphs, filter])

  // Get current entity
  const currentEntity = React.useMemo(() => {
    if (!state.currentGraphId) return null
    const currentGraph = state.graphs.find(
      (g) => g.graphId === state.currentGraphId
    )
    return currentGraph ? graphToEntity(currentGraph) : null
  }, [state.currentGraphId, state.graphs])

  // Handle entity change
  const handleEntityChange = React.useCallback(
    async (entity: GraphEntity) => {
      // Update graph context (handles backend update and persistence)
      await setCurrentGraph(entity.id)
    },
    [setCurrentGraph]
  )

  return (
    <EntitySelector
      entities={entities}
      currentEntity={currentEntity}
      onEntityChange={handleEntityChange}
      title={title}
      placeholder={placeholder}
      emptyStateMessage={emptyStateMessage}
      emptyStateAction={emptyStateAction}
      isLoading={state.isLoading}
      className={className}
      defaultIcon={HiDatabase}
      additionalActions={additionalActions}
    />
  )
}
