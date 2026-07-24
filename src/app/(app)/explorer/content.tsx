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
import { useRouter, useSearchParams } from 'next/navigation'
import type { FC } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { HiChartBar, HiDownload, HiExclamationCircle } from 'react-icons/hi'
import BlockView from '../ledger/close/components/blockview/BlockView'
import type { EnvelopeBlock } from '../ledger/close/components/blockview/types'
import { isStatementBlockType } from '../ledger/close/components/blockview/types'
import type { ViewMode } from '../ledger/close/components/ViewModeToggle'
import ViewModeToggle from '../ledger/close/components/ViewModeToggle'
import BlockPicker, { type BlockListItem } from './components/BlockPicker'
import ComputePanel from './components/ComputePanel'
import { buildRenderingCsv, csvFilename, downloadCsv } from './components/csv'
import ScenarioSelect from './components/ScenarioSelect'

const VIEW_MODES: readonly ViewMode[] = [
  'rendered',
  'chart',
  'facts',
  'elements',
  'validation',
  'rules',
]

const isViewMode = (value: string | null): value is ViewMode =>
  value !== null && (VIEW_MODES as readonly string[]).includes(value)

/**
 * `/explorer` — the Block Explorer, the generic Information Block surface. Pick any block
 * (metrics, statements, schedules, disclosures) and view its envelope
 * through the standard View projections; metric blocks additionally get
 * the compute bar that extends their standing time series. State is
 * URL-encoded (`?block=` / `?view=` / `?scenario=`) so a view is
 * shareable — `?scenario=` binds every envelope read to that forecast
 * block's FactSet slice (omitted = actuals).
 */
