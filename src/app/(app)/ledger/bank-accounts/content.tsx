'use client'

import { FilterBar, FilterSelect, SearchField } from '@/components/FilterBar'
import { useEntityScope } from '@/lib/entity-scope'
import { apiErrorMessage } from '@/lib/ledger/errors'
import { useLedgerGraph } from '@/lib/useLedgerGraph'
import type { LedgerBankAccount } from '@robosystems/client/clients'
import {
  clients,
  EmptyState,
  LoadingState,
  PageHeader,
  PageLayout,
  useGraphContext,
  useToast,
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
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { FC } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { HiLibrary, HiPlus, HiSwitchHorizontal } from 'react-icons/hi'
import MoveAccountModal, {
  type MoveResult,
} from './components/MoveAccountModal'

const SOURCE_LABELS: Record<string, string> = {
  plaid: 'Plaid',
  mercury: 'Mercury',
  quickbooks: 'QuickBooks',
}

const KIND_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'bank', label: 'Bank' },
  { value: 'credit', label: 'Credit' },
]

/** What the row's connection is doing, in the words of the connections page. */
function statusOf(row: LedgerBankAccount): {
  label: string
  color: 'success' | 'warning' | 'gray' | 'info'
} | null {
  if (!row.source) return null
  switch (row.connectionStatus) {
    case 'needs_reauth':
      return { label: 'Reconnect', color: 'warning' }
    case 'pending_oauth':
      return { label: 'Awaiting sign-in', color: 'info' }
    case 'active':
    case 'connected':
      return { label: 'Auto-synced', color: 'success' }
    case null:
    case undefined:
      return null
    default:
      return { label: row.connectionStatus, color: 'gray' }
  }
}

function sourceOf(row: LedgerBankAccount): string {
  if (!row.source) return 'Kept by hand'
  const provider = SOURCE_LABELS[row.source] ?? row.source
  return row.institution ? `${row.institution} · ${provider}` : provider
}

