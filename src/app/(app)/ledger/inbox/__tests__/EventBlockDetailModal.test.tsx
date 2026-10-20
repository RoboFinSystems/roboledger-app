import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetEventBlock = vi.fn()
const mockGetAccountTree = vi.fn()
const mockGetFlowCandidates = vi.fn()
const mockUpdateEventBlock = vi.fn()
const mockPreviewEventBlock = vi.fn()
const mockGetDischargeCandidates = vi.fn()
const mockUploadDocumentFile = vi.fn()
const mockDocumentFileUrl = vi.fn()

vi.mock('@/lib/ledger/documents', () => ({
  DOCUMENT_FILE_ACCEPT: 'application/pdf,image/png,image/jpeg',
  isDocumentFileType: (type: string) =>
    ['application/pdf', 'image/png', 'image/jpeg'].includes(type),
  uploadDocumentFile: (...args: any[]) => mockUploadDocumentFile(...args),
  documentFileUrl: (...args: any[]) => mockDocumentFileUrl(...args),
}))

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      getEventBlock: (...args: any[]) => mockGetEventBlock(...args),
      getAccountTree: (...args: any[]) => mockGetAccountTree(...args),
      getFlowCandidates: (...args: any[]) => mockGetFlowCandidates(...args),
      updateEventBlock: (...args: any[]) => mockUpdateEventBlock(...args),
      previewEventBlock: (...args: any[]) => mockPreviewEventBlock(...args),
      getDischargeCandidates: (...args: any[]) =>
        mockGetDischargeCandidates(...args),
    },
  },
  LoadingState: () => <div>loading</div>,
}))

const mockScope = vi.fn(() => ({ entityId: null as string | null }))
vi.mock('@/lib/entity-scope', () => ({ useEntityScope: () => mockScope() }))

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
  Checkbox: ({ id, checked, onChange, disabled }: any) => (
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
    />
  ),
  FileInput: ({ id, onChange, accept, ...rest }: any) => (
    <input
      id={id}
      type="file"
      accept={accept}
      aria-label={rest['aria-label']}
      onChange={onChange}
    />
  ),
  HelperText: ({ children }: any) => <p>{children}</p>,
  Label: ({ children, htmlFor }: any) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
  Spinner: () => <span />,
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

import { flattenAccountTree } from '@/lib/ledger/accounts'
import EventBlockDetailModal from '../EventBlockDetailModal'

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
    suggestion_source: 'tier0',
  },
  ...overrides,
})

const flowRows = [
  {
    elementId: 'el_capex',
    qname: 'rs-gaap:PaymentsToAcquirePropertyPlantAndEquipment',
    name: 'Payments to Acquire Property, Plant, and Equipment',
    activity: 'investing',
  },
  {
    elementId: 'el_std',
    qname: 'rs-gaap:ProceedsFromShortTermDebt',
    name: 'Proceeds from Short-Term Debt',
    activity: 'financing',
  },
]

