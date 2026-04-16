'use client'

import { PageHeader } from '@/components/PageHeader'
import {
  clients,
  customTheme,
  GraphFilters,
  PageLayout,
  useGraphContext,
} from '@/lib/core'
import type { LedgerClosingBookStructures } from '@robosystems/client/clients'
import { Card, Spinner } from 'flowbite-react'
import type { FC } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { HiExclamationCircle } from 'react-icons/hi'
import { TbBook2 } from 'react-icons/tb'
import AccountRollupsPanel from './components/AccountRollupsPanel'
import PeriodClosePanel from './components/PeriodClosePanel'
import SchedulePanel from './components/SchedulePanel'
import StatementPanel from './components/StatementPanel'
import StructureSidebar, {
  type SelectedItem,
} from './components/StructureSidebar'
import TrialBalancePanel from './components/TrialBalancePanel'
import type { ViewMode } from './components/ViewModeToggle'
import ViewModeToggle from './components/ViewModeToggle'

const CloseContent: FC = function () {
  const { state: graphState } = useGraphContext()

  // Sidebar data — single API call returns all categories
  const [categories, setCategories] = useState<
    LedgerClosingBookStructures['categories']
  >([])
  const [entityName, setEntityName] = useState<string | null>(null)
  const [mappingId, setMappingId] = useState<string | null>(null)
  const [isSidebarLoading, setIsSidebarLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Selection state
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('rendered')

  // Current graph
  const currentGraph = useMemo(() => {
    const roboledgerGraphs = graphState.graphs.filter(GraphFilters.roboledger)
    return (
      roboledgerGraphs.find((g) => g.graphId === graphState.currentGraphId) ??
      roboledgerGraphs[0]
    )
  }, [graphState.graphs, graphState.currentGraphId])

  // Load sidebar data — single call to closing book structures endpoint
  const loadSidebarData = useCallback(async () => {
    if (!currentGraph) {
      setIsSidebarLoading(false)
      return
    }

    try {
      setIsSidebarLoading(true)
      setError(null)

      const [response, entity] = await Promise.all([
        clients.ledger.getClosingBookStructures(currentGraph.graphId),
        clients.ledger.getEntity(currentGraph.graphId).catch(() => null),
      ])

      setCategories(response?.categories ?? [])
      setEntityName(entity?.name ?? null)

      // Extract mapping ID for report regeneration (find first account_rollups item across all categories)
      const rollupItem = (response?.categories ?? [])
        .flatMap((c) => c.items)
        .find((i) => i.itemType === 'account_rollups')
      if (rollupItem) {
        setMappingId(rollupItem.id)
      }

      // Default to the Period Close hub — it's the operational home for
      // the close workflow (fiscal calendar state, drafts, close button).
      // Users can still drill into statements, schedules, or rollups from
      // the sidebar.
      setSelectedItem({ type: 'period_close' })
    } catch (err) {
      console.error('Error loading closing book data:', err)
      setError('Failed to load closing book data.')
    } finally {
      setIsSidebarLoading(false)
    }
  }, [currentGraph])

  useEffect(() => {
    loadSidebarData()
  }, [loadSidebarData])

  // Refresh sidebar data after entry creation
  const handleEntryCreated = useCallback(() => {
    loadSidebarData()
  }, [loadSidebarData])

  // No qualifying graph
  if (!currentGraph && !graphState.isLoading) {
    return (
      <PageLayout>
        <PageHeader
          icon={TbBook2}
          title="Closing Book"
          gradient="from-indigo-500 to-purple-600"
        />
        <Card theme={customTheme.card}>
          <div className="py-12 text-center">
            <TbBook2 className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="font-heading mb-2 text-xl font-bold dark:text-white">
              No Ledger Found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Connect a QuickBooks account to get started with your closing
              book.
            </p>
          </div>
        </Card>
      </PageLayout>
    )
  }

  return (
    <PageLayout variant="full-width">
      <PageHeader
        icon={TbBook2}
        title="Closing Book"
        description={
          currentGraph
            ? 'Financial statements, schedules, and period close'
            : undefined
        }
        gradient="from-indigo-500 to-purple-600"
        actions={<ViewModeToggle viewMode={viewMode} onChange={setViewMode} />}
      />

      {error && (
        <Card theme={customTheme.card}>
          <div className="flex items-center gap-2 text-red-500">
            <HiExclamationCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </Card>
      )}

      <div className="flex gap-6">
        {/* Structure Sidebar */}
        <StructureSidebar
          categories={categories}
          selectedItem={selectedItem}
          onSelect={setSelectedItem}
          isLoading={isSidebarLoading}
        />

        {/* Content Area */}
        <div className="min-w-0 flex-1">
          <Card theme={customTheme.card}>
            {isSidebarLoading ? (
              <div className="flex justify-center py-24">
                <Spinner size="xl" />
              </div>
            ) : !selectedItem ? (
              <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                Select a section from the sidebar to view.
              </div>
            ) : selectedItem.type === 'statement' && currentGraph ? (
              <StatementPanel
                graphId={currentGraph.graphId}
                reportId={selectedItem.reportId}
                structureType={selectedItem.structureType}
                viewMode={viewMode}
                entityName={entityName}
                mappingId={mappingId}
              />
            ) : selectedItem.type === 'schedule' && currentGraph ? (
              <SchedulePanel
                graphId={currentGraph.graphId}
                structureId={selectedItem.structureId}
                scheduleName={selectedItem.name}
                viewMode={viewMode}
              />
            ) : selectedItem.type === 'account_rollups' && currentGraph ? (
              <AccountRollupsPanel
                graphId={currentGraph.graphId}
                mappingId={selectedItem.mappingId}
                viewMode={viewMode}
              />
            ) : selectedItem.type === 'trial_balance' && currentGraph ? (
              <TrialBalancePanel graphId={currentGraph.graphId} />
            ) : selectedItem.type === 'period_close' && currentGraph ? (
              <PeriodClosePanel
                graphId={currentGraph.graphId}
                onEntryCreated={handleEntryCreated}
              />
            ) : null}
          </Card>
        </div>
      </div>
    </PageLayout>
  )
}

export default CloseContent
