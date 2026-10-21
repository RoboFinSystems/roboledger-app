'use client'

import { formatDate, formatDollars } from '@/lib/ledger/formatters'
import {
  canDrill,
  describeFact,
  originLabel,
  partLabel,
  type FactDescriptor,
  type FactSource,
} from '@/lib/ledger/provenance'
import { registerHref } from '@/lib/ledger/register'
import { clients } from '@robosystems/core'
import {
  Modal,
  ModalBody,
  ModalHeader,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from 'flowbite-react'
import Link from 'next/link'
import type { FC } from 'react'
import { useEffect, useMemo, useState } from 'react'
import type {
  EnvelopeElement,
  EnvelopeFact,
  EnvelopeRenderingPeriod,
  EnvelopeRenderingRow,
} from '../../../ledger/close/components/blockview/types'

interface ReportFigureModalProps {
  graphId: string | null
  row: EnvelopeRenderingRow
  period: EnvelopeRenderingPeriod
  /** The envelope fact behind the figure: its value, its descriptor, and
   *  whether its column is frozen. */
  fact: EnvelopeFact
  /** The block's concepts, to name a rollup's children. */
  elements: readonly EnvelopeElement[]
  /** The graph's entities, to name whose account a source is. */
  entities: readonly { id: string; name: string }[]
  onClose: () => void
}

interface AccountName {
  code: string | null
  name: string
}

/** The chart names of the accounts a figure was summed from, read per entity
 *  the sources name and looked up by account id across all of them: the
 *  consolidation entity posts on the parent's chart. */
function useAccountNames(
  graphId: string | null,
  sources: readonly FactSource[]
): Map<string, AccountName> {
  const [names, setNames] = useState<Map<string, AccountName>>(new Map())
  const entityIds = useMemo(
    () => Array.from(new Set(sources.map((s) => s.entity_id))).sort(),
    [sources]
  )
  useEffect(() => {
    if (!graphId || entityIds.length === 0) return
    let cancelled = false
    Promise.all(
      entityIds.map((entityId) =>
        clients.ledger
          .listAccounts(graphId, { entityId, limit: 500 })
          .then((result) => result?.accounts ?? [])
          .catch(() => [])
      )
    ).then((lists) => {
      if (cancelled) return
      const next = new Map<string, AccountName>()
      for (const accounts of lists) {
        for (const account of accounts) {
          next.set(account.id, {
            code: account.code ?? null,
            name: account.name,
          })
        }
      }
      setNames(next)
    })
    return () => {
      cancelled = true
    }
  }, [graphId, entityIds])
  return names
}

const periodCaption = (
  period: EnvelopeRenderingPeriod,
  periodType: string
): string =>
  periodType === 'instant' || !period.start
    ? `As of ${formatDate(period.end)}`
    : `${formatDate(period.start)} – ${formatDate(period.end)}`

/** How a report figure was made, read from the fact's own descriptor: the
 *  accounts it was summed from (each opening its register for the column's
 *  window), the lines it rolled up, or the parts a computation put together
 *  — and whether its column is the closed record or still following the
 *  books. */
const ReportFigureModal: FC<ReportFigureModalProps> = ({
  graphId,
  row,
  period,
  fact,
  elements,
  entities,
  onClose,
}) => {
  const descriptor = describeFact(fact.provenance)
  const sources: FactSource[] =
    descriptor &&
    (descriptor.origin === 'pivot' || descriptor.origin === 'derived')
      ? (descriptor.sources ?? [])
      : []
  const names = useAccountNames(graphId, sources)
  const entityName = (id: string): string =>
    entities.find((e) => e.id === id)?.name ?? id
  const showEntity = new Set(sources.map((s) => s.entity_id)).size > 1
  // A concept outside this block's own elements (a balance-sheet line a
  // cash-flow derivation read) still reads as words.
  const conceptLabel = (qname: string): string =>
    elements.find((e) => e.qname === qname)?.name ??
    qname.replace(/^.*:/, '').replace(/([a-z])([A-Z])/g, '$1 $2')

  return (
    <Modal show onClose={onClose} size="2xl">
      <ModalHeader>
        <span className="font-heading text-lg">{row.elementName}</span>
        <span className="block text-sm font-normal text-gray-500 dark:text-gray-400">
          {periodCaption(period, fact.periodType)}
          {fact.value !== null && fact.value !== undefined
            ? ` · ${formatDollars(fact.value)}`
            : ''}
        </span>
      </ModalHeader>
      <ModalBody>
        <p
          className="mb-3 text-sm text-gray-500 dark:text-gray-400"
          data-testid="figure-freeze"
        >
          {fact.frozenAt
            ? `Frozen ${formatDate(fact.frozenAt)} — the period is closed, and this figure is the record.`
            : 'Live — this column follows the books until its period closes.'}
        </p>
        {descriptor === null || !canDrill(descriptor) ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No record of how this figure was made.
          </p>
        ) : (
          <>
            <p className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
              {originLabel(descriptor)}
            </p>
            {descriptor.origin === 'rollup' && (
              <RollupChildren
                descriptor={descriptor}
                conceptLabel={conceptLabel}
              />
            )}
            {descriptor.origin === 'derived' && (
              <DerivedParts
                descriptor={descriptor}
                conceptLabel={conceptLabel}
              />
            )}
            {descriptor.origin === 'pivot' && descriptor.sources === null && (
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {Object.entries(descriptor.postingFilter ?? {})
                  .map(
                    ([key, value]) =>
                      `${key.replace(/_/g, ' ')}: ${String(value)}`
                  )
                  .join(' · ')}
              </p>
            )}
            {sources.length > 0 && (
              <SourcesTable
                sources={sources}
                names={names}
                entityName={entityName}
                showEntity={showEntity}
                period={period}
              />
            )}
            {descriptor.origin === 'pivot' && descriptor.lineCount !== null && (
              <p
                className="mt-3 text-xs text-gray-500 dark:text-gray-400"
                data-testid="figure-lines"
              >
                {descriptor.lineCount} landed line
                {descriptor.lineCount === 1 ? '' : 's'} behind it
                {descriptor.contentHash
                  ? ` · ${descriptor.contentHash.slice(0, 19)}…`
                  : ''}
              </p>
            )}
          </>
        )}
      </ModalBody>
    </Modal>
  )
}