const staples = (
  classification: Record<string, unknown> | null,
  classifications: Record<string, unknown>[] = []
) => ({
  agt_staples: {
    id: 'agt_staples',
    agentType: 'vendor',
    name: 'Staples',
    isActive: true,
    classification,
    classifications,
  } as any,
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

const renderModal = (onClassified = vi.fn(), agentById: any = {}) =>
  render(
    <EventBlockDetailModal
      graphId="kg_test"
      eventId="evt_bank"
      agentById={agentById}
      onClose={vi.fn()}
      onApproved={vi.fn()}
      onRejected={vi.fn()}
      onClassified={onClassified}
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
    mockGetFlowCandidates.mockResolvedValue(flowRows)
    mockUpdateEventBlock.mockResolvedValue({})
    mockGetDischargeCandidates.mockResolvedValue(null)
  })

  it('approve carries the bill a person picked for the line to settle', async () => {
    mockGetDischargeCandidates.mockResolvedValue({
      eventId: 'evt_bank',
      kind: 'payables',
      amountCents: 4250,
      classifiedToControl: true,
      candidates: [
        {
          eventId: 'evt_bill',
          entityId: 'ent_parent',
          agentId: 'agt_staples',
          occurredOn: '2026-03-01',
          documentNumber: 'B-7',
          description: null,
          originalCents: 4250,
          settledCents: 0,
          openCents: 4250,
          currency: 'USD',
          dueDate: '2026-03-31',
          dueDateBasis: 'stated',
          daysPastDue: 0,
          bucket: 'current',
        },
      ],
    })
    renderModal()
    const select = await screen.findByLabelText('Post to account')
    await waitFor(() =>
      expect((select as HTMLSelectElement).value).toBe('elem_office')
    )
    fireEvent.click(await screen.findByLabelText(/B-7/))
    fireEvent.click(screen.getByText('Approve'))

    await waitFor(() => expect(mockUpdateEventBlock).toHaveBeenCalled())
    expect(mockUpdateEventBlock.mock.calls[0][1]).toMatchObject({
      transition_to: 'committed',
      discharge_allocations: [
        { obligation_event_id: 'evt_bill', amount: 4250 },
      ],
    })
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
    expect(screen.getByText('Bank category')).toBeInTheDocument()
    // The bank's category is nobody's default: nothing to remember yet
    // without a counterparty.
    expect(screen.queryByLabelText(/Remember for/)).not.toBeInTheDocument()
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

  it('offers a retry when a sync holds the event, and retries the approve', async () => {
    mockGetEventBlock.mockResolvedValue(
      bankEvent({
        eventType: 'invoice_issued',
        source: 'quickbooks',
        metadata: {},
      })
    )
    mockUpdateEventBlock
      .mockRejectedValueOnce(
        new Error(
          'Update event block failed: {"detail":"Event evt_bank is being written by another process (most likely a running sync). Retry in a moment."}'
        )
      )
      .mockResolvedValueOnce({})
    renderModal()
    fireEvent.click(await screen.findByText('Approve'))

    fireEvent.click(await screen.findByText('Try again'))
    await waitFor(() => expect(mockUpdateEventBlock).toHaveBeenCalledTimes(2))
    expect(mockUpdateEventBlock.mock.calls[1][1]).toEqual({
      event_id: 'evt_bank',
      transition_to: 'committed',
    })
    await waitFor(() =>
      expect(screen.queryByText('Try again')).not.toBeInTheDocument()
    )
  })

  it('offers no retry for a refusal', async () => {
    mockGetEventBlock.mockResolvedValue(
      bankEvent({
        eventType: 'invoice_issued',
        source: 'quickbooks',
        metadata: {},
      })
    )
    mockUpdateEventBlock.mockRejectedValueOnce(
      new Error('Update event block failed: {"detail":"Event not found"}')
    )
    renderModal()
    fireEvent.click(await screen.findByText('Approve'))
    await screen.findByText(/Event not found/)
    expect(screen.queryByText('Try again')).not.toBeInTheDocument()
  })

  it('tells the list when classify moves the event out of captured', async () => {
    const onClassified = vi.fn()
    renderModal(onClassified)
    const select = await screen.findByLabelText('Post to account')
    await waitFor(() =>
      expect((select as HTMLSelectElement).value).toBe('elem_office')
    )
    fireEvent.click(screen.getByText('Classify'))
    await waitFor(() => expect(onClassified).toHaveBeenCalledWith('evt_bank'))
  })

  it.each(['committed', 'pending'])(
    'offers no Approve on a %s event, which the server cannot commit',
    async (status) => {
      mockGetEventBlock.mockResolvedValue(
        bankEvent({ eventType: 'invoice_issued', status, metadata: {} })
      )
      renderModal()
      await screen.findByText('Reject')
      expect(screen.queryByText('Approve')).not.toBeInTheDocument()
    }
  )

  it('shows the lines of a flat manual journal entry', async () => {
    mockGetEventBlock.mockResolvedValue(
      bankEvent({
        eventType: 'journal_entry_recorded',
        source: 'manual',
        metadata: {
          posting_date: '2026-03-31',
          memo: 'Accrue March rent',
          line_items: [
            { element_name: 'Rent Expense', debit_amount: 150000 },
            { element_name: 'Accrued Liabilities', credit_amount: 150000 },
          ],
        },
      })
    )
    renderModal()
    expect(await screen.findByText('Accrue March rent')).toBeInTheDocument()
    expect(screen.getByText('Rent Expense')).toBeInTheDocument()
    expect(
      screen.queryByText('No journal entries in metadata.')
    ).not.toBeInTheDocument()
  })
})

describe('EventBlockDetailModal — learned suggestions', () => {
  const learned = {
    suggested_element_id: 'elem_office',
    suggested_account_name: 'Office supplies & equipment',
    suggestion_source: 'agent_default',
    suggestion_basis:
      'Staples, classified to Office supplies & equipment on 3 of 3 committed lines.',
  }
  const stapleDefault = {
    elementId: 'elem_office',
    accountName: 'Office supplies & equipment',
    mode: 'suggest',
    confirmations: 3,
    overrides: 0,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAccountTree.mockResolvedValue(tree)
    mockGetFlowCandidates.mockResolvedValue(flowRows)
    mockUpdateEventBlock.mockResolvedValue({})
  })

  it('shows where a learned suggestion came from, and why', async () => {
    mockGetEventBlock.mockResolvedValue(
      bankEvent({ agentId: 'agt_staples', metadata: learned })
    )
    renderModal(vi.fn(), staples(stapleDefault))
    await screen.findByLabelText('Post to account')
    expect(screen.getByText('Learned')).toBeInTheDocument()
    expect(screen.getByText(/on 3 of 3 committed lines/)).toBeInTheDocument()
  })

  it('taking the default is a confirmation: nothing to remember', async () => {
    mockGetEventBlock.mockResolvedValue(
      bankEvent({ agentId: 'agt_staples', metadata: learned })
    )
    renderModal(vi.fn(), staples(stapleDefault))
    const select = await screen.findByLabelText('Post to account')
    await waitFor(() =>
      expect((select as HTMLSelectElement).value).toBe('elem_office')
    )
    expect(screen.queryByLabelText(/Remember for/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Approve'))
    await waitFor(() => expect(mockUpdateEventBlock).toHaveBeenCalled())
    expect(mockUpdateEventBlock.mock.calls[0][1].metadata_patch).toEqual({
      classified_element_id: 'elem_office',
      classified_by: 'user',
    })
  })

  it('overriding a default offers Remember, off unless asked', async () => {
    mockGetEventBlock.mockResolvedValue(
      bankEvent({ agentId: 'agt_staples', metadata: learned })
    )
    renderModal(vi.fn(), staples(stapleDefault))
    const select = await screen.findByLabelText('Post to account')
    await waitFor(() =>
      expect((select as HTMLSelectElement).value).toBe('elem_office')
    )
    fireEvent.change(select, { target: { value: 'elem_expenses' } })
    const remember = screen.getByLabelText(
      /Remember for Staples/
    ) as HTMLInputElement
    expect(remember.checked).toBe(false)
    expect(screen.getByText(/Make Expenses the default/)).toBeInTheDocument()

    fireEvent.click(screen.getByText('Approve'))
    await waitFor(() => expect(mockUpdateEventBlock).toHaveBeenCalled())
    expect(mockUpdateEventBlock.mock.calls[0][1].metadata_patch).toEqual({
      classified_element_id: 'elem_expenses',
      classified_by: 'user',
      remember_classification: false,
    })

    fireEvent.click(remember)
    fireEvent.click(screen.getByText('Approve'))
    await waitFor(() => expect(mockUpdateEventBlock).toHaveBeenCalledTimes(2))
    expect(
      mockUpdateEventBlock.mock.calls[1][1].metadata_patch
        .remember_classification
    ).toBe(true)
  })

  it("the line's own learned suggestion outranks a stale agent list", async () => {
    // The list was loaded before the default was taught; the line was
    // re-suggested since, so it knows better.
    mockGetEventBlock.mockResolvedValue(
      bankEvent({ agentId: 'agt_staples', metadata: learned })
    )
    renderModal(vi.fn(), staples(null))
    const select = await screen.findByLabelText('Post to account')
    await waitFor(() =>
      expect((select as HTMLSelectElement).value).toBe('elem_office')
    )
    expect(screen.queryByLabelText(/Remember for/)).not.toBeInTheDocument()
    fireEvent.change(select, { target: { value: 'elem_expenses' } })
    const remember = screen.getByLabelText(
      /Remember for Staples/
    ) as HTMLInputElement
    expect(remember.checked).toBe(false)
    expect(
      screen.getByText(
        /Make Expenses the default instead of Office supplies & equipment/
      )
    ).toBeInTheDocument()
  })

  it('a counterparty with no default is taught unless unticked', async () => {
    mockGetEventBlock.mockResolvedValue(bankEvent({ agentId: 'agt_staples' }))
    renderModal(vi.fn(), staples(null))
    const select = await screen.findByLabelText('Post to account')
    await waitFor(() =>
      expect((select as HTMLSelectElement).value).toBe('elem_office')
    )
    const remember = screen.getByLabelText(
      /Remember for Staples/
    ) as HTMLInputElement
    expect(remember.checked).toBe(true)
    expect(
      screen.getByText(/Suggest Office supplies & equipment on Staples/)
    ).toBeInTheDocument()

    fireEvent.click(remember)
    fireEvent.click(screen.getByText('Approve'))
    await waitFor(() => expect(mockUpdateEventBlock).toHaveBeenCalled())
    expect(
      mockUpdateEventBlock.mock.calls[0][1].metadata_patch
        .remember_classification
    ).toBe(false)
  })
})

describe('EventBlockDetailModal — the flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAccountTree.mockResolvedValue(tree)
    mockGetFlowCandidates.mockResolvedValue(flowRows)
    mockUpdateEventBlock.mockResolvedValue({})
  })

  it("offers the statement's rows by section and keeps the default unless chosen", async () => {
    mockGetEventBlock.mockResolvedValue(bankEvent())
    renderModal()
    const picker = (await screen.findByLabelText(
      'Cash flow row'
    )) as HTMLSelectElement
    await waitFor(() => expect(mockGetFlowCandidates).toHaveBeenCalled())
    expect(mockGetFlowCandidates).toHaveBeenCalledWith('kg_test', {
      entityId: null,
    })
    await waitFor(() =>
      expect(Array.from(picker.options).map((o) => o.value)).toEqual([
        '',
        'rs-gaap:PaymentsToAcquirePropertyPlantAndEquipment',
        'rs-gaap:ProceedsFromShortTermDebt',
      ])
    )
    expect(picker.value).toBe('')
    expect(
      Array.from(picker.querySelectorAll('optgroup')).map((g) => g.label)
    ).toEqual(['Investing', 'Financing'])

    fireEvent.click(screen.getByText('Approve'))
    await waitFor(() => expect(mockUpdateEventBlock).toHaveBeenCalled())
    expect(mockUpdateEventBlock.mock.calls[0][1].metadata_patch).toEqual({
      classified_element_id: 'elem_office',
      classified_by: 'user',
    })
  })

  it('a chosen row rides the commit as the flow', async () => {
    mockGetEventBlock.mockResolvedValue(bankEvent())
    renderModal()
    const picker = await screen.findByLabelText('Cash flow row')
    await waitFor(() =>
      expect((picker as HTMLSelectElement).options.length).toBe(3)
    )
    fireEvent.change(picker, {
      target: { value: 'rs-gaap:ProceedsFromShortTermDebt' },
    })
    fireEvent.click(screen.getByText('Approve'))
    await waitFor(() => expect(mockUpdateEventBlock).toHaveBeenCalled())
    expect(mockUpdateEventBlock.mock.calls[0][1].metadata_patch).toEqual({
      classified_element_id: 'elem_office',
      classified_by: 'user',
      classified_flow_qname: 'rs-gaap:ProceedsFromShortTermDebt',
    })
  })

  it('a posted line keeps its account and moves only its flow', async () => {
    mockGetEventBlock.mockResolvedValue(
      bankEvent({
        status: 'committed',
        metadata: {
          classified_element_id: 'elem_office',
          classified_flow_qname: 'rs-gaap:ProceedsFromShortTermDebt',
        },
      })
    )
    renderModal()
    const picker = (await screen.findByLabelText(
      'Cash flow row'
    )) as HTMLSelectElement
    expect(screen.queryByLabelText('Post to account')).not.toBeInTheDocument()
    await waitFor(() => expect(picker.options.length).toBe(3))
    expect(picker.value).toBe('rs-gaap:ProceedsFromShortTermDebt')
    const save = screen.getByText('Save flow') as HTMLButtonElement
    expect(save.disabled).toBe(true)

    fireEvent.change(picker, { target: { value: '' } })
    fireEvent.click(save)
    await waitFor(() => expect(mockUpdateEventBlock).toHaveBeenCalled())
    expect(mockUpdateEventBlock).toHaveBeenCalledWith('kg_test', {
      event_id: 'evt_bank',
      metadata_patch: { classified_flow_qname: null },
    })
    await waitFor(() => expect(mockGetEventBlock).toHaveBeenCalledTimes(2))
  })

  it('when the rows cannot load, the current tag is kept and said so', async () => {
    mockGetFlowCandidates.mockRejectedValue(new Error('Flow candidates failed'))
    mockGetEventBlock.mockResolvedValue(
      bankEvent({
        metadata: {
          classified_element_id: 'elem_office',
          classified_flow_qname: 'rs-gaap:ProceedsFromShortTermDebt',
        },
      })
    )
    renderModal()
    const picker = (await screen.findByLabelText(
      'Cash flow row'
    )) as HTMLSelectElement
    await waitFor(() => expect(picker.disabled).toBe(false))
    expect(picker.value).toBe('rs-gaap:ProceedsFromShortTermDebt')
    expect(screen.queryByText(/not a row of this statement/)).toBeNull()
    expect(screen.getByText(/rows could not be loaded/)).toBeInTheDocument()
  })

  it('a tag the statement no longer presents stays visible as such', async () => {
    mockGetEventBlock.mockResolvedValue(
      bankEvent({
        metadata: {
          classified_element_id: 'elem_office',
          classified_flow_qname: 'rs-gaap:PaymentsOfDividends',
        },
      })
    )
    renderModal()
    const picker = (await screen.findByLabelText(
      'Cash flow row'
    )) as HTMLSelectElement
    await waitFor(() => expect(picker.options.length).toBe(4))
    expect(picker.value).toBe('rs-gaap:PaymentsOfDividends')
    expect(
      screen.getByText(/PaymentsOfDividends \(not a row of this statement\)/)
    ).toBeInTheDocument()
  })
})

