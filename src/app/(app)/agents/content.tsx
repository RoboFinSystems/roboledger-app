'use client'

import {
  clients,
  customTheme,
  GraphFilters,
  PageHeader,
  PageLayout,
  useGraphContext,
} from '@/lib/core'
import { Spinner } from '@/lib/core/ui-components'
import { formatDate } from '@/lib/ledger/formatters'
import type { LedgerAgent } from '@robosystems/client/clients'
import {
  Alert,
  Badge,
  Card,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  TextInput,
} from 'flowbite-react'
import { useSearchParams } from 'next/navigation'
import { type FC, useEffect, useMemo, useState } from 'react'
import { HiExclamationCircle, HiSearch, HiUserGroup } from 'react-icons/hi'
import AgentDetailModal from './AgentDetailModal'

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'customer', label: 'Customer' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'employee', label: 'Employee' },
]

const SOURCE_OPTIONS = [
  { value: '', label: 'All sources' },
  { value: 'quickbooks', label: 'QuickBooks' },
  { value: 'manual', label: 'Manual' },
  { value: 'system', label: 'System' },
]

const TYPE_BADGE_COLOR: Record<string, string> = {
  customer: 'success',
  vendor: 'warning',
  employee: 'purple',
}

const AGENTS_LIMIT = 500

const AgentsContent: FC = function () {
  const { state: graphState } = useGraphContext()
  const searchParams = useSearchParams()
  const initialId = searchParams.get('id')

  const [agents, setAgents] = useState<LedgerAgent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [truncated, setTruncated] = useState(false)

  const [agentType, setAgentType] = useState('')
  const [source, setSource] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(initialId)

  const currentGraph = useMemo(
    () =>
      graphState.graphs
        .filter(GraphFilters.roboledger)
        .find((g) => g.graphId === graphState.currentGraphId),
    [graphState.graphs, graphState.currentGraphId]
  )

  // Inlined into the effect so the cleanup `cancelled` flag is local to
  // each invocation — prevents a stale response from overwriting state if
  // currentGraph or filters change mid-flight.
  useEffect(() => {
    if (!currentGraph) {
      setAgents([])
      setIsLoading(false)
      setTruncated(false)
      return
    }

    let cancelled = false
    void (async () => {
      try {
        setIsLoading(true)
        setError(null)
        const list = await clients.ledger.listAgents(currentGraph.graphId, {
          agentType: agentType || undefined,
          source: source || undefined,
          limit: AGENTS_LIMIT,
        })
        if (cancelled) return
        list.sort((a, b) => a.name.localeCompare(b.name))
        setAgents(list)
        setTruncated(list.length >= AGENTS_LIMIT)
      } catch (err) {
        if (cancelled) return
        console.error('Error loading agents:', err)
        setError('Failed to load agents. Try again or check the connection.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [currentGraph, agentType, source])

  const filteredAgents = useMemo(() => {
    if (!searchTerm) return agents
    const needle = searchTerm.toLowerCase()
    return agents.filter(
      (a) =>
        a.name.toLowerCase().includes(needle) ||
        (a.legalName || '').toLowerCase().includes(needle) ||
        (a.email || '').toLowerCase().includes(needle) ||
        (a.externalId || '').toLowerCase().includes(needle)
    )
  }, [agents, searchTerm])

  return (
    <PageLayout>
      <PageHeader
        icon={HiUserGroup}
        title="Agents"
        subtitle="Counterparties — customers, vendors, employees"
      />

      <Card theme={customTheme.card}>
        <div className="flex flex-wrap items-end gap-4 p-4">
          <div className="w-full sm:w-64">
            <label
              htmlFor="search"
              className="mb-1 block text-xs text-gray-500 dark:text-gray-400"
            >
              Search
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <HiSearch className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </div>
              <TextInput
                theme={customTheme.textInput}
                id="search"
                placeholder="Name, email, ext id…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="w-full sm:w-44">
            <label
              htmlFor="agentType"
              className="mb-1 block text-xs text-gray-500 dark:text-gray-400"
            >
              Type
            </label>
            <Select
              id="agentType"
              theme={customTheme.select}
              value={agentType}
              onChange={(e) => setAgentType(e.target.value)}
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="w-full sm:w-44">
            <label
              htmlFor="source"
              className="mb-1 block text-xs text-gray-500 dark:text-gray-400"
            >
              Source
            </label>
            <Select
              id="source"
              theme={customTheme.select}
              value={source}
              onChange={(e) => setSource(e.target.value)}
            >
              {SOURCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {error && (
        <Alert theme={customTheme.alert} color="failure">
          <HiExclamationCircle className="h-4 w-4" />
          <span className="font-medium">Error.</span> {error}
        </Alert>
      )}

      <Card theme={customTheme.card}>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : agents.length === 0 ? (
            <div className="p-8 text-center">
              <HiUserGroup className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <h3 className="font-heading mb-2 text-xl font-bold dark:text-white">
                No agents
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Sync a connection to populate customers, vendors, and employees.
              </p>
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="p-8 text-center">
              <HiSearch className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <h3 className="font-heading mb-2 text-xl font-bold dark:text-white">
                No matches
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Try adjusting search or filters.
              </p>
            </div>
          ) : (
            <Table theme={customTheme.table}>
              <TableHead>
                <TableHeadCell>Name</TableHeadCell>
                <TableHeadCell>Type</TableHeadCell>
                <TableHeadCell>Email</TableHeadCell>
                <TableHeadCell>Phone</TableHeadCell>
                <TableHeadCell>Source</TableHeadCell>
                <TableHeadCell>Created</TableHeadCell>
              </TableHead>
              <TableBody>
                {filteredAgents.map((a) => (
                  <TableRow
                    key={a.id}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => setSelectedId(a.id)}
                  >
                    <TableCell className="font-medium text-gray-900 dark:text-white">
                      <div className="flex flex-col">
                        <span>{a.name}</span>
                        {a.legalName && a.legalName !== a.name && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {a.legalName}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        color={TYPE_BADGE_COLOR[a.agentType] || 'gray'}
                        size="sm"
                      >
                        {a.agentType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-700 dark:text-gray-300">
                      {a.email || '—'}
                    </TableCell>
                    <TableCell className="text-gray-700 dark:text-gray-300">
                      {a.phone || '—'}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {a.source}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(a.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {!isLoading && filteredAgents.length > 0 && (
          <div className="border-t border-gray-200 p-4 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {filteredAgents.length} of {agents.length} agents
              {truncated && (
                <span className="ml-2 text-amber-600 dark:text-amber-400">
                  (limit {AGENTS_LIMIT} reached — narrow filters to see more)
                </span>
              )}
            </p>
          </div>
        )}
      </Card>

      {currentGraph && selectedId && (
        <AgentDetailModal
          graphId={currentGraph.graphId}
          agentId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </PageLayout>
  )
}

export default AgentsContent
