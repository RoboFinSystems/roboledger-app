'use client'

import { PageHeader } from '@/components/PageHeader'
import {
  clients,
  customTheme,
  GraphFilters,
  PageLayout,
  useGraphContext,
} from '@/lib/core'
import type {
  InformationBlock,
  InformationBlockFact,
  LedgerPeriodCloseStatus,
} from '@robosystems/client/clients'
import {
  Badge,
  Button,
  Card,
  Modal,
  ModalBody,
  ModalHeader,
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
  HiCalendar,
  HiCheck,
  HiChevronRight,
  HiClock,
  HiExclamationCircle,
} from 'react-icons/hi'
import { TbFileInvoice } from 'react-icons/tb'

/** Fact with element name resolved from the envelope's elements[] list. */
type ScheduleFactRow = InformationBlockFact & { elementName: string }

/** Pre-digested view of a schedule Information Block for the list UI. */
type ScheduleRow = {
  structureId: string
  name: string
  taxonomyName: string | null
  method: string | null
  totalPeriods: number
  periodsWithEntries: number
}

/** Minimal shape FactsModal needs — pulled out so we're not dragging the
 *  full Information Block envelope through the component. */
type ScheduleFactsTarget = { structureId: string; name: string }

/** Project an Information Block envelope onto the schedule list row shape. */
function toScheduleRow(block: InformationBlock): ScheduleRow {
  const mechanics = block.artifact.mechanics as {
    kind?: string
    scheduleMetadata?: { method?: string }
    periodsWithEntries?: number
  }
  const periodKeys = new Set(
    block.facts.map((f) => `${f.periodStart ?? ''}_${f.periodEnd}`)
  )
  return {
    structureId: block.id,
    name: block.name,
    taxonomyName: block.taxonomyName,
    method: mechanics.scheduleMetadata?.method ?? null,
    totalPeriods: periodKeys.size,
    periodsWithEntries: mechanics.periodsWithEntries ?? 0,
  }
}

const STATUS_COLORS: Record<string, string> = {
  posted: 'success',
  draft: 'warning',
  pending: 'gray',
  reversed: 'failure',
}

const formatCurrencyDollars = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const formatMonth = (dateString: string): string => {
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
  })
}

// ── Period Close Panel ──────────────────────────────────────────────────

interface PeriodClosePanelProps {
  graphId: string
  onEntryCreated: () => void
}

