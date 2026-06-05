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

const struct = (over: Record<string, unknown> = {}) => ({
  id: 's1',
  name: 'Structure',
  blockType: 'balance_sheet',
  roleUri: 'cm/role',
  ...over,
})

// A deliberately unordered mix: the empty seed catch-all (custom), an
// auto-derived base network (role '…-pres-bs'), and two real styles given in
// IS-before-BS order so the BS→IS sort is actually exercised.
const mixedStructures = [
  struct({ id: 's_is', name: 'IS Multi-step', blockType: 'income_statement' }),
  struct({ id: 's_custom', name: 'Default', blockType: 'custom' }),
  struct({ id: 's_bs', name: 'BS Classified' }),
  struct({ id: 's_base', name: 'BS base', roleUri: 'cm/role-pres-bs' }),
]

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

    // Collapse the root → child disappears. The toggle's label names the node.
    fireEvent.click(screen.getByLabelText('Collapse Assets'))
    expect(screen.queryByText('Cash')).not.toBeInTheDocument()

    // Expand again → child returns.
    fireEvent.click(screen.getByLabelText('Expand Assets'))
    expect(screen.getByText('Cash')).toBeInTheDocument()
  })

  it('hides substrate structures and defaults Presentation to the Balance Sheet', async () => {
    // The picker must drop the custom catch-all and the '-pres-bs' base
    // network, order BS before IS, and auto-select the balance sheet — not
    // "All structures".
    const client = makeClient({
      listLibraryStructures: vi.fn().mockResolvedValue(mixedStructures),
      listLibraryTaxonomyArcs: vi
        .fn()
        .mockResolvedValue({ arcs: [arc()], count: 1 }),
    })

    render(<LibraryHierarchy {...baseProps} client={client as any} />)

    const select = (await screen.findByLabelText(
      'Structure'
    )) as HTMLSelectElement
    const options = [...select.querySelectorAll('option')].map(
      (o) => o.textContent
    )
    // 'All structures' sentinel + the two real styles, BS before IS;
    // the custom catch-all and the '-pres-bs' base network are filtered out.
    expect(options).toEqual([
      'All structures',
      'BS Classified',
      'IS Multi-step',
    ])
    // Presentation auto-selects the balance sheet and scopes the arc fetch to it.
    expect(select.value).toBe('s_bs')
    await waitFor(() =>
      expect(client.listLibraryTaxonomyArcs).toHaveBeenCalledWith(
        'library',
        'tax-pres',
        expect.objectContaining({
          associationType: 'presentation',
          structureId: 's_bs',
        })
      )
    )
  })

  it('defaults Calculation to "All structures" (no structure scope)', async () => {
    // Unlike presentation, the calc union IS the single coherent DAG, so
    // calculation opens on "All structures" (structureId undefined).
    const client = makeClient({
      listLibraryStructures: vi
        .fn()
        .mockResolvedValue([struct({ id: 's_bs' })]),
      listLibraryTaxonomyArcs: vi
        .fn()
        .mockResolvedValue({ arcs: [arc()], count: 1 }),
    })

    render(<LibraryHierarchy {...baseProps} client={client as any} />)

    // Let the initial presentation load settle, then switch to calculation.
    await screen.findByLabelText('Structure')
    fireEvent.click(screen.getByRole('button', { name: 'Calculation' }))

    await waitFor(() =>
      expect(client.listLibraryTaxonomyArcs).toHaveBeenCalledWith(
        'library',
        'tax-calc',
        expect.objectContaining({
          associationType: 'calculation',
          structureId: undefined,
        })
      )
    )
  })
})
