import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockCreateConnection = vi.fn()
const mockLinkPlaidConnection = vi.fn()

vi.mock('@/lib/useLedgerGraph', () => ({
  useLedgerGraph: () => ({
    graph: { graphId: 'kg_test' },
    ledgerGraphs: [],
    mismatch: false,
  }),
}))

vi.mock('@robosystems/core', async () => {
  const errors = await vi.importActual<any>('@robosystems/core/lib/sdk-errors')
  return {
    SDK: {
      createConnection: (...args: any[]) => mockCreateConnection(...args),
    },
    unwrapSdk: errors.unwrapSdk,
  }
})

vi.mock('@robosystems/core/ui-components', () => ({
  Spinner: () => <span>spinner</span>,
}))

vi.mock('@/lib/plaid-link', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    linkPlaidConnection: (...args: any[]) => mockLinkPlaidConnection(...args),
  }
})

vi.mock('flowbite-react', () => ({
  Alert: ({ children }: any) => <div role="alert">{children}</div>,
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Label: ({ children, htmlFor }: any) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
  TextInput: ({ id, value, onChange, disabled, type }: any) => (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      disabled={disabled}
    />
  ),
}))

import PlaidLinkSetup from '../components/PlaidLinkSetup'

function ok<T>(data: T) {
  return { data, error: undefined, response: { ok: true } }
}

describe('PlaidLinkSetup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates the connection with the backfill date, then opens Link for it', async () => {
    mockCreateConnection.mockResolvedValueOnce(ok({ connection_id: 'conn_9' }))
    mockLinkPlaidConnection.mockImplementation(async ({ onConnected }) => {
      onConnected()
    })
    const onConnected = vi.fn()
    render(<PlaidLinkSetup onCancel={vi.fn()} onConnected={onConnected} />)

    fireEvent.change(screen.getByLabelText('Backfill from'), {
      target: { value: '2026-01-01' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Connect a bank' }))

    await waitFor(() => expect(onConnected).toHaveBeenCalledTimes(1))
    expect(mockCreateConnection.mock.calls[0][0]).toEqual({
      path: { graph_id: 'kg_test' },
      body: { provider: 'plaid', plaid_config: { since_date: '2026-01-01' } },
    })
    expect(mockLinkPlaidConnection.mock.calls[0][0]).toMatchObject({
      graphId: 'kg_test',
      connectionId: 'conn_9',
    })
  })

  it('shows the refusal in the product’s words', async () => {
    mockCreateConnection.mockResolvedValueOnce({
      data: undefined,
      error: { detail: 'This graph has no chart of accounts' },
      response: { ok: false, status: 422 },
    })
    render(<PlaidLinkSetup onCancel={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Connect a bank' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Chart of Accounts page/
    )
    expect(mockLinkPlaidConnection).not.toHaveBeenCalled()
  })

  it('says when Link closed without a bank', async () => {
    mockCreateConnection.mockResolvedValueOnce(ok({ connection_id: 'conn_9' }))
    mockLinkPlaidConnection.mockImplementation(async ({ onExit }) => {
      onExit('The bank is down')
    })
    render(<PlaidLinkSetup onCancel={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Connect a bank' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The bank is down'
    )
  })
})
