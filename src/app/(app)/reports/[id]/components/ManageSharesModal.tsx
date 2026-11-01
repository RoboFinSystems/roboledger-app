'use client'

import { friendlyError } from '@/lib/ledger/errors'
import { formatDate } from '@/lib/ledger/formatters'
import type { ReportShare } from '@robosystems/client'
import { clients, LoadingState } from '@robosystems/core'
import {
  Alert,
  Button,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Spinner,
} from '@robosystems/core/ui'
import type { FC } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { HiExclamationCircle } from 'react-icons/hi'

interface Props {
  graphId: string
  reportId: string
  onClose: () => void
}

interface RevokeOutcome {
  ok: boolean
  message: string
}

const shareDate = (iso: string) => formatDate(iso.split('T')[0])

/**
 * The sender's half of the share controls: see who holds a copy of this
 * report, and withdraw it from one of them.
 *
 * The list is the report's own share record (`listReportShares`): every
 * recipient graph the report was delivered to, with the delivery date and
 * fact count. Revoked shares are kept as history below the live ones — a
 * recipient shared to, revoked, and shared to again shows once in each.
 */
const ManageSharesModal: FC<Props> = function ({ graphId, reportId, onClose }) {
  const [shares, setShares] = useState<ReportShare[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [outcomes, setOutcomes] = useState<Record<string, RevokeOutcome>>({})
  const [inFlight, setInFlight] = useState<string | null>(null)

  const loadShares = useCallback(async () => {
    try {
      setIsLoading(true)
      setLoadError(null)
      setShares(
        await clients.ledger.listReportShares(graphId, {
          reportId,
          includeRevoked: true,
        })
      )
    } catch (err) {
      console.error('Failed to load report shares:', err)
      setLoadError('Failed to load recipients.')
    } finally {
      setIsLoading(false)
    }
  }, [graphId, reportId])

  useEffect(() => {
    loadShares()
  }, [loadShares])

  const handleRevoke = async (targetGraphId: string) => {
    try {
      setInFlight(targetGraphId)
      const res = await clients.ledger.revokeReportShare(
        graphId,
        reportId,
        targetGraphId
      )
      setOutcomes((prev) => ({
        ...prev,
        [targetGraphId]: {
          ok: true,
          message: res.copy_deleted
            ? 'Revoked — the copy was deleted from their books.'
            : 'Revoked. No copy was found, so the recipient had already deleted it.',
        },
      }))
    } catch (err) {
      console.error('Revoke failed:', err)
      const message =
        err instanceof Error ? err.message : 'Failed to revoke this share.'
      setOutcomes((prev) => ({
        ...prev,
        [targetGraphId]: { ok: false, message: friendlyError(message).message },
      }))
    } finally {
      setInFlight(null)
    }
  }

  const live = shares.filter((share) => !share.revokedAt)
  const revoked = shares.filter((share) => share.revokedAt)

  return (
    <Modal show onClose={onClose} size="lg">
      <ModalHeader>Manage shares</ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Withdraw this report from a recipient. Revoking deletes their copy
            and marks the share revoked; any entity they linked to it stays in
            place.
          </p>

          {loadError && (
            <Alert color="failure" icon={HiExclamationCircle}>
              {loadError}
            </Alert>
          )}

          {isLoading ? (
            <LoadingState size="md" className="py-4" />
          ) : live.length === 0 ? (
            <p className="rounded-lg border border-gray-200 p-4 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              {revoked.length === 0
                ? 'This report has not been shared.'
                : 'No recipient currently holds a copy of this report.'}
            </p>
          ) : (
            <div className="space-y-2">
              <Label className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
                Recipients
              </Label>
              {live.map((share) => {
                const outcome = outcomes[share.targetGraphId]
                return (
                  <div
                    key={share.id}
                    className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium dark:text-white">
                          {share.targetGraphName || share.targetGraphId}
                        </p>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                          {share.targetGraphName
                            ? `${share.targetGraphId} · `
                            : ''}
                          shared {shareDate(share.sharedAt)} · {share.factCount}{' '}
                          facts
                        </p>
                      </div>
                      <Button
                        size="xs"
                        color="failure"
                        disabled={
                          inFlight === share.targetGraphId || outcome?.ok
                        }
                        onClick={() => handleRevoke(share.targetGraphId)}
                      >
                        {inFlight === share.targetGraphId ? (
                          <Spinner size="sm" className="mr-2" />
                        ) : null}
                        Revoke
                      </Button>
                    </div>
                    {outcome && (
                      <p
                        className={`mt-2 text-xs ${
                          outcome.ok
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {outcome.message}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {!isLoading && revoked.length > 0 && (
            <div className="space-y-2 border-t border-gray-200 pt-4 dark:border-gray-700">
              <Label className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
                Revoked
              </Label>
              {revoked.map((share) => (
                <div
                  key={share.id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <p className="min-w-0 truncate text-gray-700 dark:text-gray-300">
                    {share.targetGraphName || share.targetGraphId}
                  </p>
                  <p className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                    shared {shareDate(share.sharedAt)} · revoked{' '}
                    {shareDate(share.revokedAt as string)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button color="gray" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default ManageSharesModal