const BlockExplorerContent: FC = function () {
  const { state: graphState } = useGraphContext()
  const searchParams = useSearchParams()
  const router = useRouter()

  // Block list (left rail)
  const [blocks, setBlocks] = useState<InformationBlockList>([])
  const [isListLoading, setIsListLoading] = useState(true)
  const [entityName, setEntityName] = useState<string | null>(null)
  const [listError, setListError] = useState<string | null>(null)

  // Selection — seeded from the URL so shared links land on the block
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    searchParams.get('block')
  )
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const fromUrl = searchParams.get('view')
    return isViewMode(fromUrl) ? fromUrl : 'rendered'
  })
  // Scenario filter — a forecast block's structure id; null = actuals.
  const [scenarioId, setScenarioId] = useState<string | null>(() =>
    searchParams.get('scenario')
  )

  // Envelope (content area)
  const [envelope, setEnvelope] = useState<EnvelopeBlock | null>(null)
  const [isEnvelopeLoading, setIsEnvelopeLoading] = useState(false)
  const [envelopeError, setEnvelopeError] = useState<string | null>(null)
  const envelopeSeq = useRef(0)

  const currentGraph = useMemo(() => {
    const roboledgerGraphs = graphState.graphs.filter(GraphFilters.roboledger)
    return (
      roboledgerGraphs.find((g) => g.graphId === graphState.currentGraphId) ??
      roboledgerGraphs[0]
    )
  }, [graphState.graphs, graphState.currentGraphId])

  const updateUrl = useCallback(
    (blockId: string | null, mode: ViewMode, scenario: string | null) => {
      const params = new URLSearchParams()
      if (blockId) params.set('block', blockId)
      if (mode !== 'rendered') params.set('view', mode)
      if (scenario) params.set('scenario', scenario)
      const query = params.toString()
      router.replace(query ? `/explorer?${query}` : '/explorer', {
        scroll: false,
      })
    },
    [router]
  )

  // Load the block list. Inlined so the `cancelled` flag is local to each
  // invocation — a stale response can't overwrite a newer graph's list.
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
        setListError(null)
        const [list, entity] = await Promise.all([
          clients.ledger.listInformationBlocks(currentGraph.graphId, {
            limit: 200,
          }),
          clients.ledger.getEntity(currentGraph.graphId).catch(() => null),
        ])
        if (cancelled) return
        // The explorer shows blocks as standing time series, so only
        // fact-bearing blocks belong here. The list also contains the
        // library-seeded structure variants (disclosure anchors, calc
        // structures, presentation umbrellas, per-equity-form clones) —
        // all fact-less, and near-duplicates of each other by name.
        const withFacts = list.filter((b) => b.facts.length > 0)
        setBlocks(withFacts)
        setEntityName(entity?.name ?? null)
        // Default selection: first metric block (the explorer home),
        // else the first block. A URL-seeded selection wins.
        setSelectedId((current) => {
          if (current) return current
          const first =
            withFacts.find((b) => b.blockType === 'metric') ??
            withFacts[0] ??
            null
          return first?.id ?? null
        })
      } catch (err) {
        if (cancelled) return
        console.error('Error loading information blocks:', err)
        setListError('Failed to load information blocks.')
      } finally {
        if (!cancelled) setIsListLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [currentGraph])

  // Load the selected block's envelope; sequence guard drops stale
  // responses when the selection changes mid-flight.
  const loadEnvelope = useCallback(async () => {
    if (!currentGraph || !selectedId) {
      setEnvelope(null)
      return
    }
    const seq = ++envelopeSeq.current
    try {
      setIsEnvelopeLoading(true)
      setEnvelopeError(null)
      // Statement blocks ALWAYS read in SERIES mode — one column per
      // close-stamped monthly set (plus the scenario's forward months
      // when one is selected). A fixed shape means toggling
      // Actuals↔scenario extends the grid instead of collapsing it to a
      // single period — the explorer is the standing-time-series
      // surface, and statements are a series like everything else.
      const selected = blocks.find((b) => b.id === selectedId)
      const series =
        selected !== undefined && isStatementBlockType(selected.blockType)
      const options =
        scenarioId || series
          ? {
              ...(scenarioId ? { scenarioId } : {}),
              ...(series ? { series: true } : {}),
            }
          : undefined
      const block = await clients.ledger.getInformationBlock(
        currentGraph.graphId,
        selectedId,
        options
      )
      if (seq !== envelopeSeq.current) return
      setEnvelope(block ?? null)
    } catch (err) {
      if (seq !== envelopeSeq.current) return
      console.error('Error loading information block envelope:', err)
      setEnvelopeError('Failed to load this information block.')
    } finally {
      if (seq === envelopeSeq.current) setIsEnvelopeLoading(false)
    }
  }, [currentGraph, selectedId, scenarioId, blocks])

  useEffect(() => {
    loadEnvelope()
  }, [loadEnvelope])

  const handleSelect = useCallback(
    (block: BlockListItem) => {
      setSelectedId(block.id)
      updateUrl(block.id, viewMode, scenarioId)
    },
    [updateUrl, viewMode, scenarioId]
  )

  const handleViewModeChange = useCallback(
    (mode: ViewMode) => {
      setViewMode(mode)
      updateUrl(selectedId, mode, scenarioId)
    },
    [updateUrl, selectedId, scenarioId]
  )

  const handleScenarioChange = useCallback(
    (scenario: string | null) => {
      setScenarioId(scenario)
      updateUrl(selectedId, viewMode, scenario)
    },
    [updateUrl, selectedId, viewMode]
  )

  // Every forecast block IS a scenario — the picker's option set.
  // Instance name FIRST: `displayName` is the block-TYPE label
  // ("Forecast"), which would render every scenario identically.
  const scenarios = useMemo(
    () =>
      blocks
        .filter((b) => b.blockType === 'forecast')
        .map((b) => ({ id: b.id, name: b.name || (b.displayName ?? b.id) })),
    [blocks]
  )

  // The scenario picker renders only where it visibly does something —
  // metric blocks (series extends with "(forecast)" columns) and, since
  // the F-4 statement-series projection landed, statement blocks (a
  // scenario read renders the full monthly grid across the seam).
  // Schedules, disclosures, and the forecast container ignore the
  // filter entirely. The URL param persists across selections, so
  // flipping away and back keeps the chosen scenario.
  const scenarioApplicable = useMemo(() => {
    const selected = blocks.find((b) => b.id === selectedId)
    if (!selected) return false
    return (
      selected.blockType === 'metric' ||
      isStatementBlockType(selected.blockType)
    )
  }, [blocks, selectedId])

  const handleExport = useCallback(() => {
    if (!envelope) return
    const csv = buildRenderingCsv(envelope)
    if (csv) {
      downloadCsv(csv, csvFilename(envelope.displayName ?? envelope.name))
    }
  }, [envelope])

  const canExport =
    (envelope?.view.rendering?.rows.length ?? 0) > 0 && !isEnvelopeLoading

  // No qualifying graph
  if (!currentGraph && !graphState.isLoading) {
    return (
      <PageLayout>
        <PageHeader icon={HiChartBar} title="Block Explorer" />
        <Card>
          <EmptyState
            icon={HiChartBar}
            title="No Ledger Found"
            description="Connect a ledger graph to explore its information blocks."
          />
        </Card>
      </PageLayout>
    )
  }

  return (
    <PageLayout variant="full-width">
      <PageHeader
        icon={HiChartBar}
        title="Block Explorer"
        subtitle={
          currentGraph
            ? 'Explore information blocks as standing time series'
            : undefined
        }
        actions={
          <div className="flex items-center gap-2">
            {scenarioApplicable && (
              <ScenarioSelect
                scenarios={scenarios}
                selectedId={scenarioId}
                onChange={handleScenarioChange}
              />
            )}
            <Button
              size="xs"
              color="light"
              onClick={handleExport}
              disabled={!canExport}
            >
              <HiDownload className="mr-1.5 h-3.5 w-3.5" />
              CSV
            </Button>
            <ViewModeToggle
              viewMode={viewMode}
              onChange={handleViewModeChange}
            />
          </div>
        }
      />

      {listError && (
        <Card>
          <div className="flex items-center gap-2 text-red-500">
            <HiExclamationCircle className="h-5 w-5" />
            <span>{listError}</span>
          </div>
        </Card>
      )}

      <div className="flex gap-6">
        <BlockPicker
          blocks={blocks}
          selectedId={selectedId}
          onSelect={handleSelect}
          isLoading={isListLoading}
        />

        <div className="min-w-0 flex-1">
          <Card>
            {isEnvelopeLoading ? (
              <LoadingState size="xl" className="py-24" />
            ) : envelopeError ? (
              <div className="flex items-center gap-2 py-8 text-red-500">
                <HiExclamationCircle className="h-5 w-5" />
                <span>{envelopeError}</span>
              </div>
            ) : !selectedId ? (
              <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                Select an information block to view.
              </div>
            ) : !envelope ? (
              <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                Information block not found.
              </div>
            ) : (
              <>
                {envelope.blockType === 'metric' && currentGraph && (
                  <ComputePanel
                    graphId={currentGraph.graphId}
                    structureId={envelope.id}
                    onComputed={loadEnvelope}
                  />
                )}
                <BlockView
                  envelope={envelope}
                  viewMode={viewMode}
                  entityName={entityName}
                />
              </>
            )}
          </Card>
        </div>
      </div>
    </PageLayout>
  )
}

export default BlockExplorerContent