const SourcesTable: FC<{
  sources: readonly FactSource[]
  names: Map<string, AccountName>
  entityName: (id: string) => string
  showEntity: boolean
  period: EnvelopeRenderingPeriod
}> = ({ sources, names, entityName, showEntity, period }) => (
  <Table>
    <TableBody>
      {sources.map((source) => {
        const account = names.get(source.account_id)
        return (
          <TableRow key={`${source.entity_id}-${source.account_id}`}>
            <TableCell>
              <Link
                href={registerHref({
                  accountId: source.account_id,
                  entityId: source.entity_id,
                  start: period.start ?? undefined,
                  end: period.end,
                })}
                className="font-medium text-gray-900 hover:underline dark:text-white"
              >
                {account?.code ? `${account.code} ` : ''}
                {account?.name ?? source.account_id}
              </Link>
              {showEntity && (
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  {entityName(source.entity_id)}
                </span>
              )}
            </TableCell>
            <TableCell className="text-right font-mono">
              {formatDollars(source.value)}
            </TableCell>
          </TableRow>
        )
      })}
    </TableBody>
  </Table>
)

const RollupChildren: FC<{
  descriptor: Extract<FactDescriptor, { origin: 'rollup' }>
  conceptLabel: (qname: string) => string
}> = ({ descriptor, conceptLabel }) => (
  <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
    {descriptor.children.map((child) => (
      <li key={child.qname} className="flex gap-2">
        <span className="w-4 font-mono text-gray-400">
          {child.weight < 0 ? '−' : '+'}
        </span>
        <span>{conceptLabel(child.qname)}</span>
      </li>
    ))}
  </ul>
)

const DerivedParts: FC<{
  descriptor: Extract<FactDescriptor, { origin: 'derived' }>
  conceptLabel: (qname: string) => string
}> = ({ descriptor, conceptLabel }) => (
  <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
    {descriptor.computation && (
      <p data-testid="figure-computation">
        {partLabel(descriptor.computation)}
      </p>
    )}
    {descriptor.formula && (
      <p className="font-mono text-xs text-gray-500 dark:text-gray-400">
        {descriptor.formula}
      </p>
    )}
    {descriptor.amounts && Object.keys(descriptor.amounts).length > 0 && (
      <Table>
        <TableBody>
          {Object.entries(descriptor.amounts).map(([part, amount]) => (
            <TableRow key={part}>
              <TableCell>{partLabel(part)}</TableCell>
              <TableCell className="text-right font-mono">
                {formatDollars(amount)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )}
    {descriptor.sourceConcepts.length > 0 && (
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Reads {descriptor.sourceConcepts.map(conceptLabel).join(', ')}
      </p>
    )}
  </div>
)

export default ReportFigureModal
