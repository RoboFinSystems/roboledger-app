import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetAgent = vi.fn()
const mockListEventBlocks = vi.fn()
const mockGetAccountTree = vi.fn()
const mockUpdateAgent = vi.fn()

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      getAgent: (...args: any[]) => mockGetAgent(...args),
      listEventBlocks: (...args: any[]) => mockListEventBlocks(...args),
      getAccountTree: (...args: any[]) => mockGetAccountTree(...args),
      updateAgent: (...args: any[]) => mockUpdateAgent(...args),
    },
  },
  LoadingState: () => <div>loading</div>,
}))

const mockScope = vi.fn(() => ({ entityId: null as string | null }))
vi.mock('@/lib/entity-scope', () => ({ useEntityScope: () => mockScope() }))

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

vi.mock('@robosystems/core/ui', () => ({
  Alert: ({ children }: any) => <div role="alert">{children}</div>,
  Badge: ({ children }: any) => <span>{children}</span>,
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
  Modal: ({ children }: any) => <div>{children}</div>,
  ModalBody: ({ children }: any) => <div>{children}</div>,
  ModalFooter: ({ children }: any) => <div>{children}</div>,
  ModalHeader: ({ children }: any) => <div>{children}</div>,
  Select: ({ children, id, value, onChange, disabled }: any) => (
    <select id={id} value={value} onChange={onChange} disabled={disabled}>
      {children}
    </select>
  ),
  Table: ({ children }: any) => <table>{children}</table>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableCell: ({ children }: any) => <td>{children}</td>,
  TableHead: ({ children }: any) => <thead>{children}</thead>,
  TableHeadCell: ({ children }: any) => <th>{children}</th>,
  TableRow: ({ children }: any) => <tr>{children}</tr>,
  TextInput: ({ sizing: _sizing, ...props }: any) => <input {...props} />,
}))

import AgentDetailModal, { maskTaxId } from '../AgentDetailModal'

const agent = (classification: Record<string, unknown> | null) => ({
  id: 'agt_staples',
  agentType: 'vendor',
  name: 'Staples',
  legalName: null,
  taxId: null,
  email: null,
  phone: null,
  address: null,
  source: 'plaid',
  externalId: null,
  isActive: true,
  is1099Recipient: false,
  classification,
  classifications: classification
    ? [{ entityId: 'ent_parent', ...classification }]
    : [],
})

const learned = {
  elementId: 'elem_office',
  accountName: 'Office supplies & equipment',
  mode: 'suggest',
  confirmations: 3,
  overrides: 1,
  setBy: 'usr_1',
  setAt: '2026-10-11T12:00:00Z',
  learnedFrom: 'evt_1',
}

const tree = {
  totalAccounts: 2,
  roots: [
    {
      id: 'elem_office',
      code: '6100',
      name: 'Office supplies & equipment',
      isActive: true,
      children: [],
    },
    {
      id: 'elem_software',
      code: '6200',
      name: 'Software',
      isActive: true,
      children: [],
    },
  ],
}

const renderModal = () =>
  render(
    <AgentDetailModal
      graphId="kg_test"
      agentId="agt_staples"
      onClose={vi.fn()}
    />
  )

