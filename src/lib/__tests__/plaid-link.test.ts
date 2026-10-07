import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockInitOAuth = vi.fn()
const mockOauthCallback = vi.fn()

vi.mock('@robosystems/core', async () => {
  const errors = await vi.importActual<any>('@robosystems/core/lib/sdk-errors')
  return {
    SDK: {
      initOAuth: (...args: any[]) => mockInitOAuth(...args),
      oauthCallback: (...args: any[]) => mockOauthCallback(...args),
    },
    unwrapSdk: errors.unwrapSdk,
  }
})

import {
  clearPendingPlaidLink,
  completePlaidLink,
  linkPlaidConnection,
  loadPlaidLink,
  plaidRefusalMessage,
  requestPlaidLinkToken,
  savePendingPlaidLink,
  takePendingPlaidLink,
} from '../plaid-link'

const ok = <T>(data: T) => ({ data, error: undefined, response: { ok: true } })

describe('pending Link storage', () => {
  beforeEach(() => sessionStorage.clear())

  it('round-trips and is taken once', () => {
    savePendingPlaidLink({
      graphId: 'kg_1',
      connectionId: 'conn_1',
    })
    expect(takePendingPlaidLink()).toEqual({
      graphId: 'kg_1',
      connectionId: 'conn_1',
    })
    expect(takePendingPlaidLink()).toBeNull()
  })

  it('clears', () => {
    savePendingPlaidLink({
      graphId: 'kg_1',
      connectionId: 'conn_1',
    })
    clearPendingPlaidLink()
    expect(takePendingPlaidLink()).toBeNull()
  })
})

describe('linkPlaidConnection', () => {
  const create = vi.fn()
  const open = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    window.Plaid = { create }
    create.mockReturnValue({ open, exit: vi.fn(), destroy: vi.fn() })
  })

  afterEach(() => {
    delete window.Plaid
  })

  it('asks the backend for a Link token, opens Link, and completes on success', async () => {
    mockInitOAuth.mockResolvedValueOnce(
      ok({ link_token: 'link-tok', state: 'st', auth_url: null })
    )
    mockOauthCallback.mockResolvedValueOnce(
      ok({ success: true, message: 'ok', connection_id: 'conn_1' })
    )
    const onConnected = vi.fn()
    const onExit = vi.fn()

    await linkPlaidConnection({
      graphId: 'kg_1',
      connectionId: 'conn_1',
      onConnected,
      onExit,
    })

    expect(mockInitOAuth.mock.calls[0][0].body).toEqual({
      connection_id: 'conn_1',
      redirect_uri: `${window.location.origin}/connections/plaid-callback`,
    })
    expect(create.mock.calls[0][0].token).toBe('link-tok')
    expect(open).toHaveBeenCalledTimes(1)
    // Which connection is in Link waits for an OAuth bank's return until
    // Link is done — never the token itself.
    const pending = sessionStorage.getItem('roboledger:plaid-link') ?? ''
    expect(JSON.parse(pending)).toEqual({
      graphId: 'kg_1',
      connectionId: 'conn_1',
    })
    expect(pending).not.toContain('link-tok')

    create.mock.calls[0][0].onSuccess('public-tok', {})
    await vi.waitFor(() => expect(onConnected).toHaveBeenCalledTimes(1))
    expect(mockOauthCallback.mock.calls[0][0]).toEqual({
      path: { graph_id: 'kg_1', provider: 'plaid' },
      body: { code: 'public-tok', state: 'st' },
    })
    expect(sessionStorage.getItem('roboledger:plaid-link')).toBeNull()
    expect(onExit).not.toHaveBeenCalled()
  })

  it('reports a close without a bank as null, and a bank error by its message', async () => {
    mockInitOAuth.mockResolvedValue(
      ok({ link_token: 'link-tok', state: 'st', auth_url: null })
    )
    const onExit = vi.fn()
    await linkPlaidConnection({
      graphId: 'kg_1',
      connectionId: 'conn_1',
      onConnected: vi.fn(),
      onExit,
    })
    create.mock.calls[0][0].onExit(null, {})
    expect(onExit).toHaveBeenLastCalledWith(null)
    create.mock.calls[0][0].onExit(
      { error_code: 'INSTITUTION_DOWN', display_message: 'The bank is down' },
      {}
    )
    expect(onExit).toHaveBeenLastCalledWith('The bank is down')
    expect(sessionStorage.getItem('roboledger:plaid-link')).toBeNull()
  })

  it('refuses when the backend returns no Link token', async () => {
    mockInitOAuth.mockResolvedValueOnce(
      ok({ auth_url: 'https://x', state: 'st', link_token: null })
    )
    await expect(
      linkPlaidConnection({
        graphId: 'kg_1',
        connectionId: 'conn_1',
        onConnected: vi.fn(),
        onExit: vi.fn(),
      })
    ).rejects.toThrow(/Link token/)
    expect(open).not.toHaveBeenCalled()
  })
})

describe('requestPlaidLinkToken', () => {
  beforeEach(() => vi.clearAllMocks())

  it('asks initOAuth for the connection with the callback as the redirect', async () => {
    mockInitOAuth.mockResolvedValueOnce(
      ok({ link_token: 'link-tok', state: 'st2', auth_url: null })
    )
    await expect(requestPlaidLinkToken('kg_1', 'conn_1')).resolves.toEqual({
      linkToken: 'link-tok',
      state: 'st2',
    })
    expect(mockInitOAuth.mock.calls[0][0].body).toEqual({
      connection_id: 'conn_1',
      redirect_uri: `${window.location.origin}/connections/plaid-callback`,
    })
  })
})

describe('completePlaidLink', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws the backend message when the exchange did not succeed', async () => {
    mockOauthCallback.mockResolvedValueOnce(
      ok({
        success: false,
        message: 'Bank already connected',
        connection_id: 'c',
      })
    )
    await expect(
      completePlaidLink({ graphId: 'kg_1', publicToken: 'p', state: 's' })
    ).rejects.toThrow('Bank already connected')
  })
})

describe('loadPlaidLink', () => {
  afterEach(() => {
    delete window.Plaid
    document.head.querySelectorAll('script').forEach((s) => s.remove())
  })

  it('resolves at once when Link is already on the page', async () => {
    const plaid = { create: vi.fn() }
    window.Plaid = plaid
    await expect(loadPlaidLink()).resolves.toBe(plaid)
    expect(document.head.querySelector('script')).toBeNull()
  })
})

describe('plaidRefusalMessage', () => {
  const refusal = (detail: string, status = 409) =>
    Object.assign(new Error(detail), { status, detail })

  it('names the chart, the QuickBooks conflict, and the duplicate bank', () => {
    expect(
      plaidRefusalMessage(
        refusal('This graph has no chart of accounts', 422),
        'x'
      )
    ).toMatch(/Chart of Accounts page/)
    expect(
      plaidRefusalMessage(refusal('Sever the QuickBooks connection first'), 'x')
    ).toMatch(/Sever QuickBooks first/)
    expect(
      plaidRefusalMessage(
        refusal('This bank is already connected to the graph'),
        'x'
      )
    ).toMatch(/already connected/)
    expect(plaidRefusalMessage(new Error('boom'), 'fallback')).toBe('fallback')
  })
})
