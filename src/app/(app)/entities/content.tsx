'use client'

import { FilterBar, SearchField } from '@/components/FilterBar'
import SortableHeadCell from '@/components/SortableHeadCell'
import { type SortColumn, useTableSort } from '@/lib/useTableSort'
import type { Entity } from '@robosystems/core'
import {
  clients,
  EmptyState,
  GraphFilters,
  LoadingState,
  PageHeader,
  PageLayout,
  useEntity,
  useGraphContext,
} from '@robosystems/core'
import {
  Alert,
  Badge,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'flowbite-react'
import type { FC } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { HiExclamationCircle, HiOfficeBuilding } from 'react-icons/hi'

interface EntityWithGraph extends Entity {
  _graphId: string
  _graphName: string
  _graphCreatedAt?: string
  _graphType?: string
}

type SortKey = 'entity' | 'graph' | 'type' | 'created'

const SORT_COLUMNS: Record<SortKey, SortColumn<EntityWithGraph>> = {
  entity: { value: (entity) => entity.name },
  graph: { value: (entity) => entity._graphName },
  type: { value: (entity) => entity._graphType || 'entity' },
  // ISO timestamps order correctly as text; newest first.
  created: { value: (entity) => entity._graphCreatedAt ?? null, first: 'desc' },
}

const EntitiesListPageContent: FC = function () {
  const { state: graphState } = useGraphContext()
  const { currentEntity } = useEntity()
  const [entities, setEntities] = useState<EntityWithGraph[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Load parent entity from each roboledger graph via the ledger entity API
  useEffect(() => {
    const loadAllEntities = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const roboledgerGraphs = graphState.graphs.filter(
          GraphFilters.roboledger
        )

        if (roboledgerGraphs.length === 0) {
          setEntities([])
          return
        }

        const results = await Promise.allSettled(
          roboledgerGraphs.map((graph) =>
            clients.ledger
              .getEntity(graph.graphId)
              .then((entity) => ({ graph, entity }))
          )
        )

        const allEntities: EntityWithGraph[] = []
        for (const result of results) {
          if (result.status === 'fulfilled' && result.value.entity) {
            const { graph, entity } = result.value
            allEntities.push({
              identifier: entity.id || entity.uri || '',
              name: entity.name || 'Unnamed Entity',
              parentEntityId: entity.parentEntityId,
              isParent: entity.isParent,
              _graphId: graph.graphId,
              _graphName: graph.graphName,
              _graphCreatedAt: graph.createdAt,
              _graphType: graph.graphType,
            })
          } else if (result.status === 'rejected') {
            console.error('Error loading entity:', result.reason)
          }
        }

        setEntities(allEntities)
      } catch (error) {
        console.error('Error loading entities:', error)
        setError('Failed to load entities. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    loadAllEntities()
  }, [graphState.graphs])

  // Filter entities based on search term. Memoised so the sort below has a
  // stable list to work from.
  const filteredEntities = useMemo(() => {
    const needle = searchTerm.toLowerCase()
    return entities.filter(
      (entity) =>
        entity.name.toLowerCase().includes(needle) ||
        entity.identifier.toLowerCase().includes(needle) ||
        entity._graphName.toLowerCase().includes(needle)
    )
  }, [entities, searchTerm])

  // Every entity is in hand (no cap, no paging), so sorting is honest.
  const tableSort = useTableSort(filteredEntities, SORT_COLUMNS)

  return (
    <PageLayout>
      <PageHeader
        icon={HiOfficeBuilding}
        title={`All Entities (${entities.length})`}
        subtitle="View all entities across your roboledger graphs"
      />

      {/* Search */}
      <FilterBar>
        <SearchField
          id="search"
          placeholder="Search entities…"
          value={searchTerm}
          onChange={setSearchTerm}
        />
      </FilterBar>

      {error && (
        <Alert color="failure">
          <HiExclamationCircle className="h-4 w-4" />
          <span className="font-medium">Error!</span> {error}
        </Alert>
      )}

      <Card>
        <div className="overflow-x-auto">
          {isLoading ? (
            <LoadingState />
          ) : entities.length === 0 ? (
            <EmptyState
              icon={HiOfficeBuilding}
              title="No Entities Found"
              description="No entities found in your roboledger graphs."
              className="p-8"
            />
          ) : (
            <Table>
              <TableHead>
                <tr>
                  <SortableHeadCell
                    sort={tableSort.ariaSort('entity')}
                    onSort={() => tableSort.toggle('entity')}
                  >
                    Entity
                  </SortableHeadCell>
                  <SortableHeadCell
                    sort={tableSort.ariaSort('graph')}
                    onSort={() => tableSort.toggle('graph')}
                  >
                    Graph
                  </SortableHeadCell>
                  <SortableHeadCell
                    sort={tableSort.ariaSort('type')}
                    onSort={() => tableSort.toggle('type')}
                  >
                    Type
                  </SortableHeadCell>
                  <SortableHeadCell
                    sort={tableSort.ariaSort('created')}
                    onSort={() => tableSort.toggle('created')}
                  >
                    Created
                  </SortableHeadCell>
                  <TableHeadCell>Selected</TableHeadCell>
                </tr>
              </TableHead>
              <TableBody>
                {tableSort.sorted.map((entity) => {
                  const isSelected =
                    currentEntity?.identifier === entity.identifier &&
                    graphState.currentGraphId === entity._graphId

                  return (
                    <TableRow key={entity._graphId}>
                      <TableCell className="font-medium text-gray-900 dark:text-white">
                        <div className="flex flex-col">
                          <span className="font-semibold">{entity.name}</span>
                          <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                            {entity.identifier}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {entity._graphName}
                          </span>
                          <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                            {entity._graphId}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge color="gray" size="sm">
                          {entity._graphType || 'entity'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {entity._graphCreatedAt
                            ? new Date(
                                entity._graphCreatedAt
                              ).toLocaleDateString()
                            : '--'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {isSelected && (
                          <Badge color="success" size="sm">
                            active
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
    </PageLayout>
  )
}

export default EntitiesListPageContent