describe('EventBlockDetailModal — a subsidiary in scope', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockScope.mockReturnValue({ entityId: 'ent_sub' })
    mockGetEventBlock.mockResolvedValue(bankEvent())
    mockGetAccountTree.mockResolvedValue(tree)
    mockPreviewEventBlock.mockResolvedValue({ wouldSucceed: true })
  })

  afterEach(() => {
    mockScope.mockReturnValue({ entityId: null })
  })

  it("does not take the parent's default for the subsidiary's", async () => {
    mockGetEventBlock.mockResolvedValue(bankEvent({ agentId: 'agt_staples' }))
    renderModal(
      vi.fn(),
      staples({ elementId: 'elem_expenses', accountName: 'Expenses' })
    )
    const select = await screen.findByLabelText('Post to account')
    await waitFor(() =>
      expect((select as HTMLSelectElement).value).toBe('elem_office')
    )
    // The subsidiary has no default of its own, so this line teaches one.
    const remember = screen.getByLabelText(
      /Remember for Staples/
    ) as HTMLInputElement
    expect(remember.checked).toBe(true)
    expect(
      screen.getByText(/Suggest Office supplies & equipment on Staples/)
    ).toBeInTheDocument()
  })

  it("reads the subsidiary's own default", async () => {
    mockGetEventBlock.mockResolvedValue(bankEvent({ agentId: 'agt_staples' }))
    renderModal(
      vi.fn(),
      staples({ elementId: 'elem_office', accountName: 'Office' }, [
        {
          entityId: 'ent_sub',
          elementId: 'elem_expenses',
          accountName: 'Expenses',
        },
      ])
    )
    const select = await screen.findByLabelText('Post to account')
    await waitFor(() =>
      expect((select as HTMLSelectElement).value).toBe('elem_office')
    )
    expect(
      screen.getByText(
        /Make Office supplies & equipment the default instead of Expenses/
      )
    ).toBeInTheDocument()
  })

  it("offers the subsidiary's chart, so the line's suggestion survives", async () => {
    renderModal()
    await waitFor(() =>
      expect(mockGetAccountTree).toHaveBeenCalledWith('kg_test', {
        entityId: 'ent_sub',
      })
    )
  })

  it('previews the line in its own entity', async () => {
    renderModal()
    fireEvent.click(await screen.findByRole('button', { name: /Preview/ }))
    await waitFor(() => expect(mockPreviewEventBlock).toHaveBeenCalledTimes(1))
    expect(mockPreviewEventBlock.mock.calls[0][1].entity_id).toBe('ent_sub')
  })
})

