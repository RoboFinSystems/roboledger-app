import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListReportShares = vi.fn()
const mockRevokeReportShare = vi.fn()

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      listReportShares: (...args: any[]) => mockListReportShares(...args),
      revokeReportShare: (...args: any[]) => mockRevokeReportShare(...args),
    },
  },
  LoadingState: () => <div data-testid="loading-state" role="status" />,
}))

vi.mock('flowbite-react', () => ({
  Alert: ({ children }: any) => <div data-testid="alert">{children}</div>,
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Label: ({ children, htmlFor }: any) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
  Modal: ({ children }: any) => <div>{children}</div>,
  ModalBody: ({ children }: any) => <div>{children}</div>,
  ModalFooter: ({ children }: any) => <div>{children}</div>,
  ModalHeader: ({ children }: any) => <div>{children}</div>,
  Spinner: () => <span role="status" />,
}))

import ManageSharesModal from '../components/ManageSharesModal'

const share = (overrides: Record<string, unknown> = {}) => ({
  id: 'share_1',
  reportId: 'rpt_1',
  targetGraphId: 'kg_acme',
  targetGraphName: 'Acme',
  sharedBy: 'usr_1',
  sharedAt: '2026-10-01T12:00:00Z',
  revokedAt: null,
  factCount: 47,
  ...overrides,
})

const renderModal = () =>
  render(
    <ManageSharesModal graphId="kg_mine" reportId="rpt_1" onClose={() => {}} />
  )

const revokeButtons = () => screen.getAllByRole('button', { name: 'Revoke' })

describe('ManageSharesModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListReportShares.mockResolvedValue([])
  })

  it('reads the report’s own share record, revoked shares included', async () => {
    mockListReportShares.mockResolvedValue([share()])
    renderModal()

    await waitFor(() => expect(screen.getByText('Acme')).toBeInTheDocument())
    expect(mockListReportShares).toHaveBeenCalledWith('kg_mine', {
      reportId: 'rpt_1',
      includeRevoked: true,
    })
    expect(screen.getByText(/47 facts/)).toBeInTheDocument()
  })

  it('offers Revoke only on the copies recipients still hold', async () => {
    mockListReportShares.mockResolvedValue([
      share({ id: 'share_2', sharedAt: '2026-10-01T12:00:00Z' }),
      share({
        id: 'share_1',
        sharedAt: '2026-09-01T12:00:00Z',
        revokedAt: '2026-09-15T12:00:00Z',
        factCount: 40,
      }),
      share({
        id: 'share_0',
        targetGraphId: 'kg_gone',
        targetGraphName: 'Former Investor',
        revokedAt: '2026-08-01T12:00:00Z',
      }),
    ])
    renderModal()

    await waitFor(() =>
      expect(screen.getByText('Former Investor')).toBeInTheDocument()
    )
    // Acme was shared to, revoked, and shared to again: once live, once revoked.
    expect(screen.getAllByText('Acme')).toHaveLength(2)
    expect(revokeButtons()).toHaveLength(1)
    expect(screen.getAllByText(/revoked/i).length).toBeGreaterThan(0)
  })

  it('has no manual graph-ID entry: the record is the list', async () => {
    renderModal()
    await waitFor(() =>
      expect(
        screen.getByText('This report has not been shared.')
      ).toBeInTheDocument()
    )
    expect(screen.queryByLabelText('Revoke by graph ID')).toBeNull()
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('reports a deleted copy distinctly from one the recipient already removed', async () => {
    mockListReportShares.mockResolvedValue([share()])
    mockRevokeReportShare.mockResolvedValue({ copy_deleted: false })

    renderModal()
    await waitFor(() => expect(screen.getByText('Acme')).toBeInTheDocument())
    fireEvent.click(revokeButtons()[0])

    await waitFor(() =>
      expect(screen.getByText(/had already deleted it/)).toBeInTheDocument()
    )
    expect(mockRevokeReportShare).toHaveBeenCalledWith(
      'kg_mine',
      'rpt_1',
      'kg_acme'
    )
  })

  it('confirms deletion when the copy was actually pulled', async () => {
    mockListReportShares.mockResolvedValue([share()])
    mockRevokeReportShare.mockResolvedValue({ copy_deleted: true })

    renderModal()
    await waitFor(() => expect(screen.getByText('Acme')).toBeInTheDocument())
    fireEvent.click(revokeButtons()[0])

    await waitFor(() =>
      expect(screen.getByText(/deleted from their books/)).toBeInTheDocument()
    )
  })

  it('explains a revoke that found no live share', async () => {
    mockListReportShares.mockResolvedValue([share()])
    mockRevokeReportShare.mockRejectedValue(
      new Error(
        'Revoke report share failed: {"detail":"No active share of report \'rpt_1\' to \'kg_acme\'."}'
      )
    )

    renderModal()
    await waitFor(() => expect(screen.getByText('Acme')).toBeInTheDocument())
    fireEvent.click(revokeButtons()[0])

    await waitFor(() =>
      expect(
        screen.getByText(/never shared to that recipient/)
      ).toBeInTheDocument()
    )
  })

  it('surfaces a failed load', async () => {
    mockListReportShares.mockRejectedValue(new Error('boom'))
    renderModal()
    await waitFor(() =>
      expect(screen.getByText('Failed to load recipients.')).toBeInTheDocument()
    )
  })
})
