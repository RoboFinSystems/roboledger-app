'use client'

import React from 'react'
import { HiOfficeBuilding } from 'react-icons/hi'
import {
  EntitySelector,
  type EntityGroup,
  type SelectableEntity,
} from './EntitySelector'

// Generic interfaces that can be extended by consuming apps
export interface EntityLike {
  identifier: string
  name: string
  [key: string]: any
}

export interface GraphWithEntities {
  graphId: string
  graphName: string
  entities: EntityLike[]
  [key: string]: any
}

export interface EntityRecord extends SelectableEntity {
  entity: EntityLike
  graphId: string
  graphName: string
}

// Transform entity to entity
function entityToEntity(
  entity: EntityLike,
  graphId: string,
  graphName: string
): EntityRecord {
  return {
    id: `${graphId}-${entity.identifier}`,
    name: entity.name,
    subtitle: graphName,
    icon: HiOfficeBuilding,
    metadata: { entity, graphId, graphName },
    entity,
    graphId,
    graphName,
  }
}

export interface EntitySelectorProps {
  // Data
  graphsWithEntities: GraphWithEntities[]
  currentEntity?: EntityLike | null
  currentGraphId?: string | null

  // Actions
  onEntityChange: (
    entity: EntityLike,
    graphId: string,
    graphName: string
  ) => Promise<void>

  // Optional filtering
  filter?: (entity: EntityLike, graphId: string) => boolean
  graphFilter?: (graph: GraphWithEntities) => boolean

  // Display props
  title?: string
  placeholder?: string
  emptyStateMessage?: string
  emptyStateAction?: {
    label: string
    href: string
  }

  // Grouping
  groupByGraph?: boolean

  // Loading states
  isLoading?: boolean
  isChanging?: boolean

  // Styling
  className?: string

  // Additional actions
  additionalActions?: Array<{
    label: string
    href: string
    icon?: React.ComponentType<{ className?: string }>
  }>
}

export function EntitySelectorCore({
  graphsWithEntities,
  currentEntity,
  currentGraphId,
  onEntityChange,
  filter,
  graphFilter,
  title = 'Entity',
  placeholder = 'Select Entity',
  emptyStateMessage = 'No entities available',
  emptyStateAction,
  groupByGraph = false,
  isLoading = false,
  isChanging = false,
  className = '',
  additionalActions = [],
}: EntitySelectorProps) {
  // Transform entities to entities
  const entities = React.useMemo(() => {
    const filteredGraphs = graphFilter
      ? graphsWithEntities.filter(graphFilter)
      : graphsWithEntities
    const allEntities: EntityRecord[] = []

    for (const graph of filteredGraphs) {
      const filteredEntities = filter
        ? graph.entities.filter((entity) => filter(entity, graph.graphId))
        : graph.entities

      for (const entity of filteredEntities) {
        allEntities.push(entityToEntity(entity, graph.graphId, graph.graphName))
      }
    }

    return allEntities
  }, [graphsWithEntities, filter, graphFilter])

  // Get current entity record
  const currentEntityRecord = React.useMemo(() => {
    if (!currentEntity || !currentGraphId) return null
    return (
      entities.find(
        (e) =>
          e.entity.identifier === currentEntity.identifier &&
          e.graphId === currentGraphId
      ) || null
    )
  }, [currentEntity, currentGraphId, entities])

  // Handle entity change
  const handleEntityChange = React.useCallback(
    async (entity: EntityRecord) => {
      await onEntityChange(entity.entity, entity.graphId, entity.graphName)
    },
    [onEntityChange]
  )

  // Group entities by graph if requested
  const groupBy = React.useMemo(() => {
    if (!groupByGraph) return undefined

    return (entities: EntityRecord[]): EntityGroup[] => {
      const groups = new Map<string, EntityGroup>()

      for (const entity of entities) {
        if (!groups.has(entity.graphId)) {
          groups.set(entity.graphId, {
            id: entity.graphId,
            name: entity.graphName,
            entities: [],
          })
        }
        groups.get(entity.graphId)!.entities.push(entity)
      }

      return Array.from(groups.values())
    }
  }, [groupByGraph])

  return (
    <EntitySelector
      entities={entities}
      currentEntity={currentEntityRecord}
      onEntityChange={handleEntityChange}
      title={title}
      placeholder={placeholder}
      emptyStateMessage={emptyStateMessage}
      emptyStateAction={emptyStateAction}
      groupBy={groupBy}
      isLoading={isLoading}
      isChanging={isChanging}
      className={className}
      defaultIcon={HiOfficeBuilding}
      additionalActions={additionalActions}
    />
  )
}
