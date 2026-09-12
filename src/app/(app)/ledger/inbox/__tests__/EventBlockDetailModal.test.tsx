import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetEventBlock = vi.fn()
const mockGetAccountTree = vi.fn()
const mockUpdateEventBlock = vi.fn()
const mockPreviewEventBlock = vi.fn()

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      getEventBlock: (...args: any[]) => mockGetEventBlock(...args),
      getAccountTree: (...args: any[]) => mockGetAccountTree(...args),
      updateEventBlock: (...args: any[]) => mockUpdateEventBlock(...args),
      previewEventBlock: (...args: any[]) => mockPreviewEventBlock(...args),
    },
  },
  LoadingState: () => <div>loading</div>,
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

vi.mock('flowbite-react', () => ({
  Alert: ({ children }: any) => <div role="alert">{children}</div>,
  Badge: ({ children }: any) => <span>{children}</span>,
  Button: ({ children, onClick, disabled, title }: any) => (
    <button onClick={onClick} disabled={disabled} title={title}>
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
  Select: ({ children, id, value, onChange, disabled }: any) => (
    <select id={id} value={value} onChange={onChange} disabled={disabled}>
      {children}
    </select>
  ),
}))

import EventBlockDetailModal, {
  flattenAccountTree,
} from '../EventBlockDetailModal'

const bankEvent = (overrides: Record<string, unknown> = {}) => ({
  id: 'evt_bank',
  eventType: 'bank_transaction',
  eventCategory: 'purchase',
  eventClass: 'economic',
  status: 'captured',
  occurredAt: '2026-03-14T15:04:05Z',
  effectiveAt: null,
  source: 'mercury',
  externalId: 'mercury_txn_1',
  amount: -4250,
  currency: 'USD',
  description: 'Staples (card)',
  agentId: null,
  resourceType: 'money',
  resourceElementId: 'elem_card',
  metadata: {
    connection_id: 'conn_1',
    suggested_element_id: 'elem_office',
    suggested_account_name: 'Office supplies & equipment',
    classification_source: 'gl_allocation',
  },
  ...overrides,
})

const tree = {
  totalAccounts: 4,
  roots: [
    {
      id: 'elem_card',
      code: '2110',
      name: 'Mercury IO',
      isActive: true,
      children: [],
    },
    {
      id: 'elem_expenses',
      code: '6000',
      name: 'Expenses',
      isActive: true,
      children: [
        {
          id: 'elem_office',
          code: '6100',
          name: 'Office supplies & equipment',
          isActive: true,
          children: [],
        },
        {
          id: 'elem_retired',
          code: '6900',
          name: 'Old account',
          isActive: false,
          children: [],
        },
      ],
    },
  ],
}

const renderModal = () =>
  render(
    <EventBlockDetailModal
      graphId="kg_test"
      eventId="evt_bank"
      agentById={{}}
      onClose={vi.fn()}
      onApproved={vi.fn()}
      onRejected={vi.fn()}
    />
  )

describe('flattenAccountTree', () => {
  it('walks children, drops retired accounts, and sorts by code', () => {
    const options = flattenAccountTree(tree.roots as any)
    expect(options.map((o) => o.id)).toEqual([
      'elem_card',
      'elem_expenses',
      'elem_office',
    ])
  })
})

describe('EventBlockDetailModal — bank-feed classification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetEventBlock.mockResolvedValue(bankEvent())
    mockGetAccountTree.mockResolvedValue(tree)
    mockUpdateEventBlock.mockResolvedValue({})
  })

  it('offers the chart, excludes the bank leg, and preselects the suggestion', async () => {
    renderModal()
    const select = (await screen.findByLabelText(
      'Post to account'
    )) as HTMLSelectElement
    await waitFor(() => expect(select.value).toBe('elem_office'))
    const ids = Array.from(select.options).map((o) => o.value)
    expect(ids).toEqual(['', 'elem_expenses', 'elem_office'])
    expect(screen.getByText(/Suggested: Office supplies/)).toBeInTheDocument()
    expect(screen.getByText(/from gl allocation/)).toBeInTheDocument()
  })

  it('approve carries the chosen account into the commit', async () => {
    renderModal()
    const select = await screen.findByLabelText('Post to account')
    await waitFor(() =>
      expect((select as HTMLSelectElement).value).toBe('elem_office')
    )
    fireEvent.change(select, { target: { value: 'elem_expenses' } })
    fireEvent.click(screen.getByText('Approve'))

    await waitFor(() => expect(mockUpdateEventBlock).toHaveBeenCalled())
    expect(mockUpdateEventBlock).toHaveBeenCalledWith('kg_test', {
      event_id: 'evt_bank',
      transition_to: 'committed',
      metadata_patch: {
        classified_element_id: 'elem_expenses',
        classified_by: 'user',
      },
    })
  })

  it('a suggestion no longer on the chart reads as unclassified', async () => {
    mockGetEventBlock.mockResolvedValue(
      bankEvent({
        metadata: {
          suggested_element_id: 'elem_retired',
          suggested_account_name: 'Old account',
        },
      })
    )
    renderModal()
    const select = (await screen.findByLabelText(
      'Post to account'
    )) as HTMLSelectElement
    await waitFor(() =>
      expect(Array.from(select.options).length).toBeGreaterThan(1)
    )
    expect(select.value).toBe('')
    fireEvent.click(screen.getByText('Approve'))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Choose the account'
    )
    expect(mockUpdateEventBlock).not.toHaveBeenCalled()
  })

  it('refuses to approve an unclassified line', async () => {
    mockGetEventBlock.mockResolvedValue(
      bankEvent({ metadata: { connection_id: 'conn_1' } })
    )
    renderModal()
    await screen.findByLabelText('Post to account')
    fireEvent.click(screen.getByText('Approve'))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Choose the account'
    )
    expect(mockUpdateEventBlock).not.toHaveBeenCalled()
  })

  it('classify records the choice without posting', async () => {
    renderModal()
    const select = await screen.findByLabelText('Post to account')
    await waitFor(() =>
      expect((select as HTMLSelectElement).value).toBe('elem_office')
    )
    fireEvent.click(screen.getByText('Classify'))

    await waitFor(() => expect(mockUpdateEventBlock).toHaveBeenCalled())
    expect(mockUpdateEventBlock).toHaveBeenCalledWith('kg_test', {
      event_id: 'evt_bank',
      transition_to: 'classified',
      metadata_patch: {
        classified_element_id: 'elem_office',
        classified_by: 'user',
      },
    })
  })

  it('a split set over MCP is shown, not overridden', async () => {
    mockGetEventBlock.mockResolvedValue(
      bankEvent({
        metadata: {
          classified_allocations: [
            { element_id: 'a', amount: 4000 },
            { element_id: 'b', amount: 250 },
          ],
        },
      })
    )
    renderModal()
    expect(
      await screen.findByText(/Split across 2 accounts/)
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('Post to account')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Approve'))
    await waitFor(() => expect(mockUpdateEventBlock).toHaveBeenCalled())
    expect(mockUpdateEventBlock.mock.calls[0][1]).toEqual({
      event_id: 'evt_bank',
      transition_to: 'committed',
    })
  })

  it('non-bank events keep the plain approve', async () => {
    mockGetEventBlock.mockResolvedValue(
      bankEvent({
        eventType: 'invoice_issued',
        source: 'quickbooks',
        metadata: {},
      })
    )
    renderModal()
    await screen.findByText('Approve')
    expect(screen.queryByText('Post to account')).not.toBeInTheDocument()
    expect(mockGetAccountTree).not.toHaveBeenCalled()
    fireEvent.click(screen.getByText('Approve'))
    await waitFor(() => expect(mockUpdateEventBlock).toHaveBeenCalled())
    expect(mockUpdateEventBlock.mock.calls[0][1]).toEqual({
      event_id: 'evt_bank',
      transition_to: 'committed',
    })
  })
})
