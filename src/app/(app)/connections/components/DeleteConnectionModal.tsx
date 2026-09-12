'use client'

import { ConfirmModal } from '@robosystems/core'
import { type FC, useEffect, useState } from 'react'

import { type ConnectionData, PROVIDER_LABELS } from './ConnectionCard'

/** What deleting a connection does to the graph's books. */
export type DeleteDisposition = 'disconnect' | 'sever'

interface DeleteConnectionModalProps {
  show: boolean
  connection: ConnectionData | null
  onClose: () => void
  onConfirm: (disposition: DeleteDisposition) => void
}

/** Providers that ARE the general ledger while connected — the only ones a
 *  cutover to native books applies to. */
const SYNCED_LEDGER_PROVIDERS = new Set(['quickbooks'])

// Deleting a synced-ledger connection is a fork in the road, so the modal
// asks which one: keep the connection revivable, or sever it and go native
// with the chart it created. Every other provider has one disposition.
export const DeleteConnectionModal: FC<DeleteConnectionModalProps> = ({
  show,
  connection,
  onClose,
  onConfirm,
}) => {
  const [disposition, setDisposition] =
    useState<DeleteDisposition>('disconnect')

  // A fresh dialog always starts on the reversible choice.
  useEffect(() => {
    if (show) setDisposition('disconnect')
  }, [show, connection?.connection_id])

  const provider = (connection?.provider ?? '').toLowerCase()
  const label =
    PROVIDER_LABELS[provider] || connection?.provider || 'connection'
  const canSever = SYNCED_LEDGER_PROVIDERS.has(provider)

  return (
    <ConfirmModal
      show={show}
      onClose={onClose}
      onConfirm={() => onConfirm(canSever ? disposition : 'disconnect')}
      title={canSever ? `Disconnect ${label}` : 'Delete Connection'}
      confirmLabel={
        canSever && disposition === 'sever'
          ? 'Sever and go native'
          : canSever
            ? 'Disconnect'
            : 'Delete Connection'
      }
    >
      {canSever ? (
        <div className="space-y-3">
          <p className="text-gray-700 dark:text-gray-300">
            How should this graph keep its books after {label} is disconnected?
          </p>
          <div role="radiogroup" aria-label="Disposition" className="space-y-2">
            <label
              htmlFor="delete-disposition-disconnect"
              className="grid cursor-pointer grid-cols-[auto_1fr] gap-x-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
            >
              <input
                id="delete-disposition-disconnect"
                type="radio"
                name="delete-disposition"
                value="disconnect"
                checked={disposition === 'disconnect'}
                onChange={() => setDisposition('disconnect')}
                className="row-span-2 mt-1"
              />
              <span className="font-medium text-gray-900 dark:text-white">
                Disconnect
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Revoke access and stop syncing. Reconnecting the same {label}{' '}
                company later revives this connection, and {label} is the source
                of truth again.
              </span>
            </label>
            <label
              htmlFor="delete-disposition-sever"
              className="grid cursor-pointer grid-cols-[auto_1fr] gap-x-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-700/40 dark:bg-amber-900/20"
            >
              <input
                id="delete-disposition-sever"
                type="radio"
                name="delete-disposition"
                value="sever"
                checked={disposition === 'sever'}
                onChange={() => setDisposition('sever')}
                className="row-span-2 mt-1"
              />
              <span className="font-medium text-amber-900 dark:text-amber-100">
                Sever and go native
              </span>
              <span className="text-sm text-amber-800 dark:text-amber-200">
                Keep the chart of accounts {label} created as this graph's own
                and keep the books here from now on. {label} can never resume
                over them; bank feeds connect after this. This cannot be undone.
              </span>
            </label>
          </div>
        </div>
      ) : (
        <p className="text-gray-700 dark:text-gray-300">
          Are you sure you want to delete the <strong>{label}</strong>{' '}
          connection? This action cannot be undone.
        </p>
      )}
    </ConfirmModal>
  )
}

export default DeleteConnectionModal
