'use client'

import { friendlyError } from '@/lib/ledger/errors'
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
  TextInput,
} from 'flowbite-react'
import type { FC } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { HiExclamationCircle } from 'react-icons/hi'

interface Props {
  graphId: string
  reportId: string
  onClose: () => void
}

/** One candidate recipient, derived from publish-list membership. */
interface Recipient {
  targetGraphId: string
  name: string | null
  /** Lists this recipient currently belongs to, for display. */
  viaLists: string[]
}

interface RevokeOutcome {
  ok: boolean
  message: string
}

/**
 * The sender's half of the share controls: withdraw a report from one
 * recipient graph.
 *
 * **On the recipient list's provenance.** `revokeReportShare` is scoped to a
 * single `targetGraphId`, and the platform exposes no read that lists a
 * report's actual recipients — `ReportResponse` carries only recipient-side
 * provenance, and the `target_graph_id`s returned by `shareReport` are
 * transient. So this picker is built from *current publish-list membership*,
 * which is the sender's own record of who they distribute to, not a record of
 * who received this particular report. The two diverge whenever a list changes
 * after a share:
 *
 * - Added after the share → shown here, but revoking 404s ("never shared").
 * - Removed after the share → still holds a copy, and does **not** appear.
 *
 * The manual entry below covers that second case, which is why it exists. If a
 * `listReportShares`-style read lands, replace the derivation wholesale.
 */
const ManageSharesModal: FC<Props> = function ({ graphId, reportId, onClose }) {
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [outcomes, setOutcomes] = useState<Record<string, RevokeOutcome>>({})
  const [inFlight, setInFlight] = useState<string | null>(null)
  const [manualGraphId, setManualGraphId] = useState('')

  // Publish lists carry only a member count; membership needs a per-list
  // read. Fetched in parallel — a graph on two lists collapses to one row.
  const loadRecipients = useCallback(async () => {
    try {
      setIsLoading(true)
      setLoadError(null)
      const lists = await clients.reports.listPublishLists(graphId)
      const details = await Promise.all(
        lists.map((list) => clients.reports.getPublishList(graphId, list.id))
      )

      const byGraphId = new Map<string, Recipient>()
      for (const detail of details) {
        if (!detail) continue
        for (const member of detail.members) {
          const existing = byGraphId.get(member.targetGraphId)
          if (existing) {
            existing.viaLists.push(detail.name)
          } else {
            byGraphId.set(member.targetGraphId, {
              targetGraphId: member.targetGraphId,
              name: member.targetGraphName ?? member.targetOrgName ?? null,
              viaLists: [detail.name],
            })
          }
        }
      }
      setRecipients(Array.from(byGraphId.values()))
    } catch (err) {
      console.error('Failed to load publish list members:', err)
      setLoadError('Failed to load recipients.')
    } finally {
      setIsLoading(false)
    }
  }, [graphId])

  useEffect(() => {
    loadRecipients()
  }, [loadRecipients])

  const handleRevoke = async (targetGraphId: string) => {
    const target = targetGraphId.trim()
    if (!target) return
    try {
      setInFlight(target)
      const res = await clients.ledger.revokeReportShare(
        graphId,
        reportId,
        target
      )
      setOutcomes((prev) => ({
        ...prev,
        [target]: {
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
        [target]: { ok: false, message: friendlyError(message).message },
      }))
    } finally {
      setInFlight(null)
    }
  }

  const manualTarget = manualGraphId.trim()
  const manualOutcome = manualTarget ? outcomes[manualTarget] : undefined

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
          ) : recipients.length === 0 ? (
            <p className="rounded-lg border border-gray-200 p-4 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              No publish list members to show.
            </p>
          ) : (
            <div className="space-y-2">
              <Label className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
                Publish list recipients
              </Label>
              {recipients.map((recipient) => {
                const outcome = outcomes[recipient.targetGraphId]
                return (
                  <div
                    key={recipient.targetGraphId}
                    className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium dark:text-white">
                          {recipient.name || recipient.targetGraphId}
                        </p>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                          {recipient.name
                            ? `${recipient.targetGraphId} · `
                            : ''}
                          via {recipient.viaLists.join(', ')}
                        </p>
                      </div>
                      <Button
                        size="xs"
                        color="failure"
                        disabled={
                          inFlight === recipient.targetGraphId || outcome?.ok
                        }
                        onClick={() => handleRevoke(recipient.targetGraphId)}
                      >
                        {inFlight === recipient.targetGraphId ? (
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

          <div className="space-y-2 border-t border-gray-200 pt-4 dark:border-gray-700">
            <Label htmlFor="manual-target">Revoke by graph ID</Label>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              A recipient removed from a publish list after you shared still
              holds their copy and won&apos;t appear above. Enter their graph ID
              to withdraw it.
            </p>
            <div className="flex gap-2">
              <TextInput
                id="manual-target"
                className="flex-1"
                value={manualGraphId}
                onChange={(e) => setManualGraphId(e.target.value)}
                placeholder="Recipient graph ID"
                disabled={inFlight !== null}
              />
              <Button
                color="failure"
                disabled={!manualTarget || inFlight !== null}
                onClick={() => handleRevoke(manualTarget)}
              >
                {inFlight === manualTarget ? (
                  <Spinner size="sm" className="mr-2" />
                ) : null}
                Revoke
              </Button>
            </div>
            {manualOutcome && (
              <p
                className={`text-xs ${
                  manualOutcome.ok
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {manualOutcome.message}
              </p>
            )}
          </div>
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