function formatSync(iso: string | null): string {
  if (!iso) return '—'
  const hasTz = /[Z+-]\d{0,2}:?\d{0,2}$/i.test(iso) || iso.endsWith('Z')
  const ms = Date.parse(hasTz ? iso : `${iso}Z`)
  if (Number.isNaN(ms)) return '—'
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * The group's bank and card accounts. A row is a chart account a feed books
 * to, or one QuickBooks types as a bank or card account; its entity is the
 * one whose chart it is in, which is where its lines go. Moving a feed
 * account to another entity's chart moves the feed with it.
 */
const BankAccountsContent: FC = function () {
  const { state: graphState } = useGraphContext()
  const { graph } = useLedgerGraph()
  const { entities } = useEntityScope()
  const router = useRouter()
  const { showError, showSuccess, ToastContainer } = useToast()
  const [rows, setRows] = useState<LedgerBankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [kind, setKind] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [moving, setMoving] = useState<LedgerBankAccount | null>(null)

  const graphId = graph?.graphId ?? null

  const load = useCallback(async () => {
    if (!graphId) {
      setRows([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const list = await clients.ledger.listBankAccounts(graphId)
      setRows(list?.accounts ?? [])
    } catch (err) {
      setRows([])
      setError(apiErrorMessage(err, 'The ledger did not answer. Try again.'))
    } finally {
      setLoading(false)
    }
  }, [graphId])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase()
    return rows.filter((row) => {
      if (kind !== 'all' && row.kind !== kind) return false
      if (!needle) return true
      return [
        row.name,
        row.code ?? '',
        row.entityName ?? '',
        row.institution ?? '',
        row.feedAccountName ?? '',
      ].some((value) => value.toLowerCase().includes(needle))
    })
  }, [rows, kind, searchTerm])

  const handleMoved = (result: MoveResult) => {
    setMoving(null)
    const parts = [
      result.account_created
        ? 'Account created in the entity’s chart'
        : 'Account linked',
    ]
    if (result.events_repointed > 0) {
      parts.push(
        `${result.events_repointed} inbox ${result.events_repointed === 1 ? 'line' : 'lines'} moved`
      )
    }
    if (result.events_unclassified > 0) {
      parts.push(
        `${result.events_unclassified} returned to the inbox to classify`
      )
    }
    if (result.pairs_across_entities > 0) {
      parts.push(
        `${result.pairs_across_entities} ${result.pairs_across_entities === 1 ? 'transfer now crosses' : 'transfers now cross'} two entities`
      )
    }
    showSuccess(parts.join(' · '))
    void load()
  }

  const count = rows.length
  const subtitle = graph
    ? `${graph.graphName} · ${count} ${count === 1 ? 'account' : 'accounts'}`
    : 'The bank and card accounts of the selected graph'

  if (!graph && !graphState.isLoading) {
    return (
      <PageLayout>
        <PageHeader icon={HiLibrary} title="Bank Accounts" />
        <Card>
          <EmptyState
            icon={HiLibrary}
            title="No Ledger Found"
            description="Select a RoboLedger graph to see its bank accounts."
          />
        </Card>
      </PageLayout>
    )
  }

  const showEntity = entities.length > 1

  return (
    <PageLayout>
      <ToastContainer />
      <PageHeader
        icon={HiLibrary}
        title="Bank Accounts"
        subtitle={subtitle}
        actions={
          <Button
            size="sm"
            color="blue"
            onClick={() => router.push('/connections')}
          >
            <HiPlus className="mr-1 h-4 w-4" />
            Add account
          </Button>
        }
      />

      <FilterBar>
        <SearchField
          id="search"
          placeholder="Search accounts…"
          value={searchTerm}
          onChange={setSearchTerm}
        />
        <FilterSelect id="kind" label="Type" value={kind} onChange={setKind}>
          {KIND_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </FilterSelect>
      </FilterBar>

      <Card>
        <div className="overflow-x-auto">
          {loading && rows.length === 0 ? (
            <LoadingState />
          ) : error ? (
            <EmptyState
              icon={HiLibrary}
              title="Bank accounts could not be loaded"
              description={error}
              className="p-8"
              action={
                <Button size="sm" color="gray" onClick={() => void load()}>
                  Retry
                </Button>
              }
            />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={HiLibrary}
              title="No bank accounts yet"
              description="Connect a bank under Connections. Each account it exposes is linked to a chart account, and its transactions land in the inbox."
              className="p-8"
              action={
                <Button
                  size="sm"
                  color="blue"
                  onClick={() => router.push('/connections')}
                >
                  <HiPlus className="mr-1 h-4 w-4" />
                  Add account
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHead>
                <tr>
                  <TableHeadCell>Account</TableHeadCell>
                  {showEntity && <TableHeadCell>Entity</TableHeadCell>}
                  <TableHeadCell>Source</TableHeadCell>
                  <TableHeadCell>Status</TableHeadCell>
                  <TableHeadCell>Last sync</TableHeadCell>
                  <TableHeadCell>Type</TableHeadCell>
                  <TableHeadCell>
                    <span className="sr-only">Actions</span>
                  </TableHeadCell>
                </tr>
              </TableHead>
              <TableBody>
                {filtered.map((row) => {
                  const status = statusOf(row)
                  const movable = Boolean(row.feedAccountId && row.connectionId)
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium text-gray-900 dark:text-white">
                        <div className="flex flex-col">
                          <span className="font-semibold">{row.name}</span>
                          <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                            {row.code ?? row.feedAccountName ?? row.id}
                          </span>
                        </div>
                      </TableCell>
                      {showEntity && (
                        <TableCell>{row.entityName ?? '—'}</TableCell>
                      )}
                      <TableCell>{sourceOf(row)}</TableCell>
                      <TableCell>
                        {status ? (
                          status.label === 'Reconnect' ? (
                            <Link
                              href="/connections"
                              className="text-yellow-700 underline dark:text-yellow-400"
                            >
                              Reconnect
                            </Link>
                          ) : (
                            <Badge color={status.color} className="inline">
                              {status.label}
                            </Badge>
                          )
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>{formatSync(row.lastSyncAt)}</TableCell>
                      <TableCell>
                        {row.kind === 'credit' ? 'Credit' : 'Bank'}
                      </TableCell>
                      <TableCell className="text-right">
                        {movable && (
                          <Button
                            size="xs"
                            color="gray"
                            onClick={() => setMoving(row)}
                            title="Change the chart account this feed books to"
                          >
                            <HiSwitchHorizontal className="mr-1 h-3 w-3" />
                            Move
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>
        {rows.length > 0 && (
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            An account books to the entity whose chart it is in. Moving a feed
            account moves the lines still in the inbox with it; posted entries
            stay where they were posted.
          </p>
        )}
      </Card>

      <MoveAccountModal
        show={moving !== null}
        account={moving}
        entities={entities}
        graphId={graphId}
        onClose={() => setMoving(null)}
        onMoved={handleMoved}
        onError={(message) => showError(message)}
      />
    </PageLayout>
  )
}

export default BankAccountsContent
