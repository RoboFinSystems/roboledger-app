'use client'

import { useEntityScope } from '@/lib/entity-scope'
import { apiErrorMessage } from '@/lib/ledger/errors'
import { useLedgerGraph } from '@/lib/useLedgerGraph'
import { SDK, unwrapSdk } from '@robosystems/core'
import { Spinner } from '@robosystems/core/ui-components'
import { Alert, Button, Checkbox, Label, TextInput } from 'flowbite-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { HiLibrary } from 'react-icons/hi'
import FeedEntityField, {
  feedEntityAllowed,
  feedEntityDefault,
  feedEntityScope,
} from './FeedEntityField'

interface MercurySetupFormProps {
  /** Whether this deployment lets a personal read-only API token connect
   *  directly (`optional_config` carries `api_key`); hosted production never
   *  does — there the only route is OAuth. */
  apiKeyMode?: boolean
  onCancel: () => void
  /** Called when an API-token connection is live (no browser round-trip). */
  onConnected?: () => void
  /** A QuickBooks connection is live, so the group parent's books are its. */
  parentKept?: boolean
}

/** RoboSystems' Mercury partner page — the referral link that came with the
 *  OAuth partnership, and the front door for anyone not yet banking there. */
export const MERCURY_PARTNER_URL = 'https://mercury.com/partner/robosystems'

/** The default backfill start the backend applies when none is given. */
const defaultSinceDate = (): string => {
  const year = new Date().getFullYear() - 1
  return `${year}-01-01`
}

const toMessage = (err: unknown, fallback: string): string => {
  const friendly = apiErrorMessage(err, fallback)
  const lower = friendly.toLowerCase()
  // CHART_REQUIRED mentions severing QuickBooks as one way to get a chart, so
  // it is tested before the QUICKBOOKS_ACTIVE shape.
  if (lower.includes('chart of accounts')) {
    return 'This company has no chart of accounts yet. Start one from a template on the Chart of Accounts page, then connect Mercury.'
  }
  if (lower.includes('sever') && lower.includes('quickbooks')) {
    return 'QuickBooks keeps the group parent’s books, so Mercury cannot connect for it. Pick a subsidiary, or sever QuickBooks first — the chart it created stays as the parent’s own.'
  }
  return friendly
}

// The Mercury bank feed. A bank feed is native accounting: the company its
// accounts land on must already have a chart of accounts and must not be the
// one QuickBooks keeps (the group parent, while QuickBooks is connected) —
// the backend refuses otherwise and the message says which. Every bank
// account the feed exposes is linked to a chart account by name on that
// company's chart, or one is added.
export default function MercurySetupForm({
  apiKeyMode = false,
  onCancel,
  onConnected,
  parentKept = false,
}: MercurySetupFormProps) {
  const router = useRouter()
  const currentGraphId = useLedgerGraph().graph?.graphId ?? null
  const { entities } = useEntityScope()
  const [sinceDate, setSinceDate] = useState(defaultSinceDate)
  const [entityId, setEntityId] = useState(() =>
    feedEntityDefault(entities, parentKept)
  )
  const [includeTreasury, setIncludeTreasury] = useState(true)
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const usingApiKey = apiKeyMode && apiKey.trim().length > 0

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
            provider: 'mercury',
            mercury_config: {
              since_date: sinceDate || null,
              include_treasury: includeTreasury,
              api_key: usingApiKey ? apiKey.trim() : null,
              entity_id: feedEntityScope(entities, entityId),
            },
          },
        })
      )

      const connectionId = created?.connection_id
      if (!connectionId) {
        throw new Error('Failed to create Mercury connection')
      }

      if (usingApiKey) {
        // The token was proven against Mercury and the first sync is already
        // dispatched; nothing else to do here.
        onConnected?.()
        return
      }

      const oauth = unwrapSdk(
        await SDK.initOAuth({
          path: { graph_id: currentGraphId },
          body: {
            connection_id: connectionId,
            redirect_uri: `${window.location.origin}/connections/mercury-callback`,
          },
        })
      )

      const authUrl = oauth?.auth_url
      if (!authUrl) {
        throw new Error('Failed to get Mercury authorization URL')
      }
      router.push(authUrl)
    } catch (err) {
      console.error('Mercury connection error:', err)
      setError(toMessage(err, 'Failed to connect to Mercury'))
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Connect Mercury
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Every posted bank transaction lands in your inbox with a suggested
          account, ready to classify and post. Mercury never becomes the ledger
          — your chart of accounts stays your own.
        </p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Not banking with Mercury yet?{' '}
          <a
            href={MERCURY_PARTNER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 dark:text-primary-400 font-medium underline"
          >
            Open an account through our partner page
          </a>
          .
        </p>
      </div>

      {error && <Alert color="failure">{error}</Alert>}

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800/50">
        <div className="mb-4 flex items-center gap-3">
          <HiLibrary className="h-8 w-8 shrink-0 text-gray-400" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            A bank feed needs the company&rsquo;s chart of accounts first. Each
            Mercury account is linked to a chart account by name, or one is
            added for it. While QuickBooks keeps the group parent&rsquo;s books,
            Mercury connects for a subsidiary.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="mercury-since-date">Backfill from</Label>
            <TextInput
              id="mercury-since-date"
              type="date"
              value={sinceDate}
              onChange={(e) => setSinceDate(e.target.value)}
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500">
              The first sync pulls every posted transaction from this date.
            </p>
          </div>
          <div className="flex items-start gap-2 pt-7">
            <Checkbox
              id="mercury-include-treasury"
              checked={includeTreasury}
              onChange={(e) => setIncludeTreasury(e.target.checked)}
              disabled={loading}
            />
            <Label htmlFor="mercury-include-treasury" className="text-sm">
              Include treasury accounts
            </Label>
          </div>
        </div>

        <div className="mt-4">
          <FeedEntityField
            id="mercury-entity"
            entities={entities}
            value={entityId}
            onChange={setEntityId}
            parentKept={parentKept}
            disabled={loading}
          />
        </div>

        {apiKeyMode && (
          <div className="mt-4">
            <Label htmlFor="mercury-api-key">
              Personal API token (read-only) — optional
            </Label>
            <TextInput
              id="mercury-api-key"
              type="password"
              autoComplete="off"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={loading}
              placeholder="Leave empty to sign in with Mercury"
            />
            <p className="mt-1 text-xs text-gray-500">
              This deployment allows a personal token in place of the Mercury
              sign-in. Create a read-only token in Mercury under Settings → API
              tokens.
            </p>
          </div>
        )}

        <div className="border-primary-200 bg-primary-50 text-primary-900 dark:border-primary-700/40 dark:bg-primary-900/20 dark:text-primary-100 mt-4 rounded-md border p-3 text-xs">
          After connecting, the first sync runs automatically. Later syncs pull
          the last 60 days; use <span className="font-medium">Sync Now</span> on
          the connection card for a different window.
        </div>

        <div className="mt-4 text-center">
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <Spinner size="sm" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {usingApiKey
                  ? 'Connecting to Mercury...'
                  : 'Redirecting to Mercury...'}
              </span>
            </div>
          ) : (
            <Button
              color="primary"
              onClick={handleConnect}
              disabled={!canConnect}
            >
              {usingApiKey ? 'Connect with API token' : 'Sign in with Mercury'}
            </Button>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button color="gray" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
