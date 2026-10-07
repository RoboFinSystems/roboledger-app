'use client'

import { FilterBar, SearchField } from '@/components/FilterBar'
import { hierarchyDepth, useEntityScope } from '@/lib/entity-scope'
import { useLedgerGraph } from '@/lib/useLedgerGraph'
import type { LedgerEntitySummary } from '@robosystems/client/clients'
import {
  clients,
  EmptyState,
  LoadingState,
  PageHeader,
  PageLayout,
  useGraphContext,
} from '@robosystems/core'
import {
  Badge,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'flowbite-react'
import { useSearchParams } from 'next/navigation'
import type { FC } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { HiOfficeBuilding, HiPlus } from 'react-icons/hi'
import NewEntityModal from './components/NewEntityModal'

const TYPE_LABELS: Record<string, string> = {
  corporation: 'Corporation',
  llc: 'LLC',
  partnership: 'Partnership',
  sole_proprietorship: 'Sole proprietorship',
  non_profit: 'Non-profit',
}

/** What the ledger facades take for an entity: a subsidiary's id, or null for the parent. */
const scopeOf = (entity: LedgerEntitySummary): string | null =>
  entity.isParent ? null : entity.id

function formatOwnership(pct: number | null): string {
  if (pct === null) return '—'
  return `${Number.isInteger(pct) ? pct : pct.toFixed(2)}%`
}

/**
 * The reporting group of the selected graph: the group parent and every
 * subsidiary under it, each with its own close. Selecting a row puts that
 * entity in the header, and every ledger page reads its books.
 */
const EntitiesListPageContent: FC = function () {
  const { state: graphState } = useGraphContext()
  const { graph } = useLedgerGraph()
  const {
    entities,
    entity: current,
    isLoading,
    select,
    refresh,
  } = useEntityScope()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [newOpen, setNewOpen] = useState(false)
  const [closedThrough, setClosedThrough] = useState<
    Record<string, string | null | undefined>
  >({})

  // The header's "Add Entity" lands here with the form open.
  useEffect(() => {
    if (searchParams?.get('new') === '1') setNewOpen(true)
  }, [searchParams])

  const graphId = graph?.graphId ?? null

  // Close status per entity: each closes on its own calendar. Undefined is
  // "not read", null is "no calendar yet", a string is the month.
  useEffect(() => {
    if (!graphId || entities.length === 0) {
      setClosedThrough({})
      return
    }
    let cancelled = false
    void (async () => {
      const results = await Promise.allSettled(
        entities.map((e) =>
          clients.ledger
            .getFiscalCalendar(graphId, { entityId: scopeOf(e) })
            .then((cal) => [e.id, cal?.closedThrough ?? null] as const)
        )
      )
      if (cancelled) return
      const next: Record<string, string | null | undefined> = {}
      for (const result of results) {
        if (result.status === 'fulfilled') {
          const [id, month] = result.value
          next[id] = month
        }
      }
      setClosedThrough(next)
    })()
    return () => {
      cancelled = true
    }
  }, [graphId, entities])

  const filtered = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase()
    if (!needle) return entities
    return entities.filter(
      (e) =>
        e.name.toLowerCase().includes(needle) ||
        (e.legalName ?? '').toLowerCase().includes(needle) ||
        (e.ticker ?? '').toLowerCase().includes(needle)
    )
  }, [entities, searchTerm])

  const count = entities.length
  const subtitle = graph
    ? `${graph.graphName} · ${count} ${count === 1 ? 'entity' : 'entities'}`
    : 'The reporting group of the selected graph'

  if (!graph && !graphState.isLoading) {
    return (
      <PageLayout>
        <PageHeader icon={HiOfficeBuilding} title="Entities" />
        <Card>
          <EmptyState
            icon={HiOfficeBuilding}
            title="No Ledger Found"
            description="Select a RoboLedger graph to see its entities."
          />
        </Card>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <PageHeader
        icon={HiOfficeBuilding}
        title="Entities"
        subtitle={subtitle}
        actions={
          graphId ? (
            <Button size="sm" color="blue" onClick={() => setNewOpen(true)}>
              <HiPlus className="mr-1 h-4 w-4" />
              New Entity
            </Button>
          ) : undefined
        }
      />

      <FilterBar>
        <SearchField
          id="search"
          placeholder="Search entities…"
          value={searchTerm}
          onChange={setSearchTerm}
        />
      </FilterBar>

      <Card>
        <div className="overflow-x-auto">
          {isLoading && entities.length === 0 ? (
            <LoadingState />
          ) : entities.length === 0 ? (
            <EmptyState
              icon={HiOfficeBuilding}
              title="No Entities Yet"
              description="Create the first entity of this graph. It becomes the group parent."
              className="p-8"
              action={
                graphId ? (
                  <Button
                    size="sm"
                    color="blue"
                    onClick={() => setNewOpen(true)}
                  >
                    <HiPlus className="mr-1 h-4 w-4" />
                    New Entity
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <Table>
              <TableHead>
                <tr>
                  <TableHeadCell>Entity</TableHeadCell>
                  <TableHeadCell>Legal form</TableHeadCell>
                  <TableHeadCell>Ownership</TableHeadCell>
                  <TableHeadCell>Closed through</TableHeadCell>
                  <TableHeadCell>Status</TableHeadCell>
                  <TableHeadCell>
                    <span className="sr-only">Select</span>
                  </TableHeadCell>
                </tr>
              </TableHead>
              <TableBody>
                {filtered.map((row) => {
                  const isSelected = current?.id === row.id
                  const depth = hierarchyDepth(row, entities)
                  const month = closedThrough[row.id]
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium text-gray-900 dark:text-white">
                        <div
                          className="flex flex-col"
                          style={{ paddingLeft: `${depth * 20}px` }}
                        >
                          <span className="font-semibold">
                            {row.name}
                            {row.isParent && count > 1 && (
                              <Badge
                                color="indigo"
                                size="xs"
                                className="ml-2 inline"
                              >
                                group parent
                              </Badge>
                            )}
                          </span>
                          <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                            {row.ticker ?? row.id}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {row.entityType
                            ? (TYPE_LABELS[row.entityType] ?? row.entityType)
                            : '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {row.isParent
                            ? '—'
                            : formatOwnership(row.ownershipPct)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {month === undefined
                            ? '…'
                            : month === null
                              ? 'Not initialized'
                              : month}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          color={row.status === 'active' ? 'success' : 'gray'}
                          size="sm"
                        >
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {isSelected ? (
                          <Badge color="success" size="sm">
                            selected
                          </Badge>
                        ) : graphId ? (
                          <Button
                            size="xs"
                            color="light"
                            onClick={() => void select(row, graphId)}
                          >
                            Select
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>

      {graphId && (
        <NewEntityModal
          graphId={graphId}
          entities={entities}
          open={newOpen}
          onClose={() => setNewOpen(false)}
          onCreated={() => {
            setNewOpen(false)
            void refresh()
          }}
        />
      )}
    </PageLayout>
  )
}

export default EntitiesListPageContent
