'use client'

import EventChip from '@/components/EventChip'
import {
  FilterActions,
  FilterBar,
  FilterDate,
  FilterSelect,
} from '@/components/FilterBar'
import { useEntityScope } from '@/lib/entity-scope'
import { accountLabel, type AccountOption } from '@/lib/ledger/accounts'
import { friendlyError } from '@/lib/ledger/errors'
import { formatDate, formatDollars } from '@/lib/ledger/formatters'
import { monthToDate } from '@/lib/ledger/register'
import { useLedgerGraph } from '@/lib/useLedgerGraph'
import type { LedgerAccountRegister } from '@robosystems/client/clients'
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
  ToggleSwitch,
} from 'flowbite-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { FC } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { HiExclamationCircle, HiOutlineBookOpen } from 'react-icons/hi'
import EventBlockDetailModal from '../inbox/EventBlockDetailModal'

type RegisterLine = LedgerAccountRegister['lines'][number]

const NUMERIC_CELL = 'text-right font-mono whitespace-nowrap'

const money = (amount: number): string => formatDollars(amount)
const side = (amount: number): string => (amount ? money(amount) : '—')

const AccountRegisterContent: FC = function () {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const { graph } = useLedgerGraph()
  const graphId = graph?.graphId ?? null
  const { entityId: scopeEntityId, entities, isResolved } = useEntityScope()

  // The URL names what a link opened: a statement figure names a member's
  // books, which need not be the selected entity's.
  const accountId = searchParams.get('accountId') ?? ''
  const entityId = searchParams.get('entityId') ?? scopeEntityId
  const defaults = useMemo(() => monthToDate(new Date()), [])
  const start = searchParams.get('start') ?? defaults.start
  const end = searchParams.get('end') ?? defaults.end
  const dimensionType = searchParams.get('dimensionType')
  const dimensionMemberId = searchParams.get('dimensionMemberId')
  const dimension = useMemo(
    () =>
      dimensionType && dimensionMemberId
        ? { type: dimensionType, memberId: dimensionMemberId }
        : null,
    [dimensionType, dimensionMemberId]
  )
  const entityName = entities.find((e) => e.id === entityId)?.name ?? null

  const setParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    router.replace(`${pathname}?${next.toString()}`)
  }

  // Choosing another entity in the selector reads its books: the account the
  // URL named belongs to the last one's chart. The scope settling on the saved
  // entity as the page loads is not a choice, and keeps the link.
  const lastScope = useRef<string | null | undefined>(undefined)
  useEffect(() => {
    if (!isResolved) return
    if (lastScope.current === undefined) {
      lastScope.current = scopeEntityId
      return
    }
    if (lastScope.current === scopeEntityId) return
    lastScope.current = scopeEntityId
    setParams({ entityId: null, accountId: null })
    // setParams reads the current URL; it need not re-run the effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeEntityId, isResolved])

  const [accounts, setAccounts] = useState<AccountOption[]>([])
  useEffect(() => {
    if (!graphId) return
    let cancelled = false
    clients.ledger
      .listAccounts(graphId, { entityId, isActive: true, limit: 500 })
      .then((list) => {
        if (cancelled) return
        const rows = (list?.accounts ?? []).map((a) => ({
          id: a.id,
          code: a.code ?? null,
          name: a.name ?? a.id,
        }))
        rows.sort(
          (a, b) =>
            (a.code ?? '').localeCompare(b.code ?? '', undefined, {
              numeric: true,
            }) || a.name.localeCompare(b.name)
        )
        setAccounts(rows)
      })
      .catch((err) => {
        if (!cancelled) console.error('Failed to load accounts:', err)
      })
    return () => {
      cancelled = true
    }
  }, [graphId, entityId])

  const [includeDrafts, setIncludeDrafts] = useState(false)
  const [register, setRegister] = useState<LedgerAccountRegister | null>(null)
  const [lines, setLines] = useState<RegisterLine[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openEventId, setOpenEventId] = useState<string | null>(null)

  const loadSeq = useRef(0)
  const query = useMemo(
    () => ({
      entityId,
      startDate: start,
      endDate: end,
      dimension,
      includeDrafts,
    }),
    [entityId, start, end, dimension, includeDrafts]
  )
  useEffect(() => {
    if (!isResolved) return
    if (!graphId || !accountId) {
      setRegister(null)
      setLines([])
      return
    }
    const seq = ++loadSeq.current
    setIsLoading(true)
    setError(null)
    clients.ledger
      .getAccountRegister(graphId, accountId, query)
      .then((result) => {
        if (seq !== loadSeq.current) return
        setRegister(result)
        setLines(result?.lines ?? [])
        setNextCursor(result?.nextCursor ?? null)
      })
      .catch((err) => {
        if (seq !== loadSeq.current) return
        console.error('Error loading the account register:', err)
        setRegister(null)
        setLines([])
        setError(
          friendlyError(
            err instanceof Error
              ? err.message
              : 'Failed to load the register. Please try again.'
          ).message
        )
      })
      .finally(() => {
        if (seq === loadSeq.current) setIsLoading(false)
      })
  }, [graphId, accountId, query, isResolved])

  const loadMore = () => {
    if (!graphId || !nextCursor) return
    const seq = loadSeq.current
    setIsLoadingMore(true)
    clients.ledger
      .getAccountRegister(graphId, accountId, { ...query, after: nextCursor })
      .then((page) => {
        if (seq !== loadSeq.current || !page) return
        setLines((loaded) => [...loaded, ...page.lines])
        setNextCursor(page.nextCursor ?? null)
      })
      .catch((err) => {
        if (seq === loadSeq.current)
          setError(
            friendlyError(
              err instanceof Error ? err.message : 'Failed to load more lines.'
            ).message
          )
      })
      .finally(() => setIsLoadingMore(false))
  }

  // An account outside the chart the picker lists (a consolidation entity's
  // line on the parent's account) still shows by name.
  const options = useMemo(() => {
    if (!register || accounts.some((a) => a.id === register.account.id)) {
      return accounts
    }
    return [
      {
        id: register.account.id,
        code: register.account.code ?? null,
        name: register.account.name,
      },
      ...accounts,
    ]
  }, [accounts, register])

  return (
    <PageLayout>
      <PageHeader
        icon={HiOutlineBookOpen}
        title="Account Register"
        subtitle={
          entityName
            ? `One account's posted lines in ${entityName}'s books, each with the balance it leaves`
            : "One account's posted lines, each with the balance it leaves"
        }
      />

      <FilterBar>
        <FilterSelect
          id="register-account"
          label="Account"
          value={accountId}
          onChange={(value) => setParams({ accountId: value || null })}
          className="sm:w-80"
        >
          <option value="">Choose an account…</option>
          {options.map((account) => (
            <option key={account.id} value={account.id}>
              {accountLabel(account)}
            </option>
          ))}
        </FilterSelect>
        <FilterDate
          id="register-start"
          label="From"
          value={start}
          onChange={(value) => setParams({ start: value || null })}
        />
        <FilterDate
          id="register-end"
          label="To"
          value={end}
          onChange={(value) => setParams({ end: value || null })}
        />
        <FilterActions>
          <ToggleSwitch
            checked={includeDrafts}
            onChange={setIncludeDrafts}
            label="Show drafts"
          />
        </FilterActions>
      </FilterBar>

      {error && (
        <Alert color="failure">
          <HiExclamationCircle className="h-4 w-4" />
          <span className="font-medium">Error!</span> {error}
        </Alert>
      )}

      {register?.sliced && (
        <Alert color="info">
          Read for one slice
          {dimension ? ` (${dimension.type})` : ''}: these balances are the
          slice&apos;s lines, not the whole account&apos;s.{' '}
          <button
            type="button"
            className="font-medium underline"
            onClick={() =>
              setParams({ dimensionType: null, dimensionMemberId: null })
            }
          >
            Read the whole account
          </button>
        </Alert>
      )}

      {!accountId ? (
        <Card>
          <EmptyState
            icon={HiOutlineBookOpen}
            title="Choose an account"
            description="Pick an account to read its lines, or open one from the trial balance, the closing book or a statement figure."
          />
        </Card>
      ) : isLoading ? (
        <Card>
          <LoadingState />
        </Card>
      ) : register ? (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              {
                label: register.openingFrom
                  ? `Opening (from ${formatDate(register.openingFrom)})`
                  : 'Opening balance',
                value: register.openingBalance,
              },
              { label: 'Debits', value: register.totalDebits },
              { label: 'Credits', value: register.totalCredits },
              { label: 'Closing balance', value: register.closingBalance },
            ].map((tile) => (
              <Card key={tile.label} className="p-3">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {tile.label}
                </div>
                <div className="mt-1 font-mono text-lg text-gray-900 dark:text-white">
                  {money(tile.value)}
                </div>
              </Card>
            ))}
          </div>

          <Card>
            {register.lineCount === 0 && register.drafts.length === 0 ? (
              <EmptyState
                icon={HiOutlineBookOpen}
                title="No posted lines in this window"
                description={`The balance is ${money(register.closingBalance)} throughout.`}
              />
            ) : (
              <div className="overflow-x-auto">
                <Table hoverable data-testid="account-register-table">
                  <TableHead>
                    <tr>
                      <TableHeadCell>Date</TableHeadCell>
                      <TableHeadCell>Entry</TableHeadCell>
                      <TableHeadCell>Counterparty</TableHeadCell>
                      <TableHeadCell className="text-right">
                        Debit
                      </TableHeadCell>
                      <TableHeadCell className="text-right">
                        Credit
                      </TableHeadCell>
                      <TableHeadCell className="text-right">
                        Balance
                      </TableHeadCell>
                    </tr>
                  </TableHead>
                  <TableBody>
                    <TableRow className="text-gray-500 dark:text-gray-400">
                      <TableCell>{formatDate(start)}</TableCell>
                      <TableCell colSpan={4}>Opening balance</TableCell>
                      <TableCell className={NUMERIC_CELL}>
                        {money(register.pageOpeningBalance)}
                      </TableCell>
                    </TableRow>
                    {lines.map((line) => (
                      <RegisterRow
                        key={line.lineId}
                        line={line}
                        onOpenEvent={setOpenEventId}
                      />
                    ))}
                    {!nextCursor && (
                      <TableRow className="font-semibold text-gray-900 dark:text-white">
                        <TableCell>{formatDate(end)}</TableCell>
                        <TableCell colSpan={2}>Closing balance</TableCell>
                        <TableCell className={NUMERIC_CELL}>
                          {money(register.totalDebits)}
                        </TableCell>
                        <TableCell className={NUMERIC_CELL}>
                          {money(register.totalCredits)}
                        </TableCell>
                        <TableCell className={NUMERIC_CELL}>
                          {money(register.closingBalance)}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                {nextCursor && (
                  <div className="flex items-center justify-between gap-3 p-3 text-sm text-gray-500 dark:text-gray-400">
                    <span>
                      Showing {lines.length} of {register.lineCount} lines
                    </span>
                    <Button
                      size="sm"
                      color="light"
                      onClick={loadMore}
                      disabled={isLoadingMore}
                    >
                      {isLoadingMore ? 'Loading…' : 'Load more'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>

          {includeDrafts && register.drafts.length > 0 && (
            <Card>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Drafts
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Not yet posted, so in no balance above: what the close would
                add.
                {register.draftsTruncated &&
                  ' More drafts fall in this window than are listed.'}
              </p>
              <div className="overflow-x-auto">
                <Table>
                  <TableBody>
                    {register.drafts.map((line) => (
                      <RegisterRow
                        key={line.lineId}
                        line={line}
                        onOpenEvent={setOpenEventId}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </>
      ) : null}

      {openEventId && graphId && (
        <EventBlockDetailModal
          graphId={graphId}
          eventId={openEventId}
          agentById={{}}
          readOnly
          booksEntityId={entityId}
          onClose={() => setOpenEventId(null)}
          onApproved={() => undefined}
          onRejected={() => undefined}
        />
      )}
    </PageLayout>
  )
}

interface RegisterRowProps {
  line: RegisterLine
  onOpenEvent: (eventId: string) => void
}

const RegisterRow: FC<RegisterRowProps> = ({ line, onOpenEvent }) => (
  <TableRow>
    <TableCell className="whitespace-nowrap">
      {formatDate(line.postingDate)}
    </TableCell>
    <TableCell>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-gray-900 dark:text-white">
          {line.description || line.memo || '—'}
        </span>
        {line.entryNumber && (
          <span className="font-mono text-xs text-gray-500">
            #{line.entryNumber}
          </span>
        )}
        {line.status === 'reversed' && (
          <Badge color="warning" size="xs">
            reversed
          </Badge>
        )}
        {line.reversalOf && (
          <Badge color="gray" size="xs">
            reversal
          </Badge>
        )}
        {line.status === 'draft' && (
          <Badge color="gray" size="xs">
            draft
          </Badge>
        )}
        {line.dimensions.map((d) => (
          <Badge key={d.id} color="indigo" size="xs" title={d.dimensionType}>
            {d.name}
          </Badge>
        ))}
        {line.triggeredByEventId && (
          <EventChip
            eventType={line.triggeredByEventType}
            onOpen={() => onOpenEvent(line.triggeredByEventId as string)}
          />
        )}
      </div>
    </TableCell>
    <TableCell className="text-gray-600 dark:text-gray-400">
      {line.agentName ?? '—'}
    </TableCell>
    <TableCell className={NUMERIC_CELL}>{side(line.debit)}</TableCell>
    <TableCell className={NUMERIC_CELL}>{side(line.credit)}</TableCell>
    <TableCell className={NUMERIC_CELL}>
      {line.balance === null || line.balance === undefined
        ? '—'
        : money(line.balance)}
    </TableCell>
  </TableRow>
)

export default AccountRegisterContent
