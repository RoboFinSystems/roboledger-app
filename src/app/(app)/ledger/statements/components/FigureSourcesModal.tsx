'use client'

import { formatDollars } from '@/lib/ledger/formatters'
import { registerHref } from '@/lib/ledger/register'
import {
  Modal,
  ModalBody,
  ModalHeader,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@robosystems/core/ui'
import Link from 'next/link'
import type { FC } from 'react'
import type { StatementColumn, StatementRow } from '../statementModel'

interface FigureSourcesModalProps {
  row: StatementRow
  column: StatementColumn
  columnIndex: number
  /** Names a source's entity on a group statement. */
  entityName: (entityId: string) => string
  /** Several entities' books are summed: say whose each account is. */
  showEntity: boolean
  onClose: () => void
}

/** The accounts a statement figure was summed from, each opening its register
 *  for the figure's window. */
const FigureSourcesModal: FC<FigureSourcesModalProps> = ({
  row,
  column,
  columnIndex,
  entityName,
  showEntity,
  onClose,
}) => {
  const sources = row.sources?.[columnIndex] ?? []
  const figure = row.values[columnIndex]
  return (
    <Modal show onClose={onClose} size="2xl">
      <ModalHeader>
        <span className="font-heading text-lg">{row.label}</span>
        <span className="block text-sm font-normal text-gray-500 dark:text-gray-400">
          {column.caption}
          {figure !== null && ` · ${formatDollars(figure)}`}
        </span>
      </ModalHeader>
      <ModalBody>
        <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
          The accounts this figure was summed from. Open one to read the lines
          behind it.
        </p>
        <Table>
          <TableBody>
            {sources.map((source) => (
              <TableRow key={`${source.entity_id}-${source.account_id}`}>
                <TableCell>
                  <Link
                    href={registerHref({
                      accountId: source.account_id,
                      entityId: source.entity_id,
                      start: column.start,
                      end: column.end,
                    })}
                    className="font-medium text-gray-900 hover:underline dark:text-white"
                  >
                    {source.code ? `${source.code} ` : ''}
                    {source.name}
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
            ))}
          </TableBody>
        </Table>
      </ModalBody>
    </Modal>
  )
}

export default FigureSourcesModal
