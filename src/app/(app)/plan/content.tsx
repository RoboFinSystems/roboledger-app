'use client'

import type { InformationBlockList } from '@robosystems/client/clients'
import {
  clients,
  EmptyState,
  GraphFilters,
  LoadingState,
  PageHeader,
  PageLayout,
  useGraphContext,
} from '@robosystems/core'
import { Button, Card } from 'flowbite-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import type { FC } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  HiDownload,
  HiExclamationCircle,
  HiLockClosed,
  HiTable,
} from 'react-icons/hi'
import { downloadCsv } from '../explorer/components/csv'
import ScenarioSelect from '../explorer/components/ScenarioSelect'
import PeriodWindowControl from '../ledger/close/components/blockview/PeriodWindowControl'
import type { EnvelopeBlock } from '../ledger/close/components/blockview/types'
import {
  usePeriodWindow,
  windowStartIndex,
} from '../ledger/close/components/blockview/usePeriodWindow'
import PlanGrid from './components/PlanGrid'
import { buildPlanCsv, composePlan, slicePlan } from './planModel'

/**
 * `/plan` — the Plan surface (the workbook's FOP tab as a page; F-4).
 * Statements + the scenario's assumptions in ONE grid: monthly columns
 * spanning the actuals/forecast seam, every statement read in series
 * mode (`series: true`), the seam carried by `periods[].forecast`.
 * Scenario-centric by design: the first forecast block is the default
 * selection ("Actuals" strips the forward columns); `?scenario=` makes
 * a view shareable.
 */

const STATEMENT_ORDER = [
  { blockType: 'income_statement', title: 'Income Statement' },
  { blockType: 'balance_sheet', title: 'Balance Sheet' },
  { blockType: 'cash_flow_statement', title: 'Cash Flow' },
] as const