describe('EventBlockDetailModal — the document behind an event', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAccountTree.mockResolvedValue(tree)
    mockUpdateEventBlock.mockResolvedValue({})
  })

  it('uploads a receipt and points the event at it', async () => {
    mockGetEventBlock
      .mockResolvedValueOnce(bankEvent({ documentId: null }))
      .mockResolvedValue(bankEvent({ documentId: 'doc_receipt' }))
    mockUploadDocumentFile.mockResolvedValue('doc_receipt')
    renderModal()

    const receipt = new File(['jpeg'], 'staples.jpg', { type: 'image/jpeg' })
    fireEvent.change(await screen.findByLabelText('Attach a document'), {
      target: { files: [receipt] },
    })
    fireEvent.click(screen.getByText('Attach'))

    await waitFor(() =>
      expect(mockUpdateEventBlock).toHaveBeenCalledWith('kg_test', {
        event_id: 'evt_bank',
        document_id: 'doc_receipt',
      })
    )
    expect(mockUploadDocumentFile).toHaveBeenCalledWith('kg_test', receipt, {
      title: 'Staples (card)',
    })
    expect(await screen.findByText('Download')).toBeInTheDocument()
  })

  it('downloads the attached document and can detach it', async () => {
    mockGetEventBlock.mockResolvedValue(
      bankEvent({ status: 'committed', documentId: 'doc_receipt' })
    )
    mockDocumentFileUrl.mockResolvedValue('https://files.example/r.jpg')
    const assign = vi.fn()
    const location = window.location
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...location, assign },
    })
    renderModal()

    fireEvent.click(await screen.findByText('Download'))
    await waitFor(() =>
      expect(assign).toHaveBeenCalledWith('https://files.example/r.jpg')
    )

    fireEvent.click(screen.getByText('Detach'))
    await waitFor(() =>
      expect(mockUpdateEventBlock).toHaveBeenCalledWith('kg_test', {
        event_id: 'evt_bank',
        document_id: '',
      })
    )
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: location,
    })
  })

  it('offers nothing to attach on a voided event', async () => {
    mockGetEventBlock.mockResolvedValue(
      bankEvent({ status: 'voided', documentId: null })
    )
    renderModal()
    await screen.findByText('Staples (card)')
    expect(screen.queryByLabelText('Attach a document')).not.toBeInTheDocument()
  })
})
