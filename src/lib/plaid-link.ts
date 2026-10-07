import { apiErrorMessage } from '@/lib/ledger/errors'
import { SDK, unwrapSdk } from '@robosystems/core'

/**
 * Plaid Link in the browser.
 *
 * Plaid's rule is that the initialize script comes from cdn.plaid.com, never
 * from a bundle, so it is loaded once on demand (the CSP in `proxy.ts`
 * allows exactly that origin). A bank that signs in through OAuth leaves
 * the page and comes back to `/connections/plaid-callback`, which must open
 * Link again with the token it started with. Only which connection that
 * was waits in sessionStorage; the backend keeps the token for its life and
 * answers the second `initOAuth` with the same one, so no token sits in the
 * browser's storage.
 */

export const PLAID_LINK_SCRIPT =
  'https://cdn.plaid.com/link/v2/stable/link-initialize.js'

/** Where an OAuth bank sends the user back; `initOAuth` is told the same. */
export const PLAID_CALLBACK_PATH = '/connections/plaid-callback'

const PENDING_KEY = 'roboledger:plaid-link'

export interface PlaidLinkError {
  error_code?: string | null
  error_message?: string | null
  display_message?: string | null
}

export interface PlaidLinkOptions {
  token: string
  /** The full URL the bank redirected back to, on the callback page only. */
  receivedRedirectUri?: string
  onSuccess: (publicToken: string, metadata: unknown) => void
  onExit?: (error: PlaidLinkError | null, metadata: unknown) => void
}

export interface PlaidLinkHandler {
  open: () => void
  exit: (options?: { force?: boolean }) => void
  destroy: () => void
}

interface PlaidGlobal {
  create: (options: PlaidLinkOptions) => PlaidLinkHandler
}

declare global {
  interface Window {
    Plaid?: PlaidGlobal
  }
}

let loading: Promise<PlaidGlobal> | null = null

/** The Link script, loaded once. */
export function loadPlaidLink(): Promise<PlaidGlobal> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Plaid Link needs a browser'))
  }
  if (window.Plaid) return Promise.resolve(window.Plaid)
  if (loading) return loading
  loading = new Promise<PlaidGlobal>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = PLAID_LINK_SCRIPT
    script.async = true
    script.onload = () => {
      if (window.Plaid) resolve(window.Plaid)
      else {
        loading = null
        reject(new Error('Plaid Link did not initialize'))
      }
    }
    script.onerror = () => {
      loading = null
      reject(new Error('Plaid Link could not be loaded'))
    }
    document.head.appendChild(script)
  })
  return loading
}

/** Open Link with a token from `initOAuth`. */
export async function openPlaidLink(
  options: PlaidLinkOptions
): Promise<PlaidLinkHandler> {
  const plaid = await loadPlaidLink()
  const handler = plaid.create(options)
  handler.open()
  return handler
}

export interface PendingPlaidLink {
  graphId: string
  connectionId: string
}

export function savePendingPlaidLink(pending: PendingPlaidLink): void {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending))
  } catch {
    // Storage blocked: an OAuth bank cannot resume, every other bank still
    // completes inside the modal.
  }
}

/** The pending Link, taken (an OAuth return is single-use). */
export function takePendingPlaidLink(): PendingPlaidLink | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY)
    sessionStorage.removeItem(PENDING_KEY)
    return raw ? (JSON.parse(raw) as PendingPlaidLink) : null
  } catch {
    return null
  }
}

export function clearPendingPlaidLink(): void {
  try {
    sessionStorage.removeItem(PENDING_KEY)
  } catch {
    // nothing to clear
  }
}

/**
 * A Link token for the connection from the backend: update mode when the
 * connection already holds an Item that needs its login repaired, and the
 * same token while it lives, so an OAuth bank's return gets the one Link
 * started with.
 */
export async function requestPlaidLinkToken(
  graphId: string,
  connectionId: string
): Promise<{ linkToken: string; state: string }> {
  const oauth = unwrapSdk(
    await SDK.initOAuth({
      path: { graph_id: graphId },
      body: {
        connection_id: connectionId,
        redirect_uri: `${window.location.origin}${PLAID_CALLBACK_PATH}`,
      },
    })
  )
  const linkToken = oauth?.link_token
  const state = oauth?.state
  if (!linkToken || !state) {
    throw new Error('Plaid did not return a Link token')
  }
  return { linkToken, state }
}

/**
 * Finish Link: hand the public token to the backend, which exchanges it,
 * stores the Item, records the consent and starts the first sync.
 */
export async function completePlaidLink(args: {
  graphId: string
  publicToken: string
  state: string
}): Promise<{ success: boolean; message: string; connection_id: string }> {
  const data = unwrapSdk(
    await SDK.oauthCallback({
      path: { graph_id: args.graphId, provider: 'plaid' },
      body: { code: args.publicToken, state: args.state },
    })
  )
  if (!data?.success) {
    throw new Error(data?.message ?? 'The bank could not be connected')
  }
  return data
}

/**
 * Start Link for a connection: a Link token from the backend (update mode
 * when the connection already holds an Item that needs its login
 * repaired), then the widget. `onConnected` fires once the backend has
 * the Item; `onExit` when Link closes without one, with the reason or null
 * when the person simply closed it.
 */
export async function linkPlaidConnection(args: {
  graphId: string
  connectionId: string
  onConnected: () => void
  onExit: (message: string | null) => void
}): Promise<void> {
  const { graphId, connectionId, onConnected, onExit } = args
  const { linkToken, state } = await requestPlaidLinkToken(
    graphId,
    connectionId
  )
  savePendingPlaidLink({ graphId, connectionId })
  await openPlaidLink({
    token: linkToken,
    onSuccess: (publicToken) => {
      void completePlaidLink({ graphId, publicToken, state }).then(
        () => {
          clearPendingPlaidLink()
          onConnected()
        },
        (err: unknown) => {
          clearPendingPlaidLink()
          onExit(plaidRefusalMessage(err, 'The bank could not be connected'))
        }
      )
    },
    onExit: (error) => {
      clearPendingPlaidLink()
      onExit(
        error
          ? error.display_message ||
              error.error_message ||
              'Link closed before the bank was connected'
          : null
      )
    },
  })
}

/** A refusal from the backend, in the product's words. */
export function plaidRefusalMessage(err: unknown, fallback: string): string {
  const friendly = apiErrorMessage(err, fallback)
  const lower = friendly.toLowerCase()
  // CHART_REQUIRED mentions severing QuickBooks as one way to get a chart,
  // so it is tested before the QUICKBOOKS_ACTIVE shape.
  if (lower.includes('chart of accounts')) {
    return 'This company has no chart of accounts yet. Start one from a template on the Chart of Accounts page, then connect a bank.'
  }
  if (lower.includes('sever') && lower.includes('quickbooks')) {
    return 'QuickBooks keeps the group parent’s books, so a bank cannot connect for it. Pick a subsidiary, or sever QuickBooks first — the chart it created stays as the parent’s own.'
  }
  if (lower.includes('already connected') || lower.includes('duplicate')) {
    return 'This bank is already connected to this graph. Its accounts are on the existing connection.'
  }
  return friendly
}
