'use client'

import {
  FilterActions,
  FilterBar,
  FilterDate,
  FilterField,
} from '@/components/FilterBar'
import SegmentedControl, {
  type SegmentedOption,
} from '@/components/SegmentedControl'
import { useEntityScope } from '@/lib/entity-scope'
import { formatAmount, formatDate } from '@/lib/ledger/formatters'
import { useLedgerGraph } from '@/lib/useLedgerGraph'
import type {
  LedgerAgedAgentRow,
  LedgerAgedBalances,
  LedgerAgingBuckets,
  LedgerOpenItem,
  LedgerOpenItemKind,
} from '@robosystems/client/clients'
import {
  clients,
  EmptyState,
  LoadingState,
  PageHeader,
  PageLayout,
} from '@robosystems/core'
import {
  Alert,
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
import type { FC } from 'react'
import { Fragment, useEffect, useRef, useState } from 'react'
import {
  HiCash,
  HiCheckCircle,
  HiChevronDown,
  HiChevronRight,
  HiDownload,
  HiExclamationCircle,
} from 'react-icons/hi'

type Scope = 'entity' | 'group'

const KIND_OPTIONS: readonly SegmentedOption<LedgerOpenItemKind>[] = [
  { value: 'receivables', label: 'Receivables' },
  { value: 'payables', label: 'Payables' },
]

const SCOPE_OPTIONS: readonly SegmentedOption<Scope>[] = [
  { value: 'entity', label: 'This entity' },
  { value: 'group', label: 'Group' },
]

type BucketKey = Exclude<keyof LedgerAgingBuckets, 'totalCents'>

const BUCKETS: readonly { key: BucketKey; label: string }[] = [
  { key: 'currentCents', label: 'Current' },
  { key: 'oneToThirtyCents', label: '1–30 days' },
  { key: 'thirtyOneToSixtyCents', label: '31–60 days' },
  { key: 'sixtyOneToNinetyCents', label: '61–90 days' },
  { key: 'overNinetyCents', label: 'Over 90 days' },
]

/** The last day of a `YYYY-MM` month, as `YYYY-MM-DD`. */
export function monthEnd(period: string): string {
  const [year, month] = period.split('-').map(Number)
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10)
}