describe('AgentDetailModal — the default account', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockScope.mockReturnValue({ entityId: null })
    mockListEventBlocks.mockResolvedValue([])
    mockGetAccountTree.mockResolvedValue(tree)
    mockUpdateAgent.mockResolvedValue({})
  })

  it('shows the learned default and how often it held', async () => {
    mockGetAgent.mockResolvedValue(agent(learned))
    renderModal()
    const select = (await screen.findByLabelText(
      'Default account'
    )) as HTMLSelectElement
    await waitFor(() => expect(select.value).toBe('elem_office'))
    expect(
      screen.getByText(/Held on 3 of 4 committed lines/)
    ).toBeInTheDocument()
    expect(mockGetAccountTree).toHaveBeenCalledWith('kg_test', {
      entityId: null,
    })
    const save = screen.getByText('Save default') as HTMLButtonElement
    expect(save.disabled).toBe(true)
  })

  it("a subsidiary in scope sees and sets its own default, not the parent's", async () => {
    mockScope.mockReturnValue({ entityId: 'ent_sub' })
    const withSub = (sub: Record<string, unknown> | null) => ({
      ...agent(learned),
      classifications: [
        { entityId: 'ent_parent', ...learned },
        ...(sub ? [{ entityId: 'ent_sub', ...sub }] : []),
      ],
    })
    mockGetAgent.mockResolvedValueOnce(withSub(null)).mockResolvedValueOnce(
      withSub({
        ...learned,
        elementId: 'elem_software',
        confirmations: 0,
        overrides: 0,
      })
    )
    renderModal()
    const select = (await screen.findByLabelText(
      'Default account'
    )) as HTMLSelectElement
    await waitFor(() => expect(select.options.length).toBe(3))
    expect(select.value).toBe('')
    expect(screen.getByText(/None yet/)).toBeInTheDocument()
    expect(mockGetAccountTree).toHaveBeenCalledWith('kg_test', {
      entityId: 'ent_sub',
    })

    fireEvent.change(select, { target: { value: 'elem_software' } })
    fireEvent.click(screen.getByText('Save default'))
    await waitFor(() =>
      expect(mockUpdateAgent).toHaveBeenCalledWith('kg_test', {
        agent_id: 'agt_staples',
        classification_entity_id: 'ent_sub',
        classification_element_id: 'elem_software',
        classification_mode: 'suggest',
      })
    )
    await waitFor(() => expect(select.value).toBe('elem_software'))
  })

  it('choosing an account sets it, in suggest mode, and reloads', async () => {
    mockGetAgent.mockResolvedValueOnce(agent(null)).mockResolvedValueOnce(
      agent({
        ...learned,
        elementId: 'elem_software',
        confirmations: 0,
        overrides: 0,
      })
    )
    renderModal()
    const select = await screen.findByLabelText('Default account')
    expect(screen.getByText(/None yet/)).toBeInTheDocument()
    await waitFor(() =>
      expect((select as HTMLSelectElement).options.length).toBe(3)
    )
    fireEvent.change(select, { target: { value: 'elem_software' } })
    fireEvent.click(screen.getByText('Save default'))
    await waitFor(() => expect(mockUpdateAgent).toHaveBeenCalled())
    expect(mockUpdateAgent).toHaveBeenCalledWith('kg_test', {
      agent_id: 'agt_staples',
      classification_element_id: 'elem_software',
      classification_mode: 'suggest',
    })
    await waitFor(() => expect(mockGetAgent).toHaveBeenCalledTimes(2))
    expect(await screen.findByText(/Set by hand/)).toBeInTheDocument()
  })

  it('always ask keeps the account without offering it', async () => {
    mockGetAgent.mockResolvedValue(agent(learned))
    renderModal()
    const alwaysAsk = (await screen.findByLabelText(
      /Always ask/
    )) as HTMLInputElement
    expect(alwaysAsk.checked).toBe(false)
    fireEvent.click(alwaysAsk)
    fireEvent.click(screen.getByText('Save default'))
    await waitFor(() => expect(mockUpdateAgent).toHaveBeenCalled())
    expect(mockUpdateAgent.mock.calls[0][1]).toEqual({
      agent_id: 'agt_staples',
      classification_element_id: 'elem_office',
      classification_mode: 'always_ask',
    })
  })

  it('no default clears it', async () => {
    mockGetAgent.mockResolvedValue(agent(learned))
    renderModal()
    const select = await screen.findByLabelText('Default account')
    await waitFor(() =>
      expect((select as HTMLSelectElement).value).toBe('elem_office')
    )
    fireEvent.change(select, { target: { value: '' } })
    fireEvent.click(screen.getByText('Save default'))
    await waitFor(() => expect(mockUpdateAgent).toHaveBeenCalled())
    expect(mockUpdateAgent.mock.calls[0][1]).toEqual({
      agent_id: 'agt_staples',
      classification_element_id: '',
    })
  })

  it('always ask without an account is not a change', async () => {
    mockGetAgent.mockResolvedValue(agent(null))
    renderModal()
    const select = await screen.findByLabelText('Default account')
    await waitFor(() =>
      expect((select as HTMLSelectElement).options.length).toBe(3)
    )
    fireEvent.change(select, { target: { value: 'elem_software' } })
    fireEvent.click(screen.getByLabelText(/Always ask/))
    fireEvent.change(select, { target: { value: '' } })
    const save = screen.getByText('Save default') as HTMLButtonElement
    expect(save.disabled).toBe(true)
    expect(
      (screen.getByLabelText(/Always ask/) as HTMLInputElement).checked
    ).toBe(false)
  })

  it('a chart that fails to load does not retire the default', async () => {
    mockGetAgent.mockResolvedValue(agent(learned))
    mockGetAccountTree.mockRejectedValue(new Error('Account tree failed'))
    renderModal()
    const select = (await screen.findByLabelText(
      'Default account'
    )) as HTMLSelectElement
    await waitFor(() => expect(select.disabled).toBe(false))
    expect(select.value).toBe('elem_office')
    expect(screen.queryByText(/not on this chart/)).toBeNull()
    expect(screen.getByText('Office supplies & equipment')).toBeInTheDocument()
  })

  it('a refusal is shown, and the choice kept', async () => {
    mockGetAgent.mockResolvedValue(agent(null))
    mockUpdateAgent.mockRejectedValueOnce(
      new Error(
        'Update agent failed: {"detail":"\'elem_software\' is not an active account that can be posted to."}'
      )
    )
    renderModal()
    const select = await screen.findByLabelText('Default account')
    await waitFor(() =>
      expect((select as HTMLSelectElement).options.length).toBe(3)
    )
    fireEvent.change(select, { target: { value: 'elem_software' } })
    fireEvent.click(screen.getByText('Save default'))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'not an active account'
    )
    expect((select as HTMLSelectElement).value).toBe('elem_software')
  })
})

