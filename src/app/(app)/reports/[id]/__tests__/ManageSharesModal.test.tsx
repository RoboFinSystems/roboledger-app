import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListPublishLists = vi.fn()
const mockGetPublishList = vi.fn()
const mockRevokeReportShare = vi.fn()

vi.mock('@robosystems/core', () => ({
  clients: {
    reports: {
      listPublishLists: (...args: any[]) => mockListPublishLists(...args),
      getPublishList: (...args: any[]) => mockGetPublishList(...args),
    },
    ledger: {
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
  TextInput: (props: any) => <input type="text" {...props} />,
}))

import ManageSharesModal from '../components/ManageSharesModal'

const renderModal = () =>
  render(
    <ManageSharesModal graphId="kg_mine" reportId="rpt_1" onClose={() => {}} />
  )

const revokeButtons = () => screen.getAllByRole('button', { name: 'Revoke' })

describe('ManageSharesModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListPublishLists.mockResolvedValue([])
  })

  it('collapses a recipient that sits on two lists into one row', async () => {
    mockListPublishLists.mockResolvedValue([
      { id: 'pl_1', name: 'Investors' },
      { id: 'pl_2', name: 'Board' },
    ])
    mockGetPublishList
      .mockResolvedValueOnce({
        id: 'pl_1',
        name: 'Investors',
        members: [
          {
            id: 'm1',
            targetGraphId: 'kg_acme',
            targetGraphName: 'Acme',
            targetOrgName: null,
          },
        ],
      })
      .mockResolvedValueOnce({
        id: 'pl_2',
        name: 'Board',
        members: [
          {
            id: 'm2',
            targetGraphId: 'kg_acme',
            targetGraphName: 'Acme',
            targetOrgName: null,
          },
        ],
      })

    renderModal()

    await waitFor(() => expect(screen.getByText('Acme')).toBeInTheDocument())
    expect(screen.getAllByText('Acme')).toHaveLength(1)
    expect(screen.getByText(/via Investors, Board/)).toBeInTheDocument()
  })

  it('reports a deleted copy distinctly from one the recipient already removed', async () => {
    mockListPublishLists.mockResolvedValue([{ id: 'pl_1', name: 'Investors' }])
    mockGetPublishList.mockResolvedValue({
      id: 'pl_1',
      name: 'Investors',
      members: [
        {
          id: 'm1',
          targetGraphId: 'kg_acme',
          targetGraphName: 'Acme',
          targetOrgName: null,
        },
      ],
    })
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
    mockListPublishLists.mockResolvedValue([{ id: 'pl_1', name: 'Investors' }])
    mockGetPublishList.mockResolvedValue({
      id: 'pl_1',
      name: 'Investors',
      members: [
        {
          id: 'm1',
          targetGraphId: 'kg_acme',
          targetGraphName: 'Acme',
          targetOrgName: null,
        },
      ],
    })
    mockRevokeReportShare.mockResolvedValue({ copy_deleted: true })

    renderModal()
    await waitFor(() => expect(screen.getByText('Acme')).toBeInTheDocument())
    fireEvent.click(revokeButtons()[0])

    await waitFor(() =>
      expect(screen.getByText(/deleted from their books/)).toBeInTheDocument()
    )
  })

  it('explains the 404 when a listed recipient never actually received it', async () => {
    mockListPublishLists.mockResolvedValue([{ id: 'pl_1', name: 'Investors' }])
    mockGetPublishList.mockResolvedValue({
      id: 'pl_1',
      name: 'Investors',
      members: [
        {
          id: 'm1',
          targetGraphId: 'kg_late',
          targetGraphName: 'Added Later',
          targetOrgName: null,
        },
      ],
    })
    mockRevokeReportShare.mockRejectedValue(
      new Error(
        'Revoke report share failed: {"detail":"No active share of report \'rpt_1\' to \'kg_late\'."}'
      )
    )

    renderModal()
    await waitFor(() =>
      expect(screen.getByText('Added Later')).toBeInTheDocument()
    )
    fireEvent.click(revokeButtons()[0])

    await waitFor(() =>
      expect(
        screen.getByText(/never shared to that recipient/)
      ).toBeInTheDocument()
    )
  })

  it('revokes by manually entered graph ID — the removed-from-list escape hatch', async () => {
    mockRevokeReportShare.mockResolvedValue({ copy_deleted: true })
    renderModal()

    await waitFor(() =>
      expect(screen.getByLabelText('Revoke by graph ID')).toBeInTheDocument()
    )
    fireEvent.change(screen.getByLabelText('Revoke by graph ID'), {
      target: { value: '  kg_gone  ' },
    })
    fireEvent.click(revokeButtons()[0])

    // Trimmed before it reaches the API.
    await waitFor(() =>
      expect(mockRevokeReportShare).toHaveBeenCalledWith(
        'kg_mine',
        'rpt_1',
        'kg_gone'
      )
    )
  })
})
