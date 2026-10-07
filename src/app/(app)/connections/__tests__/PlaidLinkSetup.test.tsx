import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockCreateConnection = vi.fn()
const mockLinkPlaidConnection = vi.fn()
let mockEntities: any[] = []

vi.mock('@/lib/useLedgerGraph', () => ({
  useLedgerGraph: () => ({
    graph: { graphId: 'kg_test' },
    ledgerGraphs: [],
    mismatch: false,
  }),
}))

vi.mock('@/lib/entity-scope', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    useEntityScope: () => ({ entities: mockEntities }),
  }
})

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
  Select: ({ id, value, onChange, disabled, children }: any) => (
    <select id={id} value={value} onChange={onChange} disabled={disabled}>
      {children}
    </select>
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

const PARENT = {
  id: 'ent_parent',
  name: 'Harbor Holdings',
  isParent: true,
  parentEntityId: null,
}
const SUB = {
  id: 'ent_sub',
  name: 'Cadence Studio',
  isParent: false,
  parentEntityId: 'ent_parent',
}

function ok<T>(data: T) {
  return { data, error: undefined, response: { ok: true } }
}

const connectButton = () =>
  screen.getByRole('button', { name: 'Connect a bank' })

describe('PlaidLinkSetup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEntities = [PARENT]
  })

  it('creates the connection for the group parent, then opens Link for it', async () => {
    mockCreateConnection.mockResolvedValueOnce(ok({ connection_id: 'conn_9' }))
    mockLinkPlaidConnection.mockImplementation(async ({ onConnected }) => {
      onConnected()
    })
    const onConnected = vi.fn()
    render(<PlaidLinkSetup onCancel={vi.fn()} onConnected={onConnected} />)

    // A single-company group has no company to choose.
    expect(screen.queryByLabelText('Company')).toBeNull()
    fireEvent.change(screen.getByLabelText('Backfill from'), {
      target: { value: '2026-01-01' },
    })
    fireEvent.click(connectButton())

    await waitFor(() => expect(onConnected).toHaveBeenCalledTimes(1))
    expect(mockCreateConnection.mock.calls[0][0]).toEqual({
      path: { graph_id: 'kg_test' },
      body: {
        provider: 'plaid',
        plaid_config: { since_date: '2026-01-01', entity_id: null },
      },
    })
    expect(mockLinkPlaidConnection.mock.calls[0][0]).toMatchObject({
      graphId: 'kg_test',
      connectionId: 'conn_9',
    })
  })

  it('lets a holding company connect the bank for a subsidiary', async () => {
    mockEntities = [PARENT, SUB]
    mockCreateConnection.mockResolvedValueOnce(ok({ connection_id: 'conn_9' }))
    mockLinkPlaidConnection.mockImplementation(async ({ onConnected }) => {
      onConnected()
    })
    render(<PlaidLinkSetup onCancel={vi.fn()} />)

    const select = screen.getByLabelText('Company') as HTMLSelectElement
    expect(select.value).toBe('ent_parent')
    fireEvent.change(select, { target: { value: 'ent_sub' } })
    fireEvent.click(connectButton())

    await waitFor(() => expect(mockCreateConnection).toHaveBeenCalledTimes(1))
    expect(mockCreateConnection.mock.calls[0][0].body.plaid_config).toEqual({
      since_date: expect.any(String),
      entity_id: 'ent_sub',
    })
  })

  it('keeps the bank off the parent while QuickBooks keeps its books', async () => {
    mockEntities = [PARENT, SUB]
    mockCreateConnection.mockResolvedValueOnce(ok({ connection_id: 'conn_9' }))
    mockLinkPlaidConnection.mockImplementation(async ({ onConnected }) => {
      onConnected()
    })
    render(<PlaidLinkSetup onCancel={vi.fn()} parentKept />)

    const select = screen.getByLabelText('Company') as HTMLSelectElement
    expect(select.value).toBe('ent_sub')
    const parentOption = screen.getByRole('option', {
      name: /Harbor Holdings/,
    }) as HTMLOptionElement
    expect(parentOption.disabled).toBe(true)
    fireEvent.click(connectButton())

    await waitFor(() => expect(mockCreateConnection).toHaveBeenCalledTimes(1))
    expect(
      mockCreateConnection.mock.calls[0][0].body.plaid_config.entity_id
    ).toBe('ent_sub')
  })

  it('cannot connect a single company whose books QuickBooks keeps', () => {
    render(<PlaidLinkSetup onCancel={vi.fn()} parentKept />)
    expect(screen.getByRole('note')).toHaveTextContent(/Add a subsidiary/)
    expect(connectButton()).toBeDisabled()
  })

  it('shows the refusal in the product’s words', async () => {
    mockCreateConnection.mockResolvedValueOnce({
      data: undefined,
      error: { detail: 'Initialize a chart of accounts for the entity first' },
      response: { ok: false, status: 409 },
    })
    render(<PlaidLinkSetup onCancel={vi.fn()} />)
    fireEvent.click(connectButton())
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
    fireEvent.click(connectButton())
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The bank is down'
    )
  })
})
