'use client'

import { PageHeader } from '@/components/PageHeader'
import type { Entity } from '@/lib/core'
import {
  customTheme,
  GraphFilters,
  PageLayout,
  useEntity,
  useGraphContext,
} from '@/lib/core'
import * as SDK from '@robosystems/client'
import {
  Alert,
  Badge,
  Card,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  TextInput,
} from 'flowbite-react'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { HiExclamationCircle, HiOfficeBuilding, HiSearch } from 'react-icons/hi'

interface EntityWithGraph extends Entity {
  _graphId: string
  _graphName: string
  _graphCreatedAt?: string
  _graphType?: string
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
            SDK.getLedgerEntity({ path: { graph_id: graph.graphId } }).then(
              (response) => ({ graph, response })
            )
          )
        )

        const allEntities: EntityWithGraph[] = []
        for (const result of results) {
          if (result.status === 'fulfilled' && result.value.response.data) {
            const { graph, response } = result.value
            const data = response.data as any
            allEntities.push({
              identifier: data.id || data.uri || '',
              name: data.name || 'Unnamed Entity',
              parentEntityId: data.parent_entity_id,
              isParent: data.is_parent,
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

  // Filter entities based on search term
  const filteredEntities = entities.filter(
    (entity) =>
      entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entity.identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entity._graphName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <PageLayout>
      <PageHeader
        icon={HiOfficeBuilding}
        title={`All Entities (${entities.length})`}
        description="View all entities across your roboledger graphs"
        gradient="from-indigo-500 to-purple-600"
      />

      {/* Search */}
      <Card theme={customTheme.card}>
        <div className="relative w-full sm:w-64">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <HiSearch className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </div>
          <TextInput
            theme={customTheme.textInput}
            id="search"
            placeholder="Search entities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {error && (
        <Alert theme={customTheme.alert} color="failure">
          <HiExclamationCircle className="h-4 w-4" />
          <span className="font-medium">Error!</span> {error}
        </Alert>
      )}

      <Card theme={customTheme.card}>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : entities.length === 0 ? (
            <div className="p-8 text-center">
              <Card theme={customTheme.card}>
                <HiOfficeBuilding className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <h3 className="font-heading mb-4 text-xl font-bold dark:text-white">
                  No Entities Found
                </h3>
                <p className="mb-4 text-gray-500 dark:text-gray-400">
                  No entities found in your roboledger graphs.
                </p>
              </Card>
            </div>
          ) : (
            <Table theme={customTheme.table}>
              <TableHead>
                <TableHeadCell>Entity</TableHeadCell>
                <TableHeadCell>Graph</TableHeadCell>
                <TableHeadCell>Type</TableHeadCell>
                <TableHeadCell>Created</TableHeadCell>
                <TableHeadCell>Selected</TableHeadCell>
              </TableHead>
              <TableBody>
                {filteredEntities.map((entity) => {
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
