'use client'

import { isGraphAdmin } from '@/lib/graph-role'
import { friendlyError } from '@/lib/ledger/errors'
import type { BlockedSourceGraph } from '@robosystems/client/clients'
import {
  clients,
  EmptyState,
  GraphFilters,
  LoadingState,
  PageHeader,
  PageLayout,
  useGraphContext,
} from '@robosystems/core'
import {
  Alert,
  Button,
  Card,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'flowbite-react'
import type { FC } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { HiBan, HiExclamationCircle } from 'react-icons/hi'

const PAGE_SIZE = 50

const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * The recipient's standing view of the cross-graph share controls: who is
 * barred from sharing reports into this graph, and the way back.
 *
 * Graph-scoped rather than user-scoped, which is why it lives under Reports
 * and not in Settings — a block belongs to the graph, and the same user can
 * hold different roles on different graphs.
 */
const BlockedSendersContent: FC = function () {
  const { state: graphState } = useGraphContext()

  const [blocked, setBlocked] = useState<BlockedSourceGraph[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)

  const [pendingUnblock, setPendingUnblock] =
    useState<BlockedSourceGraph | null>(null)
  const [isUnblocking, setIsUnblocking] = useState(false)
  const [unblockError, setUnblockError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const currentGraph = useMemo(() => {
    const roboledgerGraphs = graphState.graphs.filter(GraphFilters.roboledger)
    return (
      roboledgerGraphs.find((g) => g.graphId === graphState.currentGraphId) ??
      roboledgerGraphs[0]
    )
  }, [graphState.graphs, graphState.currentGraphId])

  const graphId = currentGraph?.graphId
  const isAdmin = isGraphAdmin(graphState.graphs, graphId)

  // Same stale-response guard the publish-lists page uses: a response that
  // lands after the graph selection moved on is discarded, not rendered under
  // the new graph.
  const graphIdRef = useRef(graphId)
  useEffect(() => {
    graphIdRef.current = graphId
  }, [graphId])

  const loadBlocked = useCallback(
    async (nextOffset: number) => {
      if (!graphId) return
      try {
        setIsLoading(true)
        setError(null)
        const result = await clients.ledger.listBlockedSourceGraphs(graphId, {
          limit: PAGE_SIZE,
          offset: nextOffset,
        })
        if (graphIdRef.current !== graphId) return
        setBlocked(result)
        setOffset(nextOffset)
        // The facade returns a bare array, so a full page is the only
        // available signal that more may exist.
        setHasMore(result.length === PAGE_SIZE)
      } catch (err) {
        if (graphIdRef.current !== graphId) return
        console.error('Failed to load blocked senders:', err)
        setError('Failed to load blocked senders.')
      } finally {
        if (graphIdRef.current === graphId) setIsLoading(false)
      }
    },
    [graphId]
  )

  useEffect(() => {
    if (graphId) loadBlocked(0)
  }, [graphId, loadBlocked])

  const handleUnblock = async () => {
    if (!graphId || !pendingUnblock) return
    try {
      setIsUnblocking(true)
      setUnblockError(null)
      await clients.ledger.unblockSourceGraph(
        graphId,
        pendingUnblock.sourceGraphId
      )
      setNotice(
        `${pendingUnblock.sourceGraphName || pendingUnblock.sourceGraphId} can share reports into this graph again.`
      )
      setPendingUnblock(null)
      await loadBlocked(offset)
    } catch (err) {
      console.error('Unblock failed:', err)
      const message =
        err instanceof Error ? err.message : 'Failed to lift this block.'
      setUnblockError(friendlyError(message).message)
    } finally {
      setIsUnblocking(false)
    }
  }

  return (
    <PageLayout>
      <PageHeader
        icon={HiBan}
        title="Blocked Senders"
        subtitle="Graphs barred from sharing reports into this graph"
      />

      {notice && (
        <Alert color="success" onDismiss={() => setNotice(null)}>
          {notice}
        </Alert>
      )}

      {error && (
        <Alert
          color="failure"
          icon={HiExclamationCircle}
          onDismiss={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      <Card>
        {isLoading ? (
          <LoadingState size="lg" className="py-12" />
        ) : blocked.length === 0 ? (
          <EmptyState
            icon={HiBan}
            title="No blocked senders"
            description="Reports shared in from another graph can be refused from the report itself — open a shared report and choose Block sender."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHead>
                  <TableHeadCell>Sender</TableHeadCell>
                  <TableHeadCell>Blocked</TableHeadCell>
                  <TableHeadCell>Reason</TableHeadCell>
                  <TableHeadCell className="w-24"></TableHeadCell>
                </TableHead>
                <TableBody>
                  {blocked.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium text-gray-900 dark:text-white">
                        <div className="flex flex-col">
                          <span>
                            {row.sourceGraphName || row.sourceGraphId}
                          </span>
                          {row.sourceGraphName && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {row.sourceGraphId}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex flex-col">
                          <span>{formatDateTime(row.blockedAt)}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            by {row.blockedBy}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                        {row.reason || '—'}
                      </TableCell>
                      <TableCell>
                        {isAdmin && (
                          <Button
                            size="xs"
                            color="light"
                            onClick={() => {
                              setUnblockError(null)
                              setPendingUnblock(row)
                            }}
                          >
                            Unblock
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {(offset > 0 || hasMore) && (
              <div className="flex items-center justify-between pt-4">
                <Button
                  size="sm"
                  color="light"
                  disabled={offset === 0}
                  onClick={() => loadBlocked(Math.max(0, offset - PAGE_SIZE))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  color="light"
                  disabled={!hasMore}
                  onClick={() => loadBlocked(offset + PAGE_SIZE)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </Card>

      {!isAdmin && blocked.length > 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Lifting a block requires the graph admin role.
        </p>
      )}

      <Modal
        show={pendingUnblock !== null}
        onClose={() => setPendingUnblock(null)}
        size="md"
      >
        <ModalHeader>Unblock sender?</ModalHeader>
        <ModalBody>
          {unblockError && (
            <Alert color="failure" icon={HiExclamationCircle} className="mb-4">
              {unblockError}
            </Alert>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium text-gray-900 dark:text-white">
              {pendingUnblock?.sourceGraphName || pendingUnblock?.sourceGraphId}
            </span>{' '}
            will be able to share reports into this graph again. Reports removed
            by an earlier purge are not restored — unblocking reopens the
            channel, it does not undo.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button
            color="primary"
            onClick={handleUnblock}
            disabled={isUnblocking}
          >
            {isUnblocking ? <Spinner size="sm" className="mr-2" /> : null}
            Unblock
          </Button>
          <Button
            color="gray"
            onClick={() => setPendingUnblock(null)}
            disabled={isUnblocking}
          >
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </PageLayout>
  )
}

export default BlockedSendersContent
