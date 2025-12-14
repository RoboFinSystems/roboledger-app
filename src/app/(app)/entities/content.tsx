'use client'

import { PageHeader } from '@/components/PageHeader'
import type { Entity } from '@/lib/core'
import {
  customTheme,
  GraphFilters,
  PageLayout,
  SDK,
  useGraphContext,
} from '@/lib/core'
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
}

const EntitiesListPageContent: FC = function () {
  const { state: graphState } = useGraphContext()
  const [entities, setEntities] = useState<EntityWithGraph[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Load all entities from all roboledger graphs
  useEffect(() => {
    const loadAllEntities = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Filter to only roboledger graphs
        const roboledgerGraphs = graphState.graphs.filter(
          GraphFilters.roboledger
        )

        // Load entities from all roboledger graphs
        const allEntities: EntityWithGraph[] = []

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
                          e.entity_type as entityType,
                          e.parent_entity_id as parentEntityId,
                          e.is_parent as isParent
                        ORDER BY e.name`,
                parameters: {},
              },
            })

            if (response.data) {
              const data = response.data as any
              const rows = data.data || []

              const graphEntities: EntityWithGraph[] = rows.map((row: any) => ({
                identifier: row.identifier || '',
                name: row.name || row.identifier || 'Unnamed Entity',
                entityType: row.entityType,
                parentEntityId: row.parentEntityId,
                isParent: row.isParent,
                _graphId: graph.graphId,
                _graphName: graph.graphName,
                _graphCreatedAt: graph.createdAt,
              }))

              allEntities.push(...graphEntities)
            }
          } catch (error) {
            console.error(
              `Error loading entities from graph ${graph.graphName}:`,
              error
            )
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
                <TableHeadCell>Type</TableHeadCell>
                <TableHeadCell>Relationship</TableHeadCell>
                <TableHeadCell>Created</TableHeadCell>
              </TableHead>
              <TableBody>
                {filteredEntities.map((entity) => (
                  <TableRow key={`${entity._graphId}-${entity.identifier}`}>
                    <TableCell className="font-medium text-gray-900 dark:text-white">
                      <div className="flex flex-col">
                        <span className="font-semibold">{entity.name}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {entity.identifier}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {entity.entityType ? (
                        <Badge color="gray" size="sm">
                          {entity.entityType}
                        </Badge>
                      ) : (
                        <span className="text-sm text-gray-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {entity.isParent ? (
                        <Badge color="success" size="sm">
                          Parent
                        </Badge>
                      ) : entity.parentEntityId ? (
                        <Badge color="warning" size="sm">
                          Subsidiary
                        </Badge>
                      ) : (
                        <span className="text-sm text-gray-400">
                          Standalone
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {entity._graphCreatedAt
                          ? new Date(
                              entity._graphCreatedAt
                            ).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
    </PageLayout>
  )
}

export default EntitiesListPageContent
