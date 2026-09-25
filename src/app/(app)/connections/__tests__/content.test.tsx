import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListConnections = vi.fn()
const mockSyncConnection = vi.fn()
const mockDeleteConnection = vi.fn()
const mockSetWritePolicy = vi.fn()
const mockShowError = vi.fn()
const mockShowSuccess = vi.fn()
let writePolicyResult: Promise<unknown> | null = null

vi.mock('@/lib/useLedgerGraph', () => ({
  useLedgerGraph: () => ({
    graph: { graphId: 'kg_test' },
    ledgerGraphs: [],
    mismatch: false,
  }),
}))

vi.mock('@robosystems/core', async () => {
  // The real error seam: refusals travel the path they do in the app.
  const errors = await vi.importActual<any>('@robosystems/core/lib/sdk-errors')
  return {
    SDK: {
      listConnections: (...a: any[]) => mockListConnections(...a),
      syncConnection: (...a: any[]) => mockSyncConnection(...a),
      deleteConnection: (...a: any[]) => mockDeleteConnection(...a),
      setConnectionWritePolicy: (...a: any[]) => mockSetWritePolicy(...a),
      getConnectionOptions: vi.fn(),
      initOAuth: vi.fn(),
    },
    unwrapSdk: errors.unwrapSdk,
    useToast: () => ({
      showError: mockShowError,
      showSuccess: mockShowSuccess,
      ToastContainer: () => null,
    }),
    PageLayout: ({ children }: any) => <div>{children}</div>,
    PageHeader: ({ title }: any) => <h1>{title}</h1>,
    EmptyState: ({ title }: any) => <div>{title}</div>,
  }
})

vi.mock('@robosystems/core/ui-components', () => ({
  LoadingState: () => <div>loading</div>,
  Spinner: () => <div>spinner</div>,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('flowbite-react', () => ({
  Alert: ({ children }: any) => <div role="alert">{children}</div>,
  Badge: ({ children }: any) => <span>{children}</span>,
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
  Card: ({ children }: any) => <div>{children}</div>,
  Modal: ({ children, show }: any) => (show ? <div>{children}</div> : null),
  ModalBody: ({ children }: any) => <div>{children}</div>,
  ModalFooter: ({ children }: any) => <div>{children}</div>,
  ModalHeader: ({ children }: any) => <div>{children}</div>,
}))

vi.mock('@/components/DocsLink', () => ({ default: () => null }))

// Children reduced to the buttons that drive the handlers under test.
vi.mock('../components/ConnectionCard', () => ({
  default: ({ connection, onSync, onDelete, onSetWritePolicy }: any) => (
    <div>
      <span>{connection.connection_id}</span>
      <button onClick={onSync}>open sync</button>
      <button onClick={onDelete}>open delete</button>
      <button
        onClick={() => {
          writePolicyResult = onSetWritePolicy('native')
          writePolicyResult?.catch(() => undefined)
        }}
      >
        set native
      </button>
    </div>
  ),
}))
vi.mock('../components/SyncOptionsModal', () => ({
  default: ({ isOpen, onSubmit }: any) =>
    isOpen ? (
      <button onClick={() => onSubmit({ full_rebuild: false })}>
        start sync
      </button>
    ) : null,
}))
vi.mock('../components/DeleteConnectionModal', () => ({
  default: ({ show, onConfirm }: any) =>
    show ? <button onClick={() => onConfirm('sever')}>sever</button> : null,
}))
vi.mock('../components/QuickBooksSetupForm', () => ({ default: () => null }))
vi.mock('../components/MercurySetupForm', () => ({
  default: () => null,
  MERCURY_PARTNER_URL: 'https://mercury.example',
}))

import ConnectionsContent from '../content'

const CONNECTION = {
  connection_id: 'conn_1',
  provider: 'quickbooks',
  status: 'connected',
  last_sync: null,
}

// A refusal as the generated SDK delivers it: resolved, never thrown.
const refused = (status: number, detail: unknown) => ({
  data: undefined,
  error: { detail },
  response: { status },
})

const notFound = refused(404, {
  detail: 'Connection not found',
  code: 'NOT_FOUND',
})

async function renderLoaded() {
  render(<ConnectionsContent />)
  await screen.findByText('conn_1')
}

describe('Connections error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    writePolicyResult = null
    mockListConnections.mockResolvedValue({
      data: [CONNECTION],
      response: { status: 200 },
    })
  })

  it('a refused sever reports the refusal, never the severed toast', async () => {
    mockDeleteConnection.mockResolvedValue(notFound)
    await renderLoaded()
    fireEvent.click(screen.getByText('open delete'))
    fireEvent.click(screen.getByText('sever'))

    await waitFor(() =>
      expect(mockShowError).toHaveBeenCalledWith('Connection not found')
    )
    expect(mockShowSuccess).not.toHaveBeenCalled()
  })

  it('a refused sync starts no watch and says so', async () => {
    mockSyncConnection.mockResolvedValue(notFound)
    await renderLoaded()
    fireEvent.click(screen.getByText('open sync'))
    fireEvent.click(screen.getByText('start sync'))

    await waitFor(() =>
      expect(mockShowError).toHaveBeenCalledWith('Connection not found')
    )
    expect(mockShowSuccess).not.toHaveBeenCalledWith(
      'Sync started successfully'
    )
  })

  it('a refused write-policy change throws so the card reverts', async () => {
    mockSetWritePolicy.mockResolvedValue(notFound)
    await renderLoaded()
    fireEvent.click(screen.getByText('set native'))

    await expect(writePolicyResult).rejects.toMatchObject({ status: 404 })
    expect(mockShowError).toHaveBeenCalledWith('Connection not found')
    expect(mockShowSuccess).not.toHaveBeenCalled()
  })

  it('a refused list renders the error, not the empty state', async () => {
    mockListConnections.mockResolvedValue(
      refused(403, 'You do not have access to this graph')
    )
    render(<ConnectionsContent />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'You do not have access to this graph'
    )
    expect(screen.queryByText('No connections yet')).not.toBeInTheDocument()
  })

  it('a successful sever still confirms it', async () => {
    mockDeleteConnection.mockResolvedValue({
      data: {},
      response: { status: 200 },
    })
    await renderLoaded()
    fireEvent.click(screen.getByText('open delete'))
    fireEvent.click(screen.getByText('sever'))

    await waitFor(() =>
      expect(mockShowSuccess).toHaveBeenCalledWith(
        'Connection severed — this graph now keeps its books natively'
      )
    )
  })
})
