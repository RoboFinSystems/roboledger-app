'use client'

import { PageHeader } from '@/components/PageHeader'
import {
  customTheme,
  GraphFilters,
  PageLayout,
  SDK,
  useGraphContext,
} from '@/lib/core'
import type {
  AggregationMethod,
  Element,
  ElementAssociation,
  ElementClassification,
  MappingStructure,
} from '@/lib/ledger'
import {
  ELEMENTS_QUERY,
  MAPPING_STRUCTURES_QUERY,
  MAPPING_WITH_ASSOCIATIONS_QUERY,
  UNMAPPED_ELEMENTS_QUERY,
} from '@/lib/ledger'
import {
  getUSGAAPElementsByClassification,
  US_GAAP_ELEMENTS,
} from '@/lib/ledger/us-gaap-elements'
import {
  Alert,
  Badge,
  Button,
  Card,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Select,
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
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  HiChevronDown,
  HiChevronRight,
  HiExclamationCircle,
  HiOutlinePlusCircle,
  HiPencil,
  HiSearch,
  HiSwitchHorizontal,
  HiTrash,
} from 'react-icons/hi'
import { TbLink } from 'react-icons/tb'

const CLASSIFICATION_COLORS: Record<ElementClassification, string> = {
  asset: 'success',
  liability: 'failure',
  equity: 'purple',
  revenue: 'info',
  expense: 'warning',
}

const AGGREGATION_METHODS: { value: AggregationMethod; label: string }[] = [
  { value: 'sum', label: 'Sum' },
  { value: 'average', label: 'Average' },
  { value: 'weighted_average', label: 'Weighted Average' },
  { value: 'first', label: 'First' },
  { value: 'last', label: 'Last' },
]

interface MappingStructureWithGraph extends MappingStructure {
  _graphId: string
  _graphName: string
}

interface ElementWithGraph extends Element {
  _graphId: string
  _graphName: string
}

