import { clients } from '@robosystems/client/clients'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
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
  selectedTaxonomyId: 'tax-rsgaap',
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

  it('renders the backend account tree for a chart of accounts', async () => {
    const spy = vi.spyOn(clients.ledger, 'getAccountTree').mockResolvedValue({
      roots: [
        {
          id: 'p',
          code: '1000',
          name: 'Assets',
          trait: 'asset',
          children: [
            {
              id: 'c',
              code: '1010',
              name: 'Cash',
              trait: 'asset',
              children: [],
            },
          ],
        },
      ],
      totalAccounts: 2,
    } as never)

    const client = makeClient()
    render(
      <LibraryHierarchy
        {...baseProps}
        taxonomies={
          [{ id: 'tax-coa', taxonomyType: 'chart_of_accounts' }] as any
        }
        selectedTaxonomyId="tax-coa"
        baseStandard={null}
        client={client as any}
      />
    )

    await waitFor(() => expect(screen.getByText('Assets')).toBeInTheDocument())
    expect(screen.getByText('Cash')).toBeInTheDocument()
    // CoA uses the backend account tree (code-ordered, active-only), not arcs.
    expect(spy).toHaveBeenCalled()
    expect(client.listLibraryTaxonomyArcs).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('orders CoA roots by AccountType, not by name', async () => {
    // Names are deliberately reverse-alphabetical to the AccountType order:
    // the Bank account is named "Zzz Checking" (sorts last by name) and the
    // Expense account "Aaa Expense" (sorts first by name). Correct behavior
    // is AccountType-first — Bank (0) before Expense (12) — so "Zzz Checking"
    // must render BEFORE "Aaa Expense". A name-only sort (or an
    // ACCOUNT_TYPE_ORDER typo that drops Bank's precedence) flips them.
    const spy = vi.spyOn(clients.ledger, 'getAccountTree').mockResolvedValue({
      roots: [
        {
          id: 'exp',
          code: 'Aaa Expense',
          name: 'Aaa Expense',
          trait: 'expense',
          accountType: 'Expense',
          children: [],
        },
        {
          id: 'bank',
          code: 'Zzz Checking',
          name: 'Zzz Checking',
          trait: 'asset',
          accountType: 'Bank',
          children: [],
        },
      ],
      totalAccounts: 2,
    } as never)

    const client = makeClient()
    render(
      <LibraryHierarchy
        {...baseProps}
        taxonomies={
          [{ id: 'tax-coa', taxonomyType: 'chart_of_accounts' }] as any
        }
        selectedTaxonomyId="tax-coa"
        baseStandard={null}
        client={client as any}
      />
    )

    await waitFor(() =>
      expect(screen.getByText('Zzz Checking')).toBeInTheDocument()
    )
    const text = screen.getByRole('tree').textContent ?? ''
    const bankIdx = text.indexOf('Zzz Checking')
    const expenseIdx = text.indexOf('Aaa Expense')
    expect(bankIdx).toBeGreaterThanOrEqual(0)
    expect(expenseIdx).toBeGreaterThanOrEqual(0)
    expect(bankIdx).toBeLessThan(expenseIdx)
    spy.mockRestore()
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
    // The arc load also schedules a passive effect that resets the collapse
    // state to the default expand depth. Flush it before toggling — otherwise,
    // under full-suite timing, that reset can land after the click and clobber
    // it, re-expanding the node (a rare cross-file flake when run with others).
    await act(async () => {})

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
