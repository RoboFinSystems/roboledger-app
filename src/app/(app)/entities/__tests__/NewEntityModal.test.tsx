import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockCreateEntity = vi.fn()

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      createEntity: (...args: any[]) => mockCreateEntity(...args),
    },
  },
}))

vi.mock('flowbite-react', () => ({
  Alert: ({ children }: any) => <div role="alert">{children}</div>,
  Button: ({ children, onClick, disabled, type }: any) => (
    <button onClick={onClick} disabled={disabled} type={type ?? 'button'}>
      {children}
    </button>
  ),
  Label: ({ children, htmlFor }: any) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
  Modal: ({ children, show }: any) => (show ? <div>{children}</div> : null),
  ModalBody: ({ children }: any) => <div>{children}</div>,
  ModalFooter: ({ children }: any) => <div>{children}</div>,
  ModalHeader: ({ children }: any) => <div>{children}</div>,
  Select: ({ children, ...props }: any) => (
    <select {...props}>{children}</select>
  ),
  TextInput: ({ color: _color, ...props }: any) => <input {...props} />,
}))

import NewEntityModal from '../components/NewEntityModal'

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

const parent = entity({ id: 'ent_p', name: 'Harbinger', isParent: true })
const sub = entity({
  id: 'ent_s',
  name: 'Maple Court',
  parentEntityId: 'ent_p',
})

const submit = (container: HTMLElement) =>
  fireEvent.submit(container.querySelector('form')!)

describe('NewEntityModal', () => {
  const onClose = vi.fn()
  const onCreated = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateEntity.mockResolvedValue({ id: 'ent_new', name: 'New' })
  })

  it("creates a graph's first entity as the group parent, with no parent fields", async () => {
    const { container } = render(
      <NewEntityModal
        graphId="kg_a"
        entities={[]}
        open
        onClose={onClose}
        onCreated={onCreated}
      />
    )
    expect(screen.getByText(/becomes the group parent/)).toBeInTheDocument()
    expect(screen.queryByLabelText('Held under')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Ownership %')).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: '  Harbinger  ' },
    })
    submit(container)

    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1))
    expect(mockCreateEntity).toHaveBeenCalledWith('kg_a', {
      name: 'Harbinger',
      legal_name: null,
      entity_type: null,
      ticker: null,
    })
  })

  it('holds a subsidiary under the group parent by default, with its ownership', async () => {
    const { container } = render(
      <NewEntityModal
        graphId="kg_a"
        entities={[parent, sub]}
        open
        onClose={onClose}
        onCreated={onCreated}
      />
    )
    expect(screen.getByLabelText('Held under')).toHaveValue('ent_p')

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Maple Annex' },
    })
    fireEvent.change(screen.getByLabelText('Legal name'), {
      target: { value: 'Maple Annex LLC' },
    })
    fireEvent.change(screen.getByLabelText('Legal form'), {
      target: { value: 'llc' },
    })
    fireEvent.change(screen.getByLabelText('Ticker'), {
      target: { value: 'mpa' },
    })
    fireEvent.change(screen.getByLabelText('Held under'), {
      target: { value: 'ent_s' },
    })
    fireEvent.change(screen.getByLabelText('Ownership %'), {
      target: { value: '60' },
    })
    submit(container)

    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1))
    expect(mockCreateEntity).toHaveBeenCalledWith('kg_a', {
      name: 'Maple Annex',
      legal_name: 'Maple Annex LLC',
      entity_type: 'llc',
      ticker: 'MPA',
      parent_entity_id: 'ent_s',
      ownership_pct: 60,
    })
  })

  it('refuses an ownership outside 0–100 before asking the server', () => {
    render(
      <NewEntityModal
        graphId="kg_a"
        entities={[parent]}
        open
        onClose={onClose}
        onCreated={onCreated}
      />
    )
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Maple Annex' },
    })
    fireEvent.change(screen.getByLabelText('Ownership %'), {
      target: { value: '120' },
    })
    expect(screen.getByText('Create Entity')).toBeDisabled()
    expect(mockCreateEntity).not.toHaveBeenCalled()
  })

  it("shows the server's refusal in plain words", async () => {
    mockCreateEntity.mockRejectedValue(
      new Error(
        'Create entity failed: {"detail":"Ticker MCL is already used by Maple Court"}'
      )
    )
    const { container } = render(
      <NewEntityModal
        graphId="kg_a"
        entities={[parent]}
        open
        onClose={onClose}
        onCreated={onCreated}
      />
    )
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Maple Annex' },
    })
    submit(container)

    expect(await screen.findByRole('alert')).toHaveTextContent(/MCL/)
    expect(onCreated).not.toHaveBeenCalled()
    // The form is still there to fix and resubmit.
    expect(screen.getByText('Create Entity')).not.toBeDisabled()
  })

  it('keeps what the user typed when the group is re-read', () => {
    const { rerender } = render(
      <NewEntityModal
        graphId="kg_a"
        entities={[parent]}
        open
        onClose={onClose}
        onCreated={onCreated}
      />
    )
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Maple Annex' },
    })
    // The same group, read again: new array, new row objects.
    rerender(
      <NewEntityModal
        graphId="kg_a"
        entities={[{ ...parent }]}
        open
        onClose={onClose}
        onCreated={onCreated}
      />
    )
    expect(screen.getByLabelText('Name')).toHaveValue('Maple Annex')
  })

  it('cancels without creating', () => {
    render(
      <NewEntityModal
        graphId="kg_a"
        entities={[parent]}
        open
        onClose={onClose}
        onCreated={onCreated}
      />
    )
    fireEvent.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(mockCreateEntity).not.toHaveBeenCalled()
  })
})