const PlanContent: FC = function () {
  const { state: graphState } = useGraphContext()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [blocks, setBlocks] = useState<InformationBlockList>([])
  const [isListLoading, setIsListLoading] = useState(true)
  const [entityName, setEntityName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // null = actuals (explicit); undefined = not yet resolved — defaults
  // to the first forecast block once the list loads. The URL encodes
  // "actuals" literally so a shared actuals view stays actuals.
  const [scenarioId, setScenarioId] = useState<string | null | undefined>(
    () => {
      const raw = searchParams.get('scenario')
      if (raw === null) return undefined
      return raw === 'actuals' ? null : raw
    }
  )

  const [envelopes, setEnvelopes] = useState<
    { title: string; envelope: EnvelopeBlock | null }[]
  >([])
  const [isGridLoading, setIsGridLoading] = useState(false)
  const loadSeq = useRef(0)

  const { window, setWindow } = usePeriodWindow('all')

  const currentGraph = useMemo(() => {
    const roboledgerGraphs = graphState.graphs.filter(GraphFilters.roboledger)
    return (
      roboledgerGraphs.find((g) => g.graphId === graphState.currentGraphId) ??
      roboledgerGraphs[0]
    )
  }, [graphState.graphs, graphState.currentGraphId])

  // Block list — statement blocks (fact-bearing) + forecast scenarios.
  useEffect(() => {
    if (!currentGraph) {
      setBlocks([])
      setIsListLoading(false)
      return
    }
    let cancelled = false
    void (async () => {
      try {
        setIsListLoading(true)
        setError(null)
        const [list, entity] = await Promise.all([
          clients.ledger.listInformationBlocks(currentGraph.graphId, {
            limit: 200,
          }),
          clients.ledger.getEntity(currentGraph.graphId).catch(() => null),
        ])
        if (cancelled) return
        const withFacts = list.filter((b) => b.facts.length > 0)
        setBlocks(withFacts)
        setEntityName(entity?.name ?? null)
        // Scenario-centric default: the first forecast block — unless the
        // URL resolved the selection already (a scenario id or 'actuals').
        // A URL-seeded id that doesn't match a loaded forecast block (a
        // deleted scenario, or a link from another graph) falls back to
        // the default and heals the URL — otherwise every envelope read
        // would fail against the stale id.
        setScenarioId((current) => {
          const firstForecast = withFacts.find(
            (b) => b.blockType === 'forecast'
          )
          if (current === null) return null
          if (
            typeof current === 'string' &&
            withFacts.some(
              (b) => b.blockType === 'forecast' && b.id === current
            )
          ) {
            return current
          }
          if (typeof current === 'string') {
            router.replace(
              firstForecast ? `/plan?scenario=${firstForecast.id}` : '/plan',
              { scroll: false }
            )
          }
          return firstForecast?.id ?? null
        })
      } catch (err) {
        if (cancelled) return
        console.error('Error loading information blocks:', err)
        setError('Failed to load information blocks.')
      } finally {
        if (!cancelled) setIsListLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [currentGraph, router])

  // Instance name FIRST: `displayName` is the block-TYPE label
  // ("Forecast"), so displayName-first would render every scenario in
  // the picker with the same word — indistinguishable the moment a
  // second scenario exists. Same trap the BlockPicker labels solved.
  const scenarios = useMemo(
    () =>
      blocks
        .filter((b) => b.blockType === 'forecast')
        .map((b) => ({ id: b.id, name: b.name || (b.displayName ?? b.id) })),
    [blocks]
  )

  // The grid's envelopes: each statement family in series mode, plus
  // the selected scenario's own envelope (the assumptions/lever grid).
  useEffect(() => {
    if (!currentGraph || isListLoading || scenarioId === undefined) return
    const statementIds: { title: string; id: string }[] = []
    for (const { blockType, title } of STATEMENT_ORDER) {
      const block = blocks.find((b) => b.blockType === blockType)
      if (block) statementIds.push({ title, id: block.id })
    }
    if (statementIds.length === 0 && !scenarioId) {
      setEnvelopes([])
      return
    }
    const seq = ++loadSeq.current
    void (async () => {
      try {
        setIsGridLoading(true)
        setError(null)
        const loaded = await Promise.all([
          ...(scenarioId
            ? [
                clients.ledger
                  .getInformationBlock(currentGraph.graphId, scenarioId)
                  .then((envelope) => ({ title: 'Assumptions', envelope })),
              ]
            : []),
          ...statementIds.map(({ title, id }) =>
            clients.ledger
              .getInformationBlock(currentGraph.graphId, id, {
                ...(scenarioId ? { scenarioId } : {}),
                series: true,
              })
              .then((envelope) => ({ title, envelope }))
          ),
        ])
        if (seq !== loadSeq.current) return
        setEnvelopes(loaded)
      } catch (err) {
        if (seq !== loadSeq.current) return
        console.error('Error loading plan envelopes:', err)
        setError('Failed to load the plan grid.')
      } finally {
        if (seq === loadSeq.current) setIsGridLoading(false)
      }
    })()
  }, [currentGraph, blocks, isListLoading, scenarioId])

  const handleScenarioChange = useCallback(
    (scenario: string | null) => {
      setScenarioId(scenario)
      const params = new URLSearchParams()
      params.set('scenario', scenario ?? 'actuals')
      router.replace(`/plan?${params.toString()}`, { scroll: false })
    },
    [router]
  )

  const model = useMemo(() => composePlan(envelopes), [envelopes])
  const windowed = useMemo(
    () => slicePlan(model, windowStartIndex(model.columns.length, window)),
    [model, window]
  )

  const hasStatements = useMemo(
    () =>
      STATEMENT_ORDER.some(({ blockType }) =>
        blocks.some((b) => b.blockType === blockType)
      ),
    [blocks]
  )

  const handleExport = useCallback(() => {
    const csv = buildPlanCsv(windowed)
    if (csv) {
      downloadCsv(csv, `operating-plan-${entityName ?? 'export'}.csv`)
    }
  }, [windowed, entityName])

  if (!currentGraph && !graphState.isLoading) {
    return (
      <PageLayout>
        <PageHeader icon={HiTable} title="Plan" />
        <Card>
          <EmptyState
            icon={HiTable}
            title="No Ledger Found"
            description="Connect a ledger graph to work its operating plan."
          />
        </Card>
      </PageLayout>
    )
  }

  return (
    <PageLayout variant="full-width">
      <PageHeader
        icon={HiTable}
        title="Plan"
        subtitle={(() => {
          // Honest copy: the seam only exists when a scenario is
          // selected — the actuals view is the closed monthly history.
          const what = scenarioId
            ? 'statements and assumptions across the forecast seam'
            : 'monthly statements from the closed history'
          return entityName
            ? `${entityName} — ${what}`
            : what.charAt(0).toUpperCase() + what.slice(1)
        })()}
        actions={
          <div className="flex items-center gap-2">
            <ScenarioSelect
              scenarios={scenarios}
              selectedId={scenarioId ?? null}
              onChange={handleScenarioChange}
            />
            <Button
              size="xs"
              color="light"
              onClick={handleExport}
              disabled={windowed.sections.length === 0 || isGridLoading}
            >
              <HiDownload className="mr-1.5 h-3.5 w-3.5" />
              CSV
            </Button>
            {model.columns.length > 3 && (
              <PeriodWindowControl window={window} onChange={setWindow} />
            )}
          </div>
        }
      />

      <Card>
        {isListLoading || (isGridLoading && envelopes.length === 0) ? (
          <LoadingState size="xl" className="py-24" />
        ) : error ? (
          <div className="flex items-center gap-2 py-8 text-red-500">
            <HiExclamationCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        ) : !hasStatements ? (
          <EmptyState
            icon={HiTable}
            title="No Closed Months Yet"
            description="Closing a month stamps its financial statements — the monthly columns this grid is built from. Close your first month to start the plan."
            className="py-12"
            action={
              <Link href="/ledger/close">
                <Button color="primary">
                  <HiLockClosed className="mr-2 h-4 w-4" />
                  Go to Closing Book
                </Button>
              </Link>
            }
          />
        ) : windowed.sections.length === 0 ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            Nothing to plan for this selection yet.
          </div>
        ) : (
          // Scenario switches keep the grid mounted under a translucent
          // overlay — a full-page spinner on every toggle reads as a
          // reload, not a refinement.
          <div className="relative">
            {isGridLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded bg-white/60 dark:bg-gray-900/60">
                <LoadingState size="lg" />
              </div>
            )}
            {scenarios.length === 0 && (
              <div className="mb-3 rounded border border-gray-200 bg-gray-50 p-2 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                No forecast scenario yet — this view shows closed actuals only.
                Author a scenario (via the MCP forecast tools) to light up the
                forward columns.
              </div>
            )}
            <PlanGrid model={windowed} />
          </div>
        )}
      </Card>
    </PageLayout>
  )
}

export default PlanContent