describe('AgentDetailModal — tax reporting', () => {
  const withTax = (overrides: Record<string, unknown>) => ({
    ...agent(null),
    ...overrides,
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockScope.mockReturnValue({ entityId: null })
    mockListEventBlocks.mockResolvedValue([])
    mockGetAccountTree.mockResolvedValue(tree)
    mockUpdateAgent.mockResolvedValue({})
  })

  it('masks a saved tax ID to its last four', () => {
    expect(maskTaxId('12-3456789')).toBe('••••6789')
    expect(maskTaxId('123-45-6789')).toBe('••••6789')
  })

  it('adds a tax ID and the 1099 flag, sending only what changed', async () => {
    mockGetAgent
      .mockResolvedValueOnce(agent(null))
      .mockResolvedValueOnce(
        withTax({ taxId: '12-3456789', is1099Recipient: true })
      )
    renderModal()
    fireEvent.click(await screen.findByText('Add'))
    fireEvent.change(screen.getByLabelText('Tax ID'), {
      target: { value: ' 12-3456789 ' },
    })
    fireEvent.click(screen.getByLabelText(/1099 recipient/))
    fireEvent.click(screen.getByText('Save tax details'))
    await waitFor(() =>
      expect(mockUpdateAgent).toHaveBeenCalledWith('kg_test', {
        agent_id: 'agt_staples',
        tax_id: '12-3456789',
        is_1099_recipient: true,
      })
    )
    expect(await screen.findByText('••••6789')).toBeInTheDocument()
    expect(screen.queryByDisplayValue('12-3456789')).toBeNull()
  })

  it('opening the field and saving the flag alone keeps the tax ID', async () => {
    mockGetAgent.mockResolvedValue(withTax({ taxId: '12-3456789' }))
    renderModal()
    fireEvent.click(await screen.findByText('Change'))
    fireEvent.click(screen.getByLabelText(/1099 recipient/))
    fireEvent.click(screen.getByText('Save tax details'))
    await waitFor(() =>
      expect(mockUpdateAgent).toHaveBeenCalledWith('kg_test', {
        agent_id: 'agt_staples',
        is_1099_recipient: true,
      })
    )
  })

  it('removes a tax ID only by asking to', async () => {
    mockGetAgent.mockResolvedValue(withTax({ taxId: '12-3456789' }))
    renderModal()
    expect(await screen.findByText('••••6789')).toBeInTheDocument()
    const save = screen.getByText('Save tax details') as HTMLButtonElement
    expect(save.disabled).toBe(true)
    fireEvent.click(screen.getByText('Remove'))
    expect(screen.getByText('Removed on save')).toBeInTheDocument()
    fireEvent.click(save)
    await waitFor(() =>
      expect(mockUpdateAgent).toHaveBeenCalledWith('kg_test', {
        agent_id: 'agt_staples',
        tax_id: '',
      })
    )
  })

  it('a refusal is shown and the entry kept', async () => {
    mockGetAgent.mockResolvedValue(agent(null))
    mockUpdateAgent.mockRejectedValue(
      new Error('Update agent failed: {"detail":"Agent is locked"}')
    )
    renderModal()
    fireEvent.click(await screen.findByText('Add'))
    fireEvent.change(screen.getByLabelText('Tax ID'), {
      target: { value: '12-3456789' },
    })
    fireEvent.click(screen.getByText('Save tax details'))
    expect(await screen.findByText(/Agent is locked/)).toBeInTheDocument()
    expect(screen.getByDisplayValue('12-3456789')).toBeInTheDocument()
  })

  it('a QuickBooks counterparty is read-only, kept in QuickBooks', async () => {
    mockGetAgent.mockResolvedValue(
      withTax({
        source: 'quickbooks',
        taxId: '12-3456789',
        is1099Recipient: true,
      })
    )
    renderModal()
    expect(await screen.findByText(/Kept in QuickBooks/)).toBeInTheDocument()
    expect(screen.getByText('••••6789')).toBeInTheDocument()
    expect(screen.queryByText('Save tax details')).toBeNull()
    expect(screen.queryByText('Change')).toBeNull()
  })

  it('a save that landed is not reported as failed when the reload fails', async () => {
    mockGetAgent
      .mockResolvedValueOnce(agent(null))
      .mockRejectedValueOnce(new Error('network'))
    renderModal()
    fireEvent.click(await screen.findByText('Add'))
    fireEvent.change(screen.getByLabelText('Tax ID'), {
      target: { value: '12-3456789' },
    })
    fireEvent.click(screen.getByText('Save tax details'))
    expect(await screen.findByText('••••6789')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.queryByDisplayValue('12-3456789')).toBeNull()
    expect(mockUpdateAgent).toHaveBeenCalledTimes(1)
  })
})
