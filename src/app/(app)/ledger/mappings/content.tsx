'use client'

import { PageHeader } from '@/components/PageHeader'
import {
  customTheme,
  extensions,
  GraphFilters,
  PageLayout,
  useGraphContext,
} from '@/lib/core'
import type {
  MappingCoverage,
  MappingInfo,
} from '@robosystems/client/extensions'
import type { MappingDetailResponse } from '@robosystems/client/types'
import {
  Alert,
  Badge,
  Button,
  Card,
  Progress,
  Select,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'flowbite-react'
import type { FC } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  HiChevronDown,
  HiChevronRight,
  HiExclamationCircle,
  HiPlus,
  HiSparkles,
  HiTrash,
} from 'react-icons/hi'
import { TbLink } from 'react-icons/tb'

interface ElementOption {
  id: string
  name: string
  classification: string
  qname?: string
}

const CLASSIFICATION_COLORS: Record<string, string> = {
  asset: 'success',
  liability: 'failure',
  equity: 'purple',
  revenue: 'info',
  expense: 'warning',
}

const MappingsContent: FC = function () {
  const { state: graphState } = useGraphContext()
  const [mappings, setMappings] = useState<MappingInfo[]>([])
  const [coverage, setCoverage] = useState<Record<string, MappingCoverage>>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<MappingDetailResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [isAutoMapping, setIsAutoMapping] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [showAddRow, setShowAddRow] = useState(false)
  const [coaElements, setCoaElements] = useState<ElementOption[]>([])
  const [gaapElements, setGaapElements] = useState<ElementOption[]>([])
  const [selectedCoa, setSelectedCoa] = useState('')
  const [selectedGaap, setSelectedGaap] = useState('')
  const [error, setError] = useState<string | null>(null)

  const currentGraph = useMemo(() => {
    const roboledgerGraphs = graphState.graphs.filter(GraphFilters.roboledger)
    return roboledgerGraphs[0]
  }, [graphState.graphs])

  // Load mappings and coverage
  useEffect(() => {
    const loadData = async () => {
      if (!currentGraph) {
        setMappings([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const mappingList = await extensions.ledger.listMappings(
          currentGraph.graphId
        )
        setMappings(mappingList)

        // Load coverage for each mapping
        const coverageMap: Record<string, MappingCoverage> = {}
        for (const m of mappingList) {
          try {
            coverageMap[m.id] = await extensions.ledger.getMappingCoverage(
              currentGraph.graphId,
              m.id
            )
          } catch {
            // ignore individual coverage failures
          }
        }
        setCoverage(coverageMap)
      } catch (err) {
        console.error('Error loading mappings:', err)
        setError('Failed to load mappings.')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [currentGraph])

  // Load mapping detail on expand
  const handleExpand = useCallback(
    async (mappingId: string) => {
      if (expandedId === mappingId) {
        setExpandedId(null)
        setDetail(null)
        return
      }

      if (!currentGraph) return

      setExpandedId(mappingId)
      setIsLoadingDetail(true)

      try {
        const result = await extensions.ledger.getMappingDetail(
          currentGraph.graphId,
          mappingId
        )
        setDetail(result)
      } catch (err) {
        console.error('Error loading mapping detail:', err)
        setDetail(null)
      } finally {
        setIsLoadingDetail(false)
      }
    },
    [currentGraph, expandedId]
  )

  // Auto-map handler
  const handleAutoMap = useCallback(
    async (mappingId: string) => {
      if (!currentGraph) return

      try {
        setIsAutoMapping(true)
        setError(null)
        await extensions.ledger.autoMap(currentGraph.graphId, mappingId)

        // Poll for updated coverage after agent completes
        setTimeout(async () => {
          try {
            const updatedCoverage = await extensions.ledger.getMappingCoverage(
              currentGraph.graphId,
              mappingId
            )
            setCoverage((prev) => ({ ...prev, [mappingId]: updatedCoverage }))
          } catch {
            // ignore
          }
          setIsAutoMapping(false)
        }, 5000)
      } catch (err) {
        console.error('Auto-map failed:', err)
        setError('Auto-mapping failed. Please try again.')
        setIsAutoMapping(false)
      }
    },
    [currentGraph]
  )

  // Create a new mapping structure
  const handleCreateMapping = useCallback(async () => {
    if (!currentGraph) return

    try {
      setIsCreating(true)
      setError(null)
      const newMapping = await extensions.ledger.createMappingStructure(
        currentGraph.graphId
      )

      // Refresh the list
      const mappingList = await extensions.ledger.listMappings(
        currentGraph.graphId
      )
      setMappings(mappingList)

      // Load coverage for the new mapping
      try {
        const cov = await extensions.ledger.getMappingCoverage(
          currentGraph.graphId,
          newMapping.id
        )
        setCoverage((prev) => ({ ...prev, [newMapping.id]: cov }))
      } catch {
        // ignore
      }
    } catch (err) {
      console.error('Create mapping failed:', err)
      setError('Failed to create mapping structure.')
    } finally {
      setIsCreating(false)
    }
  }, [currentGraph])

  // Load CoA and GAAP elements for manual mapping
  const loadElements = useCallback(async () => {
    if (!currentGraph || coaElements.length > 0) return

    try {
      const [coaResult, gaapResult] = await Promise.all([
        extensions.ledger.listElements(currentGraph.graphId, {
          source: 'quickbooks',
          isAbstract: false,
          limit: 500,
        }),
        extensions.ledger.listElements(currentGraph.graphId, {
          source: 'us-gaap',
          isAbstract: false,
          limit: 500,
        }),
      ])

      const coaData = coaResult as {
        elements?: Array<Record<string, unknown>>
      }
      const gaapData = gaapResult as {
        elements?: Array<Record<string, unknown>>
      }

      setCoaElements(
        (coaData.elements ?? []).map((e) => ({
          id: e.id as string,
          name: e.name as string,
          classification: e.classification as string,
        }))
      )
      setGaapElements(
        (gaapData.elements ?? []).map((e) => ({
          id: e.id as string,
          name: e.name as string,
          classification: e.classification as string,
          qname: (e.qname as string) ?? undefined,
        }))
      )
    } catch (err) {
      console.error('Failed to load elements:', err)
    }
  }, [currentGraph, coaElements.length])

  // CoA elements filtered to exclude already-mapped ones
  const unmappedCoaElements = useMemo(() => {
    if (!detail?.associations) return coaElements
    const mappedIds = new Set(
      (detail.associations as Array<Record<string, unknown>>).map(
        (a) => a.from_element_id as string
      )
    )
    return coaElements.filter((e) => !mappedIds.has(e.id))
  }, [coaElements, detail])

  // Show add row and load elements
  const handleShowAddRow = useCallback(() => {
    setShowAddRow(true)
    setSelectedCoa('')
    setSelectedGaap('')
    loadElements()
  }, [loadElements])

  // Save manual mapping
  const handleSaveMapping = useCallback(
    async (mappingId: string) => {
      if (!currentGraph || !selectedCoa || !selectedGaap) return

      try {
        setIsSaving(true)
        setError(null)
        await extensions.ledger.createMapping(
          currentGraph.graphId,
          mappingId,
          selectedCoa,
          selectedGaap,
          1.0
        )

        // Refresh detail and coverage
        const [updatedDetail, updatedCoverage] = await Promise.all([
          extensions.ledger.getMappingDetail(currentGraph.graphId, mappingId),
          extensions.ledger.getMappingCoverage(currentGraph.graphId, mappingId),
        ])
        setDetail(updatedDetail)
        setCoverage((prev) => ({ ...prev, [mappingId]: updatedCoverage }))
        setShowAddRow(false)
        setSelectedCoa('')
        setSelectedGaap('')
      } catch (err) {
        console.error('Save mapping failed:', err)
        setError('Failed to save mapping.')
      } finally {
        setIsSaving(false)
      }
    },
    [currentGraph, selectedCoa, selectedGaap]
  )

  // Delete a mapping association
  const handleDeleteAssociation = useCallback(
    async (mappingId: string, associationId: string) => {
      if (!currentGraph) return

      try {
        setIsDeleting(associationId)
        setError(null)
        await extensions.ledger.deleteMapping(
          currentGraph.graphId,
          mappingId,
          associationId
        )

        // Refresh detail and coverage
        const [updatedDetail, updatedCoverage] = await Promise.all([
          extensions.ledger.getMappingDetail(currentGraph.graphId, mappingId),
          extensions.ledger.getMappingCoverage(currentGraph.graphId, mappingId),
        ])
        setDetail(updatedDetail)
        setCoverage((prev) => ({ ...prev, [mappingId]: updatedCoverage }))
      } catch (err) {
        console.error('Delete association failed:', err)
        setError('Failed to delete mapping.')
      } finally {
        setIsDeleting(null)
      }
    },
    [currentGraph]
  )

  return (
    <PageLayout>
      <PageHeader
        icon={TbLink}
        title="Mappings"
        description="Map Chart of Accounts to US GAAP reporting concepts"
        gradient="from-purple-500 to-indigo-600"
        actions={
          <Button
            theme={customTheme.button}
            color="purple"
            onClick={handleCreateMapping}
            disabled={isCreating}
          >
            {isCreating ? (
              <Spinner size="sm" className="mr-2" />
            ) : (
              <TbLink className="mr-2 h-4 w-4" />
            )}
            New Mapping
          </Button>
        }
      />

      {error && (
        <Alert theme={customTheme.alert} color="failure">
          <HiExclamationCircle className="h-4 w-4" />
          <span className="font-medium">Error:</span> {error}
        </Alert>
      )}

      <Card theme={customTheme.card}>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : mappings.length === 0 ? (
          <div className="py-12 text-center">
            <TbLink className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="font-heading mb-2 text-xl font-bold dark:text-white">
              No Mappings Found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Click <span className="font-semibold">New Mapping</span> to link
              your Chart of Accounts to US GAAP reporting concepts.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {mappings.map((mapping) => {
              const cov = coverage[mapping.id]
              const isExpanded = expandedId === mapping.id

              return (
                <div
                  key={mapping.id}
                  className="rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  {/* Mapping header */}
                  <button
                    type="button"
                    className="flex w-full cursor-pointer items-center justify-between p-4 text-left"
                    onClick={() => handleExpand(mapping.id)}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <HiChevronDown className="h-5 w-5 text-gray-400" />
                      ) : (
                        <HiChevronRight className="h-5 w-5 text-gray-400" />
                      )}
                      <div>
                        <h4 className="font-semibold dark:text-white">
                          {mapping.name}
                        </h4>
                        {mapping.description && (
                          <p className="text-sm text-gray-500">
                            {mapping.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {cov && (
                        <div className="flex items-center gap-2">
                          <div className="w-32">
                            <Progress
                              progress={cov.coveragePercent}
                              color={
                                cov.coveragePercent >= 80 ? 'green' : 'yellow'
                              }
                              size="sm"
                            />
                          </div>
                          <Badge
                            color={
                              cov.coveragePercent >= 80 ? 'success' : 'warning'
                            }
                            size="sm"
                          >
                            {cov.mappedCount}/{cov.totalCoaElements}
                          </Badge>
                        </div>
                      )}
                      <Button
                        theme={customTheme.button}
                        color="purple"
                        size="xs"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation()
                          handleAutoMap(mapping.id)
                        }}
                        disabled={isAutoMapping}
                      >
                        {isAutoMapping ? (
                          <Spinner size="xs" />
                        ) : (
                          <>
                            <HiSparkles className="mr-1 h-3 w-3" />
                            Auto-Map
                          </>
                        )}
                      </Button>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-gray-700">
                      {isLoadingDetail ? (
                        <div className="flex justify-center py-8">
                          <Spinner size="md" />
                        </div>
                      ) : (
                        <>
                          {detail?.associations &&
                          detail.associations.length > 0 ? (
                            <Table theme={customTheme.table}>
                              <TableHead>
                                <TableHeadCell>CoA Account</TableHeadCell>
                                <TableHeadCell></TableHeadCell>
                                <TableHeadCell>GAAP Concept</TableHeadCell>
                                <TableHeadCell>Classification</TableHeadCell>
                                <TableHeadCell>Confidence</TableHeadCell>
                                <TableHeadCell></TableHeadCell>
                              </TableHead>
                              <TableBody>
                                {detail.associations.map(
                                  (
                                    assoc: Record<string, unknown>,
                                    idx: number
                                  ) => (
                                    <TableRow key={idx}>
                                      <TableCell className="font-medium dark:text-white">
                                        {(assoc.from_element_name as string) ||
                                          'Unknown'}
                                      </TableCell>
                                      <TableCell className="text-center text-gray-400">
                                        →
                                      </TableCell>
                                      <TableCell>
                                        <span className="font-medium text-purple-400">
                                          {(assoc.to_element_name as string) ||
                                            'Unknown'}
                                        </span>
                                        <br />
                                        <span className="font-mono text-xs text-gray-500">
                                          {(assoc.to_element_qname as string) ||
                                            ''}
                                        </span>
                                      </TableCell>
                                      <TableCell>
                                        <Badge
                                          color={
                                            CLASSIFICATION_COLORS[
                                              assoc.to_element_classification as string
                                            ] || 'gray'
                                          }
                                          size="sm"
                                        >
                                          {(assoc.to_element_classification as string) ||
                                            'N/A'}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        <Badge
                                          color={
                                            (assoc.confidence as number) >= 0.9
                                              ? 'success'
                                              : (assoc.confidence as number) >=
                                                  0.7
                                                ? 'warning'
                                                : 'gray'
                                          }
                                          size="sm"
                                        >
                                          {(
                                            ((assoc.confidence as number) ??
                                              0) * 100
                                          ).toFixed(0)}
                                          %
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        <button
                                          type="button"
                                          className="text-gray-400 hover:text-red-500"
                                          onClick={() =>
                                            handleDeleteAssociation(
                                              mapping.id,
                                              assoc.id as string
                                            )
                                          }
                                          disabled={
                                            isDeleting ===
                                            (assoc.id as string)
                                          }
                                        >
                                          {isDeleting ===
                                          (assoc.id as string) ? (
                                            <Spinner size="xs" />
                                          ) : (
                                            <HiTrash className="h-4 w-4" />
                                          )}
                                        </button>
                                      </TableCell>
                                    </TableRow>
                                  )
                                )}
                              </TableBody>
                            </Table>
                          ) : (
                            <div className="py-6 text-center text-gray-500">
                              No mappings yet. Use Auto-Map or add manually
                              below.
                            </div>
                          )}

                          {/* Add mapping row */}
                          {showAddRow ? (
                            <div className="flex items-center gap-3 border-t border-gray-200 p-4 dark:border-gray-700">
                              <Select
                                sizing="sm"
                                value={selectedCoa}
                                onChange={(e) => setSelectedCoa(e.target.value)}
                                className="min-w-[200px] flex-1"
                              >
                                <option value="">Select CoA account...</option>
                                {unmappedCoaElements.map((el) => (
                                  <option key={el.id} value={el.id}>
                                    {el.name}
                                  </option>
                                ))}
                              </Select>
                              <span className="text-gray-400">→</span>
                              <Select
                                sizing="sm"
                                value={selectedGaap}
                                onChange={(e) => setSelectedGaap(e.target.value)}
                                className="min-w-[200px] flex-1"
                              >
                                <option value="">
                                  Select GAAP concept...
                                </option>
                                {gaapElements.map((el) => (
                                  <option key={el.id} value={el.id}>
                                    {el.name}
                                    {el.qname ? ` (${el.qname})` : ''}
                                  </option>
                                ))}
                              </Select>
                              <Button
                                theme={customTheme.button}
                                color="purple"
                                size="xs"
                                onClick={() => handleSaveMapping(mapping.id)}
                                disabled={
                                  isSaving || !selectedCoa || !selectedGaap
                                }
                              >
                                {isSaving ? (
                                  <Spinner size="xs" />
                                ) : (
                                  'Save'
                                )}
                              </Button>
                              <Button
                                theme={customTheme.button}
                                color="gray"
                                size="xs"
                                onClick={() => setShowAddRow(false)}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="border-t border-gray-200 p-3 dark:border-gray-700">
                              <Button
                                theme={customTheme.button}
                                color="gray"
                                size="xs"
                                onClick={handleShowAddRow}
                              >
                                <HiPlus className="mr-1 h-3 w-3" />
                                Add Mapping
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </PageLayout>
  )
}

export default MappingsContent
