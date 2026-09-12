import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockCreateConnection = vi.fn()
const mockInitOAuth = vi.fn()
const mockPush = vi.fn()

vi.mock('@robosystems/core', () => ({
  SDK: {
    createConnection: (...args: any[]) => mockCreateConnection(...args),
    initOAuth: (...args: any[]) => mockInitOAuth(...args),
  },
  useGraphContext: () => ({ state: { currentGraphId: 'kg_test' } }),
}))

vi.mock('@robosystems/core/ui-components', () => ({
  Spinner: () => <span>spinner</span>,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('flowbite-react', () => ({
  Alert: ({ children }: any) => <div role="alert">{children}</div>,
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Checkbox: ({ id, checked, onChange, disabled }: any) => (
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
    />
  ),
  Label: ({ children, htmlFor }: any) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
  TextInput: ({ id, type, value, onChange, disabled, placeholder }: any) => (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
    />
  ),
}))

import MercurySetupForm from '../components/MercurySetupForm'

// The SDK facade throws `Error("<label> failed: " + JSON.stringify(error))`.
const sdkError = (detail: string) =>
  new Error(`Create connection failed: ${JSON.stringify({ detail })}`)

describe('MercurySetupForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateConnection.mockResolvedValue({
      data: { connection_id: 'conn_1' },
    })
    mockInitOAuth.mockResolvedValue({
      data: { auth_url: 'https://oauth2-sandbox.mercury.com/oauth2/auth?x=1' },
    })
  })

  it('creates the connection with the chosen window and redirects to Mercury', async () => {
    render(<MercurySetupForm onCancel={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('Backfill from'), {
      target: { value: '2026-01-01' },
    })
    fireEvent.click(screen.getByLabelText('Include treasury accounts'))
    fireEvent.click(screen.getByText('Sign in with Mercury'))

    await waitFor(() => expect(mockPush).toHaveBeenCalled())
    expect(mockCreateConnection).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { graph_id: 'kg_test' },
        body: {
          provider: 'mercury',
          mercury_config: {
            since_date: '2026-01-01',
            include_treasury: false,
            api_key: null,
          },
        },
      })
    )
    expect(mockInitOAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          connection_id: 'conn_1',
          redirect_uri: expect.stringMatching(
            /\/connections\/mercury-callback$/
          ),
        }),
      })
    )
    expect(mockPush).toHaveBeenCalledWith(
      'https://oauth2-sandbox.mercury.com/oauth2/auth?x=1'
    )
  })

  it('links the Mercury partner page for anyone not yet banking there', () => {
    render(<MercurySetupForm onCancel={vi.fn()} />)
    const link = screen.getByRole('link', { name: /partner page/ })
    expect(link).toHaveAttribute(
      'href',
      'https://mercury.com/partner/robosystems'
    )
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('hides the API token field on hosted deployments', () => {
    render(<MercurySetupForm onCancel={vi.fn()} />)
    expect(
      screen.queryByLabelText(/Personal API token/)
    ).not.toBeInTheDocument()
  })

  it('connects at once with an API token and skips OAuth', async () => {
    const onConnected = vi.fn()
    render(
      <MercurySetupForm
        apiKeyMode
        onCancel={vi.fn()}
        onConnected={onConnected}
      />
    )

    fireEvent.change(screen.getByLabelText(/Personal API token/), {
      target: { value: 'secret-token-123' },
    })
    fireEvent.click(screen.getByText('Connect with API token'))

    await waitFor(() => expect(onConnected).toHaveBeenCalled())
    expect(
      mockCreateConnection.mock.calls[0][0].body.mercury_config.api_key
    ).toBe('secret-token-123')
    expect(mockInitOAuth).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('explains the QuickBooks conflict in plain words', async () => {
    mockCreateConnection.mockRejectedValue(
      sdkError(
        'Sever the quickbooks connection first — a bank feed is native accounting, and while it is connected the synced ledger is the source of truth for bank transactions.'
      )
    )
    render(<MercurySetupForm onCancel={vi.fn()} />)

    fireEvent.click(screen.getByText('Sign in with Mercury'))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Sever QuickBooks first')
    expect(alert).not.toHaveTextContent('{"detail"')
    expect(mockInitOAuth).not.toHaveBeenCalled()
  })

  it('points a graph with no chart at the templates', async () => {
    mockCreateConnection.mockRejectedValue(
      sdkError(
        'Initialize a chart of accounts first (from a template, or by severing a synced QuickBooks connection to keep its chart).'
      )
    )
    render(<MercurySetupForm onCancel={vi.fn()} />)

    fireEvent.click(screen.getByText('Sign in with Mercury'))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Chart of Accounts page'
    )
  })
})
