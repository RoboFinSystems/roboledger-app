import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListEventHandlers = vi.fn()
const mockUpdateEventHandler = vi.fn()

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      listEventHandlers: (...args: any[]) => mockListEventHandlers(...args),
      updateEventHandler: (...args: any[]) => mockUpdateEventHandler(...args),
    },
  },
  EmptyState: ({ title, description }: any) => (
    <div data-testid="empty-state">
      <h3>{title}</h3>
      {description}
    </div>
  ),
  LoadingState: () => <div role="status" />,
  PageHeader: ({ title }: any) => <h1>{title}</h1>,
  PageLayout: ({ children }: any) => <div>{children}</div>,
}))

vi.mock('@/lib/useLedgerGraph', () => ({
  useLedgerGraph: () => ({ graph: { graphId: 'kg1' } }),
}))

vi.mock('flowbite-react', () => ({
  Alert: ({ children }: any) => <div role="alert">{children}</div>,
  Badge: ({ children }: any) => <span data-testid="badge">{children}</span>,
  Button: ({ children, onClick, disabled, role, ...rest }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      role={role}
      aria-selected={rest['aria-selected']}
    >
      {children}
    </button>
  ),
  Card: ({ children }: any) => <div>{children}</div>,
  Label: ({ children, htmlFor }: any) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
  Modal: ({ children }: any) => <div>{children}</div>,
  ModalBody: ({ children }: any) => <div>{children}</div>,
  ModalFooter: ({ children }: any) => <div>{children}</div>,
  ModalHeader: ({ children }: any) => <h2>{children}</h2>,
  Table: ({ children }: any) => <table>{children}</table>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableCell: ({ children }: any) => <td>{children}</td>,
  TableHead: ({ children }: any) => <thead>{children}</thead>,
  TableHeadCell: ({ children }: any) => <th>{children}</th>,
  TableRow: ({ children }: any) => <tr>{children}</tr>,
  Textarea: (props: any) => <textarea {...props} />,
  TextInput: ({ sizing: _s, color: _c, ...props }: any) => <input {...props} />,
}))

import PostingRulesContent, { describeMatch } from '../content'

const handler = (overrides: Record<string, unknown> = {}) => ({
  id: 'hdl_ai',
  name: 'Stripe payouts',
  description: null,
  eventType: 'bank_transaction',
  eventCategory: null,
  matchSource: 'stripe',
  matchAgentType: null,
  matchResourceType: null,
  matchMetadataExpression: { payout: true },
  transactionTemplate: { transactions: [] },
  priority: 10,
  isActive: true,
  origin: 'tenant',
  suggestedBy: 'ai',
  confidence: null,
  approvedBy: null,
  approvedAt: null,
  awaitingApproval: true,
  createdAt: null,
  updatedAt: '2026-10-24T12:00:00.000Z',
  createdBy: 'usr_1',
  ...overrides,
})

const PERSON = handler({
  id: 'hdl_person',
  name: 'Rent',
  suggestedBy: null,
  awaitingApproval: false,
  matchSource: null,
  matchMetadataExpression: null,
})

describe('describeMatch', () => {
  it('reads the event type and every set match field', () => {
    expect(describeMatch(handler() as any)).toBe(
      'bank_transaction · source stripe · payout = true'
    )
    expect(describeMatch(PERSON as any)).toBe('bank_transaction')
  })
})

describe('PostingRulesContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListEventHandlers.mockImplementation((_g: string, opts?: any) =>
      Promise.resolve(
        opts?.awaitingApproval ? [handler()] : [handler(), PERSON]
      )
    )
    mockUpdateEventHandler.mockResolvedValue({})
  })

  it('opens on what waits for a person', async () => {
    render(<PostingRulesContent />)
    expect(await screen.findByText('Stripe payouts')).toBeInTheDocument()
    expect(screen.queryByText('Rent')).toBeNull()
    expect(
      screen.getByRole('tab', { name: 'Waiting for approval (1)' })
    ).toBeInTheDocument()
    expect(screen.getByText('Waiting for approval')).toBeInTheDocument()
    expect(screen.getByText(/Proposed by an AI client/)).toBeInTheDocument()
  })

  it('approves a proposed rule', async () => {
    render(<PostingRulesContent />)
    fireEvent.click(await screen.findByRole('button', { name: 'Approve' }))
    await waitFor(() =>
      expect(mockUpdateEventHandler).toHaveBeenCalledWith('kg1', {
        event_handler_id: 'hdl_ai',
        approve: true,
        // The version the person reviewed travels with the approval.
        expected_updated_at: '2026-10-24T12:00:00.000Z',
      })
    )
    // Read again so the queue reflects it.
    await waitFor(() => expect(mockListEventHandlers).toHaveBeenCalledTimes(4))
  })

  it('lists every rule, and deactivates one', async () => {
    render(<PostingRulesContent />)
    await screen.findByText('Stripe payouts')
    fireEvent.click(screen.getByRole('tab', { name: 'All rules' }))
    expect(await screen.findByText('Rent')).toBeInTheDocument()
    expect(screen.getByText('Live')).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: 'Deactivate' })[1])
    await waitFor(() =>
      expect(mockUpdateEventHandler).toHaveBeenCalledWith('kg1', {
        event_handler_id: 'hdl_person',
        is_active: false,
      })
    )
  })

  it('reviews a proposal and saves only what changed, approving it', async () => {
    render(<PostingRulesContent />)
    fireEvent.click(await screen.findByRole('button', { name: 'Review' }))
    expect(
      screen.getByText(/It books nothing until you approve it/)
    ).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Priority'), {
      target: { value: '20' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save and approve' }))
    await waitFor(() =>
      expect(mockUpdateEventHandler).toHaveBeenCalledWith('kg1', {
        event_handler_id: 'hdl_ai',
        priority: 20,
        approve: true,
        expected_updated_at: '2026-10-24T12:00:00.000Z',
      })
    )
  })

  it('refuses a template that is not JSON', async () => {
    render(<PostingRulesContent />)
    fireEvent.click(await screen.findByRole('button', { name: 'Review' }))
    fireEvent.change(screen.getByLabelText('What it books'), {
      target: { value: '{ not json' },
    })
    expect(
      screen.getByText('The template is not valid JSON.')
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Save and approve' })
    ).toBeDisabled()
  })

  it('leaves a platform rule read-only', async () => {
    mockListEventHandlers.mockImplementation((_g: string, opts?: any) =>
      Promise.resolve(
        opts?.awaitingApproval
          ? []
          : [
              handler({
                id: 'hdl_hub',
                origin: 'hub',
                suggestedBy: null,
                awaitingApproval: false,
              }),
            ]
      )
    )
    render(<PostingRulesContent />)
    expect(await screen.findByText('Nothing waiting')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'All rules' }))
    expect(await screen.findByText('Platform rule')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Deactivate' })).toBeNull()
  })

  it('shows why a change was refused', async () => {
    mockUpdateEventHandler.mockRejectedValue(
      new Error(
        'Update event handler failed: {"detail":"Template invalid: no debit leg."}'
      )
    )
    render(<PostingRulesContent />)
    fireEvent.click(await screen.findByRole('button', { name: 'Approve' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/no debit leg/)
  })
})