const PeriodClosePanel: FC<PeriodClosePanelProps> = ({
  graphId,
  onEntryCreated,
}) => {
  const [closeStatus, setCloseStatus] =
    useState<LedgerPeriodCloseStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creatingEntry, setCreatingEntry] = useState<string | null>(null)

  // Default to current month
  const now = new Date()
  const defaultStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const defaultEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${lastDay}`

  const [periodStart, setPeriodStart] = useState(defaultStart)
  const [periodEnd, setPeriodEnd] = useState(defaultEnd)

  const loadCloseStatus = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const status = await clients.ledger.getPeriodCloseStatus(
        graphId,
        periodStart,
        periodEnd
      )
      setCloseStatus(status)
    } catch (err) {
      console.error('Error loading close status:', err)
      setError('Failed to load period close status.')
    } finally {
      setIsLoading(false)
    }
  }, [graphId, periodStart, periodEnd])

  useEffect(() => {
    if (graphId) {
      loadCloseStatus()
    }
  }, [graphId, loadCloseStatus])

  const handleCreateEntry = async (structureId: string) => {
    try {
      setCreatingEntry(structureId)
      await clients.ledger.createClosingEntry(
        graphId,
        structureId,
        periodEnd,
        periodStart,
        periodEnd
      )
      onEntryCreated()
      await loadCloseStatus()
    } catch (err) {
      console.error('Error creating closing entry:', err)
      setError('Failed to create closing entry.')
    } finally {
      setCreatingEntry(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Spinner size="md" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-500">
        <HiExclamationCircle className="h-5 w-5" />
        <span>{error}</span>
      </div>
    )
  }

  if (!closeStatus || closeStatus.schedules.length === 0) {
    return (
      <div className="py-4 text-center text-gray-500 dark:text-gray-400">
        No schedules found for this period.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label
            htmlFor="period-start"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Period:
          </label>
          <input
            id="period-start"
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          <span className="text-gray-500">to</span>
          <input
            id="period-end"
            aria-label="Period End"
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <Badge
          color={closeStatus.periodStatus === 'closed' ? 'success' : 'info'}
        >
          {closeStatus.periodStatus}
        </Badge>
      </div>

      <Table theme={customTheme.table}>
        <TableHead>
          <TableHeadCell>Schedule</TableHeadCell>
          <TableHeadCell>Amount</TableHeadCell>
          <TableHeadCell>Status</TableHeadCell>
          <TableHeadCell className="w-40"></TableHeadCell>
        </TableHead>
        <TableBody>
          {closeStatus.schedules.map((item) => (
            <TableRow key={item.structureId}>
              <TableCell className="font-medium text-gray-900 dark:text-white">
                {item.structureName}
              </TableCell>
              <TableCell>{formatCurrencyDollars(item.amount)}</TableCell>
              <TableCell>
                <Badge color={STATUS_COLORS[item.status] || 'gray'} size="sm">
                  {item.status}
                </Badge>
              </TableCell>
              <TableCell>
                {item.status === 'pending' && (
                  <Button
                    theme={customTheme.button}
                    size="xs"
                    color="primary"
                    disabled={creatingEntry === item.structureId}
                    onClick={() => handleCreateEntry(item.structureId)}
                  >
                    {creatingEntry === item.structureId ? (
                      <Spinner size="sm" className="mr-1" />
                    ) : (
                      <TbFileInvoice className="mr-1 h-4 w-4" />
                    )}
                    Create Entry
                  </Button>
                )}
                {item.status === 'draft' && (
                  <Badge color="warning" size="sm">
                    <HiClock className="mr-1 inline h-3 w-3" />
                    Draft created
                  </Badge>
                )}
                {item.status === 'posted' && (
                  <Badge color="success" size="sm">
                    <HiCheck className="mr-1 inline h-3 w-3" />
                    Posted
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
        <span>Draft: {closeStatus.totalDraft}</span>
        <span>Posted: {closeStatus.totalPosted}</span>
      </div>
    </div>
  )
}

// ── Schedule Facts Modal ────────────────────────────────────────────────

interface FactsModalProps {
  graphId: string
  schedule: ScheduleFactsTarget | null
  onClose: () => void
}

const FactsModal: FC<FactsModalProps> = ({ graphId, schedule, onClose }) => {
  const [facts, setFacts] = useState<ScheduleFactRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!schedule) return

    const loadFacts = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const block = await clients.ledger.getInformationBlock(
          graphId,
          schedule.structureId
        )
        if (!block) {
          setFacts([])
          return
        }
        const elementsById = new Map(block.elements.map((e) => [e.id, e]))
        setFacts(
          block.facts.map((f) => ({
            ...f,
            elementName: elementsById.get(f.elementId)?.name ?? '',
          }))
        )
      } catch (err) {
        console.error('Error loading facts:', err)
        setError('Failed to load schedule facts.')
      } finally {
        setIsLoading(false)
      }
    }

    loadFacts()
  }, [graphId, schedule])

  // Group facts by period
  const groupedFacts = useMemo(() => {
    const groups: Record<string, ScheduleFactRow[]> = {}
    for (const fact of facts) {
      const key = `${fact.periodStart}_${fact.periodEnd}`
      if (!groups[key]) groups[key] = []
      groups[key].push(fact)
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [facts])

  return (
    <Modal show={!!schedule} onClose={onClose} size="4xl">
      <ModalHeader>{schedule?.name} - Schedule Facts</ModalHeader>
      <ModalBody>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-red-500">
            <HiExclamationCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        ) : facts.length === 0 ? (
          <p className="py-4 text-center text-gray-500">No facts found.</p>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <Table theme={customTheme.table}>
              <TableHead>
                <TableHeadCell>Period</TableHeadCell>
                <TableHeadCell>Element</TableHeadCell>
                <TableHeadCell>Amount</TableHeadCell>
              </TableHead>
              <TableBody>
                {groupedFacts.map(([_key, periodFacts]) =>
                  periodFacts.map((fact, idx) => (
                    <TableRow
                      key={`${fact.elementId}_${fact.periodStart}_${idx}`}
                    >
                      {idx === 0 && (
                        <TableCell
                          rowSpan={periodFacts.length}
                          className="align-top font-medium text-gray-900 dark:text-white"
                        >
                          {formatMonth(fact.periodStart)}
                        </TableCell>
                      )}
                      <TableCell>{fact.elementName}</TableCell>
                      <TableCell>{formatCurrencyDollars(fact.value)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </ModalBody>
    </Modal>
  )
}

// ── Main Content ────────────────────────────────────────────────────────

const SchedulesContent: FC = function () {
  const { state: graphState } = useGraphContext()
  const [schedules, setSchedules] = useState<ScheduleRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSchedule, setSelectedSchedule] =
    useState<ScheduleFactsTarget | null>(null)
  const [showClosePanel, setShowClosePanel] = useState(false)

  const currentGraph = useMemo(() => {
    const roboledgerGraphs = graphState.graphs.filter(GraphFilters.roboledger)
    return (
      roboledgerGraphs.find((g) => g.graphId === graphState.currentGraphId) ??
      roboledgerGraphs[0]
    )
  }, [graphState.graphs, graphState.currentGraphId])

  const loadSchedules = useCallback(async () => {
    if (!currentGraph) {
      setSchedules([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const blocks = await clients.ledger.listInformationBlocks(
        currentGraph.graphId,
        { blockType: 'schedule' }
      )
      setSchedules(blocks.map(toScheduleRow))
    } catch (err) {
      console.error('Error loading schedules:', err)
      setError('Failed to load schedules.')
    } finally {
      setIsLoading(false)
    }
  }, [currentGraph])

  useEffect(() => {
    loadSchedules()
  }, [loadSchedules])

  return (
    <PageLayout>
      <PageHeader
        icon={HiCalendar}
        title="Schedules"
        description="Depreciation, amortization, and recurring entry schedules"
        gradient="from-emerald-500 to-teal-600"
        actions={
          <Button
            theme={customTheme.button}
            color={showClosePanel ? 'light' : 'primary'}
            onClick={() => setShowClosePanel(!showClosePanel)}
          >
            <TbFileInvoice className="mr-2 h-5 w-5" />
            {showClosePanel ? 'Hide' : 'Period Close'}
          </Button>
        }
      />

      {error && (
        <Card theme={customTheme.card}>
          <div className="flex items-center gap-2 text-red-500">
            <HiExclamationCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </Card>
      )}

      {showClosePanel && currentGraph && (
        <Card theme={customTheme.card}>
          <h2 className="font-heading mb-4 text-lg font-bold dark:text-white">
            Period Close Status
          </h2>
          <PeriodClosePanel
            graphId={currentGraph.graphId}
            onEntryCreated={loadSchedules}
          />
        </Card>
      )}

      <Card theme={customTheme.card}>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : schedules.length === 0 ? (
            <div className="py-12 text-center">
              <HiCalendar className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <h3 className="font-heading mb-4 text-xl font-bold dark:text-white">
                No Schedules Found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Schedules are created via the AI assistant or API. Ask your
                assistant to set up a depreciation or amortization schedule.
              </p>
            </div>
          ) : (
            <Table theme={customTheme.table}>
              <TableHead>
                <TableHeadCell>Schedule Name</TableHeadCell>
                <TableHeadCell>Periods</TableHeadCell>
                <TableHeadCell>Entries Created</TableHeadCell>
                <TableHeadCell>Progress</TableHeadCell>
                <TableHeadCell className="w-24"></TableHeadCell>
              </TableHead>
              <TableBody>
                {schedules.map((schedule) => {
                  const progress =
                    schedule.totalPeriods > 0
                      ? Math.round(
                          (schedule.periodsWithEntries /
                            schedule.totalPeriods) *
                            100
                        )
                      : 0

                  return (
                    <TableRow key={schedule.structureId}>
                      <TableCell className="font-medium text-gray-900 dark:text-white">
                        <div className="flex flex-col">
                          <span className="font-semibold">{schedule.name}</span>
                          {schedule.method && (
                            <span className="text-xs text-gray-500">
                              {schedule.method.replaceAll('_', ' ')}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{schedule.totalPeriods} months</TableCell>
                      <TableCell>
                        {schedule.periodsWithEntries} / {schedule.totalPeriods}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 rounded-full bg-gray-200 dark:bg-gray-700">
                            <div
                              className="h-2 rounded-full bg-emerald-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {progress}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          theme={customTheme.button}
                          size="sm"
                          color="light"
                          onClick={() => setSelectedSchedule(schedule)}
                        >
                          <HiChevronRight className="mr-1 h-4 w-4" />
                          Facts
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>

      {currentGraph && (
        <FactsModal
          graphId={currentGraph.graphId}
          schedule={selectedSchedule}
          onClose={() => setSelectedSchedule(null)}
        />
      )}
    </PageLayout>
  )
}

export default SchedulesContent