const AccountMappingsContent: FC = function () {
  const { state: graphState } = useGraphContext()
  const [structures, setStructures] = useState<MappingStructureWithGraph[]>([])
  const [unmappedElements, setUnmappedElements] = useState<ElementWithGraph[]>(
    []
  )
  const [allElements, setAllElements] = useState<ElementWithGraph[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [associations, setAssociations] = useState<
    Record<string, ElementAssociation[]>
  >({})
  const [loadingAssociations, setLoadingAssociations] = useState<Set<string>>(
    new Set()
  )

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAddMappingModal, setShowAddMappingModal] = useState(false)
  const [selectedStructure, setSelectedStructure] =
    useState<MappingStructureWithGraph | null>(null)

  // Form states
  const [newStructureName, setNewStructureName] = useState('')
  const [newStructureDescription, setNewStructureDescription] = useState('')
  const [selectedUSGAAPElement, setSelectedUSGAAPElement] = useState<string>('')
  const [selectedCoAElements, setSelectedCoAElements] = useState<string[]>([])
  const [selectedAggMethod, setSelectedAggMethod] =
    useState<AggregationMethod>('sum')
  const [searchUSGAAP, setSearchUSGAAP] = useState('')
  const [searchCoA, setSearchCoA] = useState('')

  // Get current graph
  const currentGraph = useMemo(() => {
    const roboledgerGraphs = graphState.graphs.filter(GraphFilters.roboledger)
    return roboledgerGraphs[0] // Use first roboledger graph
  }, [graphState.graphs])

  // Load mapping structures and unmapped elements
  useEffect(() => {
    const loadData = async () => {
      if (!currentGraph) {
        setStructures([])
        setUnmappedElements([])
        setAllElements([])
        setAssociations({})
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Load mapping structures
        const structuresResponse = await SDK.executeCypherQuery({
          path: { graph_id: currentGraph.graphId },
          query: { mode: 'sync' },
          body: {
            query: MAPPING_STRUCTURES_QUERY,
            parameters: {},
          },
        })

        if (structuresResponse.data) {
          const data = structuresResponse.data as {
            data?: Array<{
              identifier: string
              name: string
              description: string
              taxonomyUri: string
              targetTaxonomyUri: string
              associationCount: number
            }>
          }
          const rows = data.data || []

          const graphStructures: MappingStructureWithGraph[] = rows.map(
            (row) => ({
              identifier: row.identifier || '',
              name: row.name || 'Unnamed Structure',
              description: row.description,
              taxonomyUri: row.taxonomyUri || '',
              targetTaxonomyUri: row.targetTaxonomyUri || '',
              associationCount: row.associationCount || 0,
              _graphId: currentGraph.graphId,
              _graphName: currentGraph.graphName,
            })
          )
          setStructures(graphStructures)
        }

        // Load unmapped elements
        const unmappedResponse = await SDK.executeCypherQuery({
          path: { graph_id: currentGraph.graphId },
          query: { mode: 'sync' },
          body: {
            query: UNMAPPED_ELEMENTS_QUERY,
            parameters: {},
          },
        })

        if (unmappedResponse.data) {
          const data = unmappedResponse.data as {
            data?: Array<{
              identifier: string
              name: string
              classification: ElementClassification
            }>
          }
          const rows = data.data || []

          const unmapped: ElementWithGraph[] = rows.map((row) => ({
            identifier: row.identifier || '',
            uri: '',
            qname: '',
            name: row.name || row.identifier || 'Unknown',
            classification: row.classification,
            balance: 'debit',
            periodType: 'instant',
            type: '',
            isAbstract: false,
            isNumeric: true,
            isDimensionItem: false,
            isDomainMember: false,
            isHypercubeItem: false,
            _graphId: currentGraph.graphId,
            _graphName: currentGraph.graphName,
          }))
          setUnmappedElements(unmapped)
        }

        // Load all elements for CoA selection
        const elementsResponse = await SDK.executeCypherQuery({
          path: { graph_id: currentGraph.graphId },
          query: { mode: 'sync' },
          body: {
            query: ELEMENTS_QUERY,
            parameters: {},
          },
        })

        if (elementsResponse.data) {
          const data = elementsResponse.data as {
            data?: Array<{
              identifier: string
              uri: string
              qname: string
              name: string
              classification: ElementClassification
              balance: 'debit' | 'credit'
              periodType: 'instant' | 'duration'
              type: string
              itemType?: string
              isAbstract: boolean
              isNumeric: boolean
              isDimensionItem: boolean
              isDomainMember: boolean
              isHypercubeItem: boolean
            }>
          }
          const rows = data.data || []

          const elements: ElementWithGraph[] = rows.map((row) => ({
            identifier: row.identifier || '',
            uri: row.uri || '',
            qname: row.qname || '',
            name: row.name || row.identifier || 'Unknown',
            classification: row.classification,
            balance: row.balance || 'debit',
            periodType: row.periodType || 'instant',
            type: row.type || '',
            isAbstract: row.isAbstract || false,
            isNumeric: row.isNumeric !== false,
            isDimensionItem: row.isDimensionItem || false,
            isDomainMember: row.isDomainMember || false,
            isHypercubeItem: row.isHypercubeItem || false,
            _graphId: currentGraph.graphId,
            _graphName: currentGraph.graphName,
          }))
          setAllElements(elements)
        }
      } catch (err) {
        console.error('Error loading mappings:', err)
        setError('Failed to load account mappings. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [currentGraph])

  // Load associations for a structure
  const loadAssociations = useCallback(
    async (structure: MappingStructureWithGraph) => {
      const key = `${structure._graphId}-${structure.identifier}`

      if (associations[key]) {
        return
      }

      setLoadingAssociations((prev) => new Set(prev).add(key))

      try {
        const response = await SDK.executeCypherQuery({
          path: { graph_id: structure._graphId },
          query: { mode: 'sync' },
          body: {
            query: MAPPING_WITH_ASSOCIATIONS_QUERY,
            parameters: {
              structureId: structure.identifier,
            },
          },
        })

        if (response.data) {
          const data = response.data as {
            data?: Array<{
              associations: Array<{
                identifier: string
                aggregationMethod: AggregationMethod
                weight: number
                orderValue: number
                sourceElement: string
                sourceElementName: string
                targetElement: string
                targetElementName: string
              }>
            }>
          }
          const rows = data.data || []

          if (rows.length > 0 && rows[0].associations) {
            const assocs: ElementAssociation[] = rows[0].associations
              .filter((a) => a.identifier)
              .map((a) => ({
                identifier: a.identifier,
                sourceElement: a.sourceElement || '',
                sourceElementName: a.sourceElementName || '',
                targetElement: a.targetElement || '',
                targetElementName: a.targetElementName || '',
                aggregationMethod: a.aggregationMethod || 'sum',
                weight: a.weight || 1,
                orderValue: a.orderValue || 0,
              }))

            setAssociations((prev) => ({
              ...prev,
              [key]: assocs,
            }))
          } else {
            setAssociations((prev) => ({
              ...prev,
              [key]: [],
            }))
          }
        }
      } catch (err) {
        console.error('Error loading associations:', err)
      } finally {
        setLoadingAssociations((prev) => {
          const next = new Set(prev)
          next.delete(key)
          return next
        })
      }
    },
    [associations]
  )

  // Toggle structure expansion
  const toggleExpand = useCallback(
    (structure: MappingStructureWithGraph) => {
      const key = `${structure._graphId}-${structure.identifier}`

      if (expandedId === key) {
        setExpandedId(null)
      } else {
        setExpandedId(key)
        loadAssociations(structure)
      }
    },
    [expandedId, loadAssociations]
  )

  // Get US-GAAP elements grouped by classification
  const usGAAPByClassification = useMemo(
    () => getUSGAAPElementsByClassification(),
    []
  )

  // Filter US-GAAP elements
  const filteredUSGAAPElements = useMemo(() => {
    const searchLower = searchUSGAAP.toLowerCase()
    return Object.values(US_GAAP_ELEMENTS).filter(
      (element) =>
        element.name.toLowerCase().includes(searchLower) ||
        element.label.toLowerCase().includes(searchLower)
    )
  }, [searchUSGAAP])

  // Filter CoA elements
  const filteredCoAElements = useMemo(() => {
    const searchLower = searchCoA.toLowerCase()
    return allElements.filter(
      (element) =>
        !element.isAbstract &&
        (element.name.toLowerCase().includes(searchLower) ||
          element.identifier.toLowerCase().includes(searchLower))
    )
  }, [allElements, searchCoA])

  // Handle CoA element selection toggle
  const toggleCoASelection = useCallback((elementUri: string) => {
    setSelectedCoAElements((prev) =>
      prev.includes(elementUri)
        ? prev.filter((uri) => uri !== elementUri)
        : [...prev, elementUri]
    )
  }, [])

  // Reset form
  const resetForm = useCallback(() => {
    setSelectedUSGAAPElement('')
    setSelectedCoAElements([])
    setSelectedAggMethod('sum')
    setSearchUSGAAP('')
    setSearchCoA('')
  }, [])

  // Open add mapping modal
  const openAddMappingModal = useCallback(
    (structure: MappingStructureWithGraph) => {
      setSelectedStructure(structure)
      resetForm()
      setShowAddMappingModal(true)
    },
    [resetForm]
  )

  return (
    <PageLayout>
      <PageHeader
        icon={HiSwitchHorizontal}
        title="Account Mappings"
        description="Map Chart of Accounts to US-GAAP taxonomy elements"
        gradient="from-teal-500 to-green-600"
        actions={
          <Button
            theme={customTheme.button}
            color="primary"
            onClick={() => setShowCreateModal(true)}
          >
            <HiOutlinePlusCircle className="mr-2 h-5 w-5" />
            New Mapping Structure
          </Button>
        }
      />

      {error && (
        <Alert theme={customTheme.alert} color="failure">
          <HiExclamationCircle className="h-4 w-4" />
          <span className="font-medium">Error!</span> {error}
        </Alert>
      )}

      {!currentGraph && !isLoading && (
        <Alert theme={customTheme.alert} color="info">
          No roboledger graph found. Create a graph first to manage account
          mappings.
        </Alert>
      )}

      <div>
        {/* Mapping Structures */}
        <div className="mb-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Mapping Structures
          </h2>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : structures.length === 0 ? (
            <Card theme={customTheme.card}>
              <div className="py-8 text-center">
                <TbLink className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <h3 className="font-heading mb-4 text-xl font-bold dark:text-white">
                  No Mapping Structures
                </h3>
                <p className="mb-4 text-gray-500 dark:text-gray-400">
                  Create a mapping structure to start mapping CoA accounts to
                  US-GAAP elements.
                </p>
                <Button
                  theme={customTheme.button}
                  color="primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  <HiOutlinePlusCircle className="mr-2 h-5 w-5" />
                  Create First Structure
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {structures.map((structure) => {
                const key = `${structure._graphId}-${structure.identifier}`
                const isExpanded = expandedId === key
                const structureAssociations = associations[key] || []
                const isLoadingAssocs = loadingAssociations.has(key)

                return (
                  <Card key={key} theme={customTheme.card}>
                    <button
                      type="button"
                      className="flex w-full cursor-pointer items-center justify-between text-left"
                      onClick={() => toggleExpand(structure)}
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <HiChevronDown className="h-5 w-5 text-gray-500" />
                        ) : (
                          <HiChevronRight className="h-5 w-5 text-gray-500" />
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {structure.name}
                          </h3>
                          {structure.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {structure.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge color="gray" size="sm">
                          {structure.associationCount} associations
                        </Badge>
                        <div className="flex gap-2">
                          <Button
                            theme={customTheme.button}
                            size="sm"
                            color="light"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation()
                              openAddMappingModal(structure)
                            }}
                          >
                            <HiOutlinePlusCircle className="mr-1 h-4 w-4" />
                            Add
                          </Button>
                          <Button
                            theme={customTheme.button}
                            size="sm"
                            color="light"
                            onClick={(e: React.MouseEvent) =>
                              e.stopPropagation()
                            }
                          >
                            <HiPencil className="h-4 w-4" />
                          </Button>
                          <Button
                            theme={customTheme.button}
                            size="sm"
                            color="failure"
                            onClick={(e: React.MouseEvent) =>
                              e.stopPropagation()
                            }
                          >
                            <HiTrash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </button>

                    {/* Expanded Associations */}
                    {isExpanded && (
                      <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
                        {isLoadingAssocs ? (
                          <div className="flex justify-center py-4">
                            <Spinner size="sm" />
                          </div>
                        ) : structureAssociations.length === 0 ? (
                          <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                            No associations yet. Add mappings to this structure.
                          </p>
                        ) : (
                          <Table theme={customTheme.table}>
                            <TableHead>
                              <TableHeadCell>US-GAAP Element</TableHeadCell>
                              <TableHeadCell>CoA Account</TableHeadCell>
                              <TableHeadCell>Method</TableHeadCell>
                              <TableHeadCell>Weight</TableHeadCell>
                              <TableHeadCell className="w-20"></TableHeadCell>
                            </TableHead>
                            <TableBody>
                              {structureAssociations.map((assoc) => (
                                <TableRow key={assoc.identifier}>
                                  <TableCell className="font-medium text-gray-900 dark:text-white">
                                    {assoc.targetElementName ||
                                      assoc.targetElement}
                                  </TableCell>
                                  <TableCell>
                                    {assoc.sourceElementName ||
                                      assoc.sourceElement}
                                  </TableCell>
                                  <TableCell>
                                    <Badge color="gray" size="sm">
                                      {assoc.aggregationMethod.toUpperCase()}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{assoc.weight}</TableCell>
                                  <TableCell>
                                    <Button
                                      theme={customTheme.button}
                                      size="xs"
                                      color="failure"
                                    >
                                      <HiTrash className="h-3 w-3" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Unmapped Accounts */}
        {unmappedElements.length > 0 && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Unmapped Accounts ({unmappedElements.length})
            </h2>
            <Card theme={customTheme.card}>
              <div className="flex flex-wrap gap-2">
                {unmappedElements.slice(0, 20).map((element) => (
                  <Badge
                    key={`${element._graphId}-${element.identifier}`}
                    color={
                      CLASSIFICATION_COLORS[element.classification] || 'gray'
                    }
                    size="sm"
                  >
                    {element.name}
                  </Badge>
                ))}
                {unmappedElements.length > 20 && (
                  <Badge color="gray" size="sm">
                    +{unmappedElements.length - 20} more
                  </Badge>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Create Structure Modal */}
      <Modal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        size="md"
      >
        <ModalHeader>Create Mapping Structure</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <Label htmlFor="structureName">Name</Label>
              <TextInput
                theme={customTheme.textInput}
                id="structureName"
                placeholder="e.g., Income Statement Mapping"
                value={newStructureName}
                onChange={(e) => setNewStructureName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="structureDescription">Description</Label>
              <TextInput
                theme={customTheme.textInput}
                id="structureDescription"
                placeholder="Optional description"
                value={newStructureDescription}
                onChange={(e) => setNewStructureDescription(e.target.value)}
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            theme={customTheme.button}
            color="primary"
            onClick={() => {
              // TODO: Implement create structure
              setShowCreateModal(false)
              setNewStructureName('')
              setNewStructureDescription('')
            }}
            disabled={!newStructureName.trim()}
          >
            Create Structure
          </Button>
          <Button
            theme={customTheme.button}
            color="gray"
            onClick={() => setShowCreateModal(false)}
          >
            Cancel
          </Button>
        </ModalFooter>
      </Modal>

      {/* Add Mapping Modal */}
      <Modal
        show={showAddMappingModal}
        onClose={() => setShowAddMappingModal(false)}
        size="xl"
      >
        <ModalHeader>
          Add Account Mapping
          {selectedStructure && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              to {selectedStructure.name}
            </span>
          )}
        </ModalHeader>
        <ModalBody>
          <div className="grid grid-cols-2 gap-6">
            {/* US-GAAP Element Selection */}
            <div>
              <Label className="mb-2">Target US-GAAP Element</Label>
              <div className="relative mb-2">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <HiSearch className="h-4 w-4 text-gray-500" />
                </div>
                <TextInput
                  theme={customTheme.textInput}
                  placeholder="Search US-GAAP elements..."
                  value={searchUSGAAP}
                  onChange={(e) => setSearchUSGAAP(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="max-h-64 overflow-y-auto rounded border border-gray-200 dark:border-gray-700">
                {filteredUSGAAPElements.map((element) => (
                  <button
                    type="button"
                    key={element.name}
                    className={`w-full cursor-pointer border-b border-gray-100 px-3 py-2 text-left last:border-b-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800 ${
                      selectedUSGAAPElement === element.name
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : ''
                    }`}
                    onClick={() => setSelectedUSGAAPElement(element.name)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {element.label}
                      </span>
                      <Badge
                        color={CLASSIFICATION_COLORS[element.classification]}
                        size="xs"
                      >
                        {element.classification}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {element.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* CoA Element Selection */}
            <div>
              <Label className="mb-2">Source CoA Account(s)</Label>
              <div className="relative mb-2">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <HiSearch className="h-4 w-4 text-gray-500" />
                </div>
                <TextInput
                  theme={customTheme.textInput}
                  placeholder="Search CoA accounts..."
                  value={searchCoA}
                  onChange={(e) => setSearchCoA(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="max-h-64 overflow-y-auto rounded border border-gray-200 dark:border-gray-700">
                {filteredCoAElements.map((element) => {
                  const isSelected = selectedCoAElements.includes(element.uri)
                  return (
                    <label
                      key={element.identifier}
                      className={`block cursor-pointer border-b border-gray-100 px-3 py-2 last:border-b-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800 ${
                        isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleCoASelection(element.uri)}
                          aria-label={`Select ${element.name}`}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {element.name}
                          </span>
                          <Badge
                            color={
                              CLASSIFICATION_COLORS[element.classification]
                            }
                            size="xs"
                            className="ml-2"
                          >
                            {element.classification}
                          </Badge>
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
              {selectedCoAElements.length > 0 && (
                <p className="mt-2 text-sm text-gray-500">
                  {selectedCoAElements.length} account(s) selected
                </p>
              )}
            </div>
          </div>

          {/* Aggregation Settings */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="aggMethod">Aggregation Method</Label>
              <Select
                theme={customTheme.select}
                id="aggMethod"
                value={selectedAggMethod}
                onChange={(e) =>
                  setSelectedAggMethod(e.target.value as AggregationMethod)
                }
              >
                {AGGREGATION_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            theme={customTheme.button}
            color="primary"
            onClick={() => {
              // TODO: Implement add mapping
              setShowAddMappingModal(false)
              resetForm()
            }}
            disabled={
              !selectedUSGAAPElement || selectedCoAElements.length === 0
            }
          >
            Add Mapping
          </Button>
          <Button
            theme={customTheme.button}
            color="gray"
            onClick={() => {
              setShowAddMappingModal(false)
              resetForm()
            }}
          >
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </PageLayout>
  )
}

export default AccountMappingsContent
