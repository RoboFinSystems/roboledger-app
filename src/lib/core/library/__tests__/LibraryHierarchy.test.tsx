import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LibraryHierarchy } from '../components/LibraryHierarchy'

type MockClient = {
  listLibraryStructures: ReturnType<typeof vi.fn>
  listLibraryTaxonomyArcs: ReturnType<typeof vi.fn>
}

const makeClient = (overrides: Partial<MockClient> = {}): MockClient => ({
  listLibraryStructures: vi.fn().mockResolvedValue([]),
  listLibraryTaxonomyArcs: vi.fn().mockResolvedValue({ arcs: [], count: 0 }),
  ...overrides,
})

const taxonomies = [
  { id: 'tax-rsgaap', standard: 'rs-gaap' },
  { id: 'tax-pres', standard: 'rs-gaap-presentation' },
  { id: 'tax-calc', standard: 'rs-gaap-calculations' },
] as any

const baseProps = {
  graphId: 'library',
  taxonomies,
  baseStandard: 'rs-gaap',
  selectedElementId: null,
  onSelectElement: vi.fn(),
}

const arc = (over: Record<string, unknown> = {}) => ({
  id: 'a1',
  structureId: 's1',
  structureName: 'BS Classified',
  fromElementId: 'e_assets',
  fromElementQname: 'rs-gaap:Assets',
  fromElementName: 'Assets',
  fromElementTrait: 'asset',
  fromElementIsAbstract: false,
  toElementId: 'e_cash',
  toElementQname: 'rs-gaap:CashAndCashEquivalents',
  toElementName: 'Cash',
  toElementTrait: 'asset',
  toElementIsAbstract: false,
  associationType: 'presentation',
  arcrole: null,
  orderValue: 1,
  weight: null,
  ...over,
})

describe('LibraryHierarchy', () => {
  it('defaults to presentation; shows the notice when no arc-owning taxonomy exists', async () => {
    const client = makeClient()

    render(
      <LibraryHierarchy
        {...baseProps}
        taxonomies={[{ id: 'x', standard: 'sfac6' }] as any}
        baseStandard="sfac6"
        client={client as any}
      />
    )

    await waitFor(() =>
      expect(
        screen.getByText(/no presentation hierarchy is published/i)
      ).toBeInTheDocument()
    )
    // No owning taxonomy → never tries to load arcs.
    expect(client.listLibraryTaxonomyArcs).not.toHaveBeenCalled()
  })

  it('resolves the presentation taxonomy and renders a tree from arcs', async () => {
    const client = makeClient({
      listLibraryTaxonomyArcs: vi
        .fn()
        .mockResolvedValue({ arcs: [arc()], count: 1 }),
    })

    render(<LibraryHierarchy {...baseProps} client={client as any} />)

    await waitFor(() => expect(screen.getByText('Assets')).toBeInTheDocument())
    expect(screen.getByText('Cash')).toBeInTheDocument()
    // Default arc type is presentation → resolves the {base}-presentation taxonomy.
    expect(client.listLibraryTaxonomyArcs).toHaveBeenCalledWith(
      'library',
      'tax-pres',
      expect.objectContaining({ associationType: 'presentation' })
    )
  })

  it('shows an error alert when the arc fetch rejects', async () => {
    const client = makeClient({
      listLibraryTaxonomyArcs: vi.fn().mockRejectedValue(new Error('boom')),
    })

    render(<LibraryHierarchy {...baseProps} client={client as any} />)

    await waitFor(() => expect(screen.getByText('boom')).toBeInTheDocument())
  })

  it('dedupes a blended arc that recurs across structures', async () => {
    // Same parent->child arc contributed by two structures (the "All
    // structures" blend) must collapse to a single child node.
    const dup = [
      arc({ id: 'a1', structureId: 's1' }),
      arc({ id: 'a2', structureId: 's2' }),
    ]
    const client = makeClient({
      listLibraryTaxonomyArcs: vi
        .fn()
        .mockResolvedValue({ arcs: dup, count: 2 }),
    })

    render(<LibraryHierarchy {...baseProps} client={client as any} />)

    await waitFor(() => expect(screen.getByText('Assets')).toBeInTheDocument())
    expect(screen.getAllByText('Cash')).toHaveLength(1)
  })

  it('collapses and expands children when the chevron is clicked', async () => {
    const client = makeClient({
      listLibraryTaxonomyArcs: vi
        .fn()
        .mockResolvedValue({ arcs: [arc()], count: 1 }),
    })

    render(<LibraryHierarchy {...baseProps} client={client as any} />)

    // Root + its single child render expanded by default (depth < 2).
    await waitFor(() => expect(screen.getByText('Cash')).toBeInTheDocument())

    // Collapse the root → child disappears.
    fireEvent.click(screen.getByLabelText('Collapse'))
    expect(screen.queryByText('Cash')).not.toBeInTheDocument()

    // Expand again → child returns.
    fireEvent.click(screen.getByLabelText('Expand'))
    expect(screen.getByText('Cash')).toBeInTheDocument()
  })
})
