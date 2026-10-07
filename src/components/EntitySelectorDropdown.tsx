'use client'

import { useCreateGraphHandoff } from '@/lib/cross-app'
import { hierarchyDepth, useEntityScope } from '@/lib/entity-scope'
import type { LedgerEntitySummary } from '@robosystems/client/clients'
import { GraphFilters, useGraphContext } from '@robosystems/core'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  HiChevronDown,
  HiOfficeBuilding,
  HiPlus,
  HiSearch,
} from 'react-icons/hi'

/**
 * The entity switcher in the header.
 *
 * Lists every entity of every RoboLedger graph, grouped by graph and ordered
 * by hierarchy (the group parent, then its subsidiaries indented), with a
 * search box: a fund-admin or a holding company runs to dozens of entities,
 * which a dropdown cannot carry. Picking an entity in another graph switches
 * the graph first.
 */
export function EntitySelectorDropdown() {
  const { state: graphState } = useGraphContext()
  const { entitiesByGraph, entity, isLoading, select } = useEntityScope()
  const { openCreateGraph } = useCreateGraphHandoff()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  const roboledgerGraphs = useMemo(
    () => graphState.graphs.filter(GraphFilters.roboledger),
    [graphState.graphs]
  )

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      searchRef.current?.focus()
    }
  }, [isOpen])

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return roboledgerGraphs
      .map((graph) => {
        const all = entitiesByGraph.get(graph.graphId) ?? []
        const graphMatches =
          needle.length > 0 && graph.graphName.toLowerCase().includes(needle)
        const rows = all.filter(
          (e) =>
            needle.length === 0 ||
            graphMatches ||
            e.name.toLowerCase().includes(needle) ||
            (e.legalName ?? '').toLowerCase().includes(needle) ||
            (e.ticker ?? '').toLowerCase().includes(needle)
        )
        return { graph, all, rows }
      })
      .filter((g) => g.rows.length > 0)
  }, [roboledgerGraphs, entitiesByGraph, query])

  const totalEntities = useMemo(
    () =>
      roboledgerGraphs.reduce(
        (n, g) => n + (entitiesByGraph.get(g.graphId)?.length ?? 0),
        0
      ),
    [roboledgerGraphs, entitiesByGraph]
  )
  const hasNoGraphs = roboledgerGraphs.length === 0
  const hasNoEntities = !isLoading && totalEntities === 0

  const handleSelect = async (target: LedgerEntitySummary, graphId: string) => {
    setIsOpen(false)
    await select(target, graphId)
  }

  // If no graphs, link to platform to create one
  if (hasNoGraphs) {
    return (
      <button
        onClick={() => void openCreateGraph()}
        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
      >
        <HiOfficeBuilding className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <span className="font-medium text-gray-900 dark:text-gray-100">
          Create Graph
        </span>
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => !hasNoEntities && setIsOpen(!isOpen)}
        disabled={hasNoEntities}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:disabled:hover:bg-gray-700"
      >
        <HiOfficeBuilding className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <span className="max-w-56 truncate font-medium text-gray-900 dark:text-gray-100">
          {entity?.name || 'Select Entity'}
        </span>
        <HiChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setIsOpen(false)
            }}
            role="button"
            tabIndex={0}
            aria-label="Close entity selector"
          />

          {/* Dropdown */}
          <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
            <div className="border-b border-gray-200 p-2 dark:border-gray-600">
              <div className="relative">
                <HiSearch className="pointer-events-none absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setIsOpen(false)
                  }}
                  placeholder="Search entities…"
                  aria-label="Search entities"
                  className="w-full rounded-md border border-gray-300 bg-white py-1.5 pr-2 pl-8 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto" role="listbox">
              {isLoading && totalEntities === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  Loading entities...
                </div>
              ) : groups.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  No entities match “{query}”.
                </div>
              ) : (
                groups.map(({ graph, all, rows }) => (
                  <div
                    key={graph.graphId}
                    className="border-b border-gray-200 last:border-0 dark:border-gray-600"
                  >
                    <div className="px-4 pt-2 pb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                      {graph.graphName}
                    </div>
                    {rows.map((row) => {
                      const isSelected =
                        entity?.id === row.id &&
                        graphState.currentGraphId === graph.graphId
                      const depth = hierarchyDepth(row, all)
                      return (
                        <button
                          key={row.id}
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => void handleSelect(row, graph.graphId)}
                          className={`flex w-full items-center gap-2 px-4 py-2 text-left transition-colors ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-900/30'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                          style={{ paddingLeft: `${16 + depth * 16}px` }}
                        >
                          <span
                            className={`truncate text-sm ${
                              isSelected
                                ? 'font-medium text-blue-700 dark:text-blue-300'
                                : 'text-gray-900 dark:text-gray-100'
                            }`}
                          >
                            {row.name}
                          </span>
                          {row.ticker && (
                            <span className="shrink-0 font-mono text-xs text-gray-500 dark:text-gray-400">
                              {row.ticker}
                            </span>
                          )}
                          {row.isParent && all.length > 1 && (
                            <span className="ml-auto shrink-0 text-xs text-gray-400 dark:text-gray-500">
                              parent
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ))
              )}
            </div>

            <div className="flex divide-x divide-gray-200 border-t-2 border-gray-300 dark:divide-gray-600 dark:border-gray-600">
              {graphState.currentGraphId &&
                entitiesByGraph.has(graphState.currentGraphId) && (
                  <Link
                    href="/entities?new=1"
                    onClick={() => setIsOpen(false)}
                    className="flex flex-1 items-center justify-center gap-1 px-3 py-3 text-sm font-medium text-blue-600 transition-colors hover:bg-gray-50 dark:text-blue-400 dark:hover:bg-gray-700"
                  >
                    <HiPlus className="h-4 w-4" />
                    Add Entity
                  </Link>
                )}
              <button
                onClick={() => void openCreateGraph()}
                className="flex flex-1 items-center justify-center gap-1 px-3 py-3 text-sm font-medium text-blue-600 transition-colors hover:bg-gray-50 dark:text-blue-400 dark:hover:bg-gray-700"
              >
                <HiPlus className="h-4 w-4" />
                New Graph
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