function today(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`
}

const csvCell = (value: string | number | null): string => {
  const text = value === null ? '' : String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** A synced name opened in a spreadsheet must stay text: one that starts like
 *  a formula is prefixed so it never runs as one. */
export const textCell = (text: string): string =>
  /^[=+\-@\t\r]/.test(text) ? `'${text}` : text

/** The counterparty table as CSV: one row per counterparty, amounts in the
 *  currency's units. */
export function agingCsv(aged: LedgerAgedBalances): string {
  const header = [
    'Counterparty',
    ...BUCKETS.map((b) => b.label),
    'Unapplied credit',
    'Total',
    'Open items',
    'Oldest due date',
  ]
  const rows = aged.agents.map((row) => [
    textCell(row.agentName ?? 'No counterparty'),
    ...BUCKETS.map((b) => row.buckets[b.key] / 100),
    row.buckets.unappliedCreditCents / 100,
    row.buckets.totalCents / 100,
    row.openItemCount,
    row.oldestDueDate,
  ])
  return [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\n')
}

function downloadCsv(aged: LedgerAgedBalances): void {
  const blob = new Blob([agingCsv(aged)], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${aged.kind}-aging-${aged.asOf}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

type Drill = LedgerOpenItem[] | 'loading' | 'error'

const ReceivablesPayablesContent: FC = function () {
  const { graph } = useLedgerGraph()
  const graphId = graph?.graphId ?? null
  const { entityId, entities } = useEntityScope()
  // The group is offered on the parent of a graph holding more than one
  // operating entity, as on the statements page.
  const canGroup =
    entityId === null &&
    entities.filter((e) => e.entityRole !== 'consolidation').length > 1
  const nameOf = (id: string): string =>
    entities.find((e) => e.id === id)?.name ?? id

  const [kind, setKind] = useState<LedgerOpenItemKind>('receivables')
  const [scope, setScope] = useState<Scope>('entity')
  const requestScope: Scope = canGroup ? scope : 'entity'
  // Empty until the default resolves: the last closed month-end, else today.
  const [asOf, setAsOf] = useState('')
  const [asOfChosen, setAsOfChosen] = useState(false)
  const [aged, setAged] = useState<LedgerAgedBalances | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drills, setDrills] = useState<Record<string, Drill>>({})

  useEffect(() => {
    setScope('entity')
    setAsOfChosen(false)
    // Cleared so nothing is read at the last entity's date while this one's
    // default resolves.
    setAsOf('')
  }, [graphId, entityId])

  useEffect(() => {
    if (!graphId || asOfChosen) return
    let cancelled = false
    clients.ledger
      .getFiscalCalendar(graphId, { entityId })
      .then((calendar) => {
        if (cancelled) return
        const closed = calendar?.closedThrough
        setAsOf(closed ? monthEnd(closed) : today())
      })
      .catch(() => {
        if (!cancelled) setAsOf(today())
      })
    return () => {
      cancelled = true
    }
  }, [graphId, entityId, asOfChosen])

  const loadSeq = useRef(0)
  useEffect(() => {
    if (!graphId || !asOf) return
    const seq = ++loadSeq.current
    setIsLoading(true)
    setError(null)
    setDrills({})
    clients.ledger
      .getAgedBalances(graphId, kind, {
        asOf,
        entityId,
        scope: requestScope,
      })
      .then((result) => {
        if (seq === loadSeq.current) setAged(result)
      })
      .catch((err) => {
        if (seq !== loadSeq.current) return
        console.error('Error loading aged balances:', err)
        setAged(null)
        setError('Failed to load the aging. Please try again.')
      })
      .finally(() => {
        if (seq === loadSeq.current) setIsLoading(false)
      })
  }, [graphId, kind, asOf, entityId, requestScope])

  // A row opens into its documents for one entity's books; a group row sums
  // several entities' books, so it does not drill.
  const drillable = requestScope === 'entity'
  const toggle = (row: LedgerAgedAgentRow) => {
    const agentId = row.agentId
    if (!graphId || !agentId || !drillable) return
    if (drills[agentId]) {
      setDrills(({ [agentId]: _closed, ...rest }) => rest)
      return
    }
    setDrills((d) => ({ ...d, [agentId]: 'loading' }))
    // A reload of the aging clears the drills; a drill that answers after one
    // belongs to the table it replaced.
    const seq = loadSeq.current
    clients.ledger
      .getOpenItemsForAgent(graphId, agentId, kind, { asOf, entityId })
      .then((items) => {
        if (seq === loadSeq.current)
          setDrills((d) => ({ ...d, [agentId]: items }))
      })
      .catch(() => {
        if (seq === loadSeq.current)
          setDrills((d) => ({ ...d, [agentId]: 'error' }))
      })
  }

  const noun = kind === 'receivables' ? 'customer' : 'vendor'

  return (
    <PageLayout>
      <PageHeader
        icon={HiCash}
        title="Receivables & Payables"
        subtitle="Who owes the company and how late it is, whom it owes and when it falls due"
      />

      <FilterBar>
        <FilterField label="Show">
          <SegmentedControl
            options={KIND_OPTIONS}
            value={kind}
            onChange={setKind}
            ariaLabel="Show"
          />
        </FilterField>
        {canGroup && (
          <FilterField label="Scope">
            <SegmentedControl
              options={SCOPE_OPTIONS}
              value={scope}
              onChange={setScope}
              ariaLabel="Scope"
            />
          </FilterField>
        )}
        <FilterDate
          id="as-of"
          label="As of"
          value={asOf}
          onChange={(value) => {
            setAsOfChosen(true)
            setAsOf(value)
          }}
        />
        <FilterActions>
          <Button
            size="sm"
            color="light"
            disabled={!aged || aged.agents.length === 0}
            onClick={() => aged && downloadCsv(aged)}
          >
            <HiDownload className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </FilterActions>
      </FilterBar>

      {error && (
        <Alert color="failure">
          <HiExclamationCircle className="h-4 w-4" />
          <span className="font-medium">Error!</span> {error}
        </Alert>
      )}

      {isLoading ? (
        <Card>
          <LoadingState />
        </Card>
      ) : aged ? (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
            {BUCKETS.map((bucket) => (
              <Card key={bucket.key} className="p-3">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {bucket.label}
                </div>
                <div className="mt-1 font-mono text-lg text-gray-900 dark:text-white">
                  {formatAmount(aged.buckets[bucket.key], 'USD')}
                </div>
              </Card>
            ))}
            <Card className="p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Total open
              </div>
              <div className="mt-1 font-mono text-lg font-semibold text-gray-900 dark:text-white">
                {formatAmount(aged.buckets.totalCents, 'USD')}
              </div>
              {aged.buckets.unappliedCreditCents !== 0 && (
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  includes{' '}
                  {formatAmount(aged.buckets.unappliedCreditCents, 'USD')}{' '}
                  unapplied credit
                </div>
              )}
            </Card>
          </div>

          {aged.defaultedDueDateCount > 0 && (
            <Alert color="warning">
              {aged.defaultedDueDateCount === 1
                ? '1 open item has no due date of its own and is aged as due on receipt.'
                : `${aged.defaultedDueDateCount} open items have no due date of their own and are aged as due on receipt.`}{' '}
              Set a due date on the{' '}
              {kind === 'receivables' ? 'invoice' : 'bill'} to age it on its
              terms.
            </Alert>
          )}

          <Card>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Tie-out to the ledger
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Each entity&apos;s open items against its{' '}
              {kind === 'receivables' ? 'receivables' : 'payables'} account at
              the date. A difference is a document never settled, or a movement
              with no document behind it: a write-off, an unlinked payment, an
              opening balance, or an entry not yet posted.
            </p>
            <div className="mt-2 space-y-2">
              {aged.tieOuts.map((tie) => (
                <div
                  key={tie.entityId}
                  className="flex flex-wrap items-center justify-between gap-2 text-sm"
                >
                  <span className="font-medium text-gray-900 dark:text-white">
                    {nameOf(tie.entityId)}
                    {tie.accounts.length > 0 && (
                      <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                        {tie.accounts
                          .map((a) => (a.code ? `${a.code} ${a.name}` : a.name))
                          .join(', ')}
                      </span>
                    )}
                  </span>
                  {tie.controlBalanceCents === null ||
                  tie.differenceCents === null ? (
                    <Badge color="gray">No control account mapped</Badge>
                  ) : (
                    <span className="flex items-center gap-3 font-mono">
                      <span>
                        Ledger {formatAmount(tie.controlBalanceCents, 'USD')}
                      </span>
                      <span>
                        Open items {formatAmount(tie.openItemsCents, 'USD')}
                      </span>
                      {tie.differenceCents === 0 ? (
                        <Badge color="success" icon={HiCheckCircle}>
                          Ties
                        </Badge>
                      ) : (
                        <Badge color="warning">
                          Difference {formatAmount(tie.differenceCents, 'USD')}
                        </Badge>
                      )}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="overflow-x-auto">
              {aged.agents.length === 0 ? (
                <EmptyState
                  icon={HiCash}
                  title={`Nothing open as of ${formatDate(aged.asOf)}`}
                  description={`No ${noun} has an open ${
                    kind === 'receivables' ? 'invoice' : 'bill'
                  } at this date.`}
                />
              ) : (
                <Table>
                  <TableHead>
                    <tr>
                      <TableHeadCell>Counterparty</TableHeadCell>
                      {BUCKETS.map((bucket) => (
                        <TableHeadCell key={bucket.key} className="text-right">
                          {bucket.label}
                        </TableHeadCell>
                      ))}
                      <TableHeadCell className="text-right">
                        Total
                      </TableHeadCell>
                      <TableHeadCell className="text-right">
                        Oldest due
                      </TableHeadCell>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {aged.agents.map((row) => {
                      const drill = row.agentId
                        ? drills[row.agentId]
                        : undefined
                      const canDrill = drillable && !!row.agentId
                      return (
                        <Fragment key={row.agentId ?? 'none'}>
                          <TableRow
                            className={canDrill ? 'cursor-pointer' : undefined}
                            onClick={() => toggle(row)}
                          >
                            <TableCell className="font-medium text-gray-900 dark:text-white">
                              <span className="flex items-center gap-1">
                                {canDrill && (
                                  <button
                                    type="button"
                                    aria-expanded={!!drill}
                                    aria-label={`${drill ? 'Hide' : 'Show'} ${
                                      row.agentName ?? 'counterparty'
                                    } documents`}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      toggle(row)
                                    }}
                                  >
                                    {drill ? (
                                      <HiChevronDown className="h-4 w-4" />
                                    ) : (
                                      <HiChevronRight className="h-4 w-4" />
                                    )}
                                  </button>
                                )}
                                {row.agentName ?? 'No counterparty'}
                                <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                                  ({row.openItemCount})
                                </span>
                              </span>
                            </TableCell>
                            {BUCKETS.map((bucket) => (
                              <TableCell
                                key={bucket.key}
                                className="text-right font-mono"
                              >
                                {row.buckets[bucket.key]
                                  ? formatAmount(row.buckets[bucket.key], 'USD')
                                  : '-'}
                              </TableCell>
                            ))}
                            <TableCell className="text-right font-mono font-semibold">
                              {formatAmount(row.buckets.totalCents, 'USD')}
                            </TableCell>
                            <TableCell className="text-right">
                              {row.oldestDueDate
                                ? formatDate(row.oldestDueDate)
                                : '-'}
                            </TableCell>
                          </TableRow>
                          {drill && (
                            <TableRow>
                              <TableCell colSpan={BUCKETS.length + 3}>
                                {drill === 'loading' ? (
                                  <LoadingState />
                                ) : drill === 'error' ? (
                                  <span className="text-sm text-red-600 dark:text-red-400">
                                    Failed to load the open items.
                                  </span>
                                ) : (
                                  <OpenItemsTable items={drill} />
                                )}
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </Card>

          {requestScope === 'group' && aged.pairs.length > 0 && (
            <Card>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Between group entities
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Left out of the totals above: consolidation eliminates them.
                Each pair&apos;s two sides should agree.
              </p>
              <Table>
                <TableHead>
                  <tr>
                    <TableHeadCell>Owed to</TableHeadCell>
                    <TableHeadCell>Owed by</TableHeadCell>
                    <TableHeadCell className="text-right">
                      Receivable
                    </TableHeadCell>
                    <TableHeadCell className="text-right">
                      Payable
                    </TableHeadCell>
                    <TableHeadCell className="text-right">
                      Difference
                    </TableHeadCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {aged.pairs.map((pair) => (
                    <TableRow
                      key={`${pair.creditorEntityId}-${pair.debtorEntityId}`}
                    >
                      <TableCell>{nameOf(pair.creditorEntityId)}</TableCell>
                      <TableCell>{nameOf(pair.debtorEntityId)}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatAmount(pair.receivableCents, 'USD')}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatAmount(pair.payableCents, 'USD')}
                      </TableCell>
                      <TableCell className="text-right">
                        {pair.differenceCents === 0 ? (
                          <Badge color="success">Agrees</Badge>
                        ) : (
                          <Badge color="warning">
                            {formatAmount(pair.differenceCents, 'USD')}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </>
      ) : null}
    </PageLayout>
  )
}

const OpenItemsTable: FC<{ items: LedgerOpenItem[] }> = ({ items }) => (
  <table className="w-full text-sm">
    <thead>
      <tr className="text-left text-xs text-gray-500 dark:text-gray-400">
        <th className="py-1">Document</th>
        <th className="py-1">Date</th>
        <th className="py-1">Due</th>
        <th className="py-1 text-right">Original</th>
        <th className="py-1 text-right">Settled</th>
        <th className="py-1 text-right">Open</th>
      </tr>
    </thead>
    <tbody>
      {items.map((item) => (
        <tr key={item.eventId}>
          <td className="py-1">
            {item.documentNumber ?? item.description ?? item.eventId}
          </td>
          <td className="py-1">{formatDate(item.occurredOn)}</td>
          <td className="py-1">
            {formatDate(item.dueDate)}
            {item.dueDateBasis === 'defaulted' && (
              <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                (on receipt)
              </span>
            )}
            {item.daysPastDue > 0 && (
              <span className="ml-1 text-xs text-red-600 dark:text-red-400">
                {item.daysPastDue}d late
              </span>
            )}
          </td>
          <td className="py-1 text-right font-mono">
            {formatAmount(item.originalCents, item.currency)}
          </td>
          <td className="py-1 text-right font-mono">
            {formatAmount(item.settledCents, item.currency)}
          </td>
          <td className="py-1 text-right font-mono">
            {formatAmount(item.openCents, item.currency)}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
)

export default ReceivablesPayablesContent
