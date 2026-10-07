import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListAccounts = vi.fn()
const mockLinkBankAccount = vi.fn()

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      listAccounts: (...args: any[]) => mockListAccounts(...args),
      linkBankAccount: (...args: any[]) => mockLinkBankAccount(...args),
    },
  },
}))

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
  Modal: ({ children, show }: any) => (show ? <div>{children}</div> : null),
  ModalBody: ({ children }: any) => <div>{children}</div>,
  ModalFooter: ({ children }: any) => <div>{children}</div>,
  ModalHeader: ({ children }: any) => <h2>{children}</h2>,
  Radio: ({ id, checked, onChange, disabled }: any) => (
    <input
      id={id}
      type="radio"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
    />
  ),
  Select: ({ id, value, onChange, disabled, children }: any) => (
    <select id={id} value={value} onChange={onChange} disabled={disabled}>
      {children}
    </select>
  ),
}))

import MoveAccountModal from '../components/MoveAccountModal'

const entity = (over: Record<string, unknown>) => ({
  id: 'ent',
  name: 'Entity',
  legalName: null,
  ticker: null,
  cik: null,
  industry: null,
  entityType: null,
  status: 'active',
  isParent: false,
  parentEntityId: null,
  ownershipPct: null,
  source: 'native',
  sourceGraphId: null,
  connectionId: null,
  createdAt: null,
  updatedAt: null,
  ...over,
})
const parent = entity({ id: 'ent_p', name: 'Cascade', isParent: true })
const sub = entity({ id: 'ent_s', name: 'Cadence', parentEntityId: 'ent_p' })

const account = {
  id: 'elem_chk',
  code: '1010',
  name: 'Chase Checking ••1234',
  kind: 'bank',
  balanceType: 'debit',
  isActive: true,
  entityId: 'ent_p',
  entityName: 'Cascade',
  source: 'plaid',
  connectionId: 'conn_plaid',
  institution: 'Chase',
  feedAccountId: 'acc_1',
  feedAccountName: 'Chase Checking ••1234',
  feedAccountKind: 'checking',
  connectionStatus: 'active',
  lastSyncAt: null,
  lastSyncStatus: null,
}

const moved = {
  connection_id: 'conn_plaid',
  provider: 'plaid',
  account_id: 'acc_1',
  element_id: 'elem_new',
  previous_element_id: 'elem_chk',
  entity_id: 'ent_s',
  account_created: true,
  events_repointed: 0,
  events_unclassified: 0,
  pairs_across_entities: 0,
  changed: true,
}

function renderModal(
  over: Partial<React.ComponentProps<typeof MoveAccountModal>> = {}
) {
  const onMoved = vi.fn()
  const onClose = vi.fn()
  render(
    <MoveAccountModal
      show
      account={account as any}
      entities={[parent, sub] as any}
      graphId="kg_a"
      onClose={onClose}
      onMoved={onMoved}
      {...over}
    />
  )
  return { onMoved, onClose }
}

describe('MoveAccountModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLinkBankAccount.mockResolvedValue(moved)
    mockListAccounts.mockResolvedValue({
      accounts: [
        { id: 'elem_rent', code: '6500', name: 'Rent' },
        { id: 'elem_chk', code: '1010', name: 'Chase Checking ••1234' },
      ],
    })
  })

  it('defaults to the other entity and creates the account in its chart', async () => {
    const { onMoved } = renderModal()
    expect(screen.getByLabelText('Entity')).toHaveValue('ent_s')
    expect(
      screen.getByLabelText(/Create a new account in Cadence/)
    ).toBeChecked()

    fireEvent.click(screen.getByText('Move account'))
    await waitFor(() => expect(onMoved).toHaveBeenCalledWith(moved))
    expect(mockLinkBankAccount).toHaveBeenCalledWith('kg_a', {
      connection_id: 'conn_plaid',
      account_id: 'acc_1',
      entity_id: 'ent_s',
    })
  })

  it("links to an existing account of the chosen entity's chart", async () => {
    const { onMoved } = renderModal()
    fireEvent.click(screen.getByLabelText('Link to an existing account'))
    await waitFor(() =>
      expect(mockListAccounts).toHaveBeenCalledWith('kg_a', {
        entityId: 'ent_s',
        isActive: true,
        limit: 500,
      })
    )
    // The account being moved is not a candidate for itself.
    await screen.findByText('6500 · Rent')
    expect(
      screen.queryByText('1010 · Chase Checking ••1234')
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('Move account'))
    await waitFor(() => expect(onMoved).toHaveBeenCalled())
    expect(mockLinkBankAccount).toHaveBeenCalledWith('kg_a', {
      connection_id: 'conn_plaid',
      account_id: 'acc_1',
      element_id: 'elem_rent',
    })
  })

  it('asks for the parent’s chart by null scope', async () => {
    renderModal()
    fireEvent.change(screen.getByLabelText('Entity'), {
      target: { value: 'ent_p' },
    })
    fireEvent.click(screen.getByLabelText('Link to an existing account'))
    await waitFor(() =>
      expect(mockListAccounts).toHaveBeenCalledWith('kg_a', {
        entityId: null,
        isActive: true,
        limit: 500,
      })
    )
  })

  it('shows the refusal and reports it', async () => {
    mockLinkBankAccount.mockRejectedValueOnce(
      Object.assign(new Error('Account is already fed by mercury'), {
        status: 409,
        detail: 'Account is already fed by mercury',
      })
    )
    const onError = vi.fn()
    const { onMoved } = renderModal({ onError })
    fireEvent.click(screen.getByText('Move account'))
    expect(await screen.findByRole('alert')).toHaveTextContent(/already fed/)
    expect(onError).toHaveBeenCalledWith('Account is already fed by mercury')
    expect(onMoved).not.toHaveBeenCalled()
  })
})
