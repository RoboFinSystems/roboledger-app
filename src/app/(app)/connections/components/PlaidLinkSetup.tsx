'use client'

import { useEntityScope } from '@/lib/entity-scope'
import { linkPlaidConnection, plaidRefusalMessage } from '@/lib/plaid-link'
import { useLedgerGraph } from '@/lib/useLedgerGraph'
import { SDK, unwrapSdk } from '@robosystems/core'
import { Spinner } from '@robosystems/core/ui-components'
import { Alert, Button, Label, TextInput } from 'flowbite-react'
import { useEffect, useState } from 'react'
import { HiLibrary } from 'react-icons/hi'
import FeedEntityField, {
  feedEntityAllowed,
  feedEntityDefault,
  feedEntityScope,
} from './FeedEntityField'

interface PlaidLinkSetupProps {
  onCancel: () => void
  /** Called once the backend holds the bank's Item and the first sync runs. */
  onConnected?: () => void
  /** A QuickBooks connection is live, so the group parent's books are its. */
  parentKept?: boolean
}

/** The default backfill start the backend applies when none is given. */
const defaultSinceDate = (): string => {
  const year = new Date().getFullYear() - 1
  return `${year}-01-01`
}

// A bank through Plaid. A bank feed is native accounting: the company its
// accounts land on must already have a chart of accounts and must not be the
// one QuickBooks keeps (the group parent, while QuickBooks is connected) —
// the backend refuses otherwise and the message says which. Every account
// the bank exposes is linked to a chart account by name on that company's
// chart, or one is added for it; Bank Accounts moves it to another company.
export default function PlaidLinkSetup({
  onCancel,
  onConnected,
  parentKept = false,
}: PlaidLinkSetupProps) {
  const currentGraphId = useLedgerGraph().graph?.graphId ?? null
  const { entities } = useEntityScope()
  const [sinceDate, setSinceDate] = useState(defaultSinceDate)
  const [entityId, setEntityId] = useState(() =>
    feedEntityDefault(entities, parentKept)
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // The entity list arrives after the first render; a pick that is no longer
  // one the server would take (or never was) falls back to the default.
  useEffect(() => {
    if (!feedEntityAllowed(entities, entityId, parentKept)) {
      setEntityId(feedEntityDefault(entities, parentKept))
    }
  }, [entities, entityId, parentKept])

  const canConnect =
    entities.length === 0
      ? !parentKept
      : feedEntityAllowed(entities, entityId, parentKept)

  const handleConnect = async () => {
    if (!currentGraphId) {
      setError('No graph selected')
      return
    }
    setLoading(true)
    setError(null)

    try {
      const created = unwrapSdk(
        await SDK.createConnection({
          path: { graph_id: currentGraphId },
          body: {
            provider: 'plaid',
            plaid_config: {
              since_date: sinceDate || null,
              entity_id: feedEntityScope(entities, entityId),
            },
          },
        })
      )
      const connectionId = created?.connection_id
      if (!connectionId) {
        throw new Error('Failed to create the bank connection')
      }
      await linkPlaidConnection({
        graphId: currentGraphId,
        connectionId,
        onConnected: () => {
          setLoading(false)
          onConnected?.()
        },
        onExit: (message) => {
          setLoading(false)
          setError(
            message ??
              'Link closed before a bank was connected. The connection waits under Connections; continue the sign-in from there or delete it.'
          )
        },
      })
    } catch (err) {
      console.error('Plaid connection error:', err)
      setError(plaidRefusalMessage(err, 'Failed to connect a bank'))
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Connect a bank
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Every posted transaction from the accounts you choose lands in your
          inbox with a suggested account, ready to classify and post. The bank
          never becomes the ledger — your chart of accounts stays your own.
        </p>
      </div>

      {error && <Alert color="failure">{error}</Alert>}

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800/50">
        <div className="mb-4 flex items-center gap-3">
          <HiLibrary className="h-8 w-8 shrink-0 text-gray-400" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            A bank feed needs the company&rsquo;s chart of accounts first. Each
            account is linked to a chart account by name, or one is added for
            it. While QuickBooks keeps the group parent&rsquo;s books, a bank
            connects for a subsidiary.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="plaid-since-date">Backfill from</Label>
            <TextInput
              id="plaid-since-date"
              type="date"
              value={sinceDate}
              onChange={(e) => setSinceDate(e.target.value)}
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500">
              The first sync pulls every posted transaction from this date (at
              most two years back).
            </p>
          </div>
          <FeedEntityField
            id="plaid-entity"
            entities={entities}
            value={entityId}
            onChange={setEntityId}
            parentKept={parentKept}
            disabled={loading}
          />
        </div>

        <div className="mt-6 flex gap-2">
          <Button
            color="primary"
            onClick={handleConnect}
            disabled={loading || !canConnect}
          >
            {loading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Opening Plaid Link…
              </>
            ) : (
              'Connect a bank'
            )}
          </Button>
          <Button color="gray" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
