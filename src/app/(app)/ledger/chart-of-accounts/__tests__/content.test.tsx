import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetAccountTree = vi.fn()
const mockListMappings = vi.fn()
const mockGetMapping = vi.fn()
const mockGetMappingCandidates = vi.fn()
const mockCreateMappingAssociation = vi.fn()
const mockDeleteMappingAssociation = vi.fn()
const mockListTaxonomies = vi.fn()
const mockListElements = vi.fn()
const mockUpdateTaxonomyBlock = vi.fn()

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      getAccountTree: (...args: any[]) => mockGetAccountTree(...args),
      listMappings: (...args: any[]) => mockListMappings(...args),
      getMapping: (...args: any[]) => mockGetMapping(...args),
      getMappingCoverage: vi.fn(async () => null),
      getMappingCandidates: (...args: any[]) =>
        mockGetMappingCandidates(...args),
      createMappingAssociation: (...args: any[]) =>
        mockCreateMappingAssociation(...args),
      deleteMappingAssociation: (...args: any[]) =>
        mockDeleteMappingAssociation(...args),
      listChartTemplates: vi.fn(async () => []),
      listTaxonomies: (...args: any[]) => mockListTaxonomies(...args),
      listElements: (...args: any[]) => mockListElements(...args),
      updateTaxonomyBlock: (...args: any[]) => mockUpdateTaxonomyBlock(...args),
      getFiscalCalendar: vi.fn(async () => ({ closedThrough: null })),
    },
  },
  PageLayout: ({ children }: any) => <div>{children}</div>,
  PageHeader: ({ title }: any) => <div>{title}</div>,
  LoadingState: () => <div role="status" />,
  EmptyState: ({ title }: any) => <div>{title}</div>,
}))

vi.mock('@/components/DocsLink', () => ({ default: () => null }))

vi.mock('../components/ChartTemplatePicker', () => ({
  ChartTemplatePicker: ({ onInitialized }: any) => (
    <button
      onClick={() =>
        onInitialized({ elementsCreated: 42, mappingsCreated: 40 })
      }
    >
      Use template
    </button>
  ),
}))

const { GRAPH } = vi.hoisted(() => ({
  GRAPH: { graphId: 'kg_a', graphName: 'Group' },
}))
vi.mock('@/lib/useLedgerGraph', () => ({
  useLedgerGraph: () => ({ graph: GRAPH }),
}))

const mockScope = vi.fn()
vi.mock('@/lib/entity-scope', () => ({ useEntityScope: () => mockScope() }))

import ChartOfAccountsContent, { describeReclassification } from '../content'

describe('ChartOfAccountsContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAccountTree.mockResolvedValue({ roots: [] })
    mockListMappings.mockResolvedValue([])
    mockListTaxonomies.mockResolvedValue([])
  })

  it('says what a template created', async () => {
    mockScope.mockReturnValue({ entityId: null, parent: { id: 'ent_parent' } })
    render(<ChartOfAccountsContent />)
    fireEvent.click(await screen.findByText('Use template'))
    expect(
      await screen.findByText(
        'Chart created: 42 accounts, 40 mapped for reporting.'
      )
    ).toBeInTheDocument()
    await waitFor(() => expect(mockGetAccountTree).toHaveBeenCalledTimes(2))
  })

  it.each([
    [
      'a subsidiary',
      { entityId: 'ent_sub', parent: { id: 'ent_parent' } },
      'ent_sub',
    ],
    [
      'the group parent',
      { entityId: null, parent: { id: 'ent_parent' } },
      'ent_parent',
    ],
  ])(
    "maps %s's accounts into its own mapping",
    async (_who, scope, expected) => {
      mockScope.mockReturnValue(scope)
      render(<ChartOfAccountsContent />)
      await waitFor(() =>
        expect(mockListMappings).toHaveBeenCalledWith('kg_a', {
          entityId: expected,
        })
      )
    }
  )
})

describe('remapping a mapped account', () => {
  const card = {
    id: 'el_card',
    code: '2110',
    name: 'Card',
    trait: 'liability',
    balanceType: 'credit',
    depth: 0,
    isActive: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockScope.mockReturnValue({ entityId: null, parent: { id: 'ent_parent' } })
    mockListTaxonomies.mockResolvedValue([])
    mockGetAccountTree.mockResolvedValue({ roots: [card] })
    mockListMappings.mockResolvedValue([{ id: 'map_1', name: 'Book mapping' }])
    mockGetMapping.mockResolvedValue({
      associations: [
        {
          id: 'assoc_old',
          fromElementId: 'el_card',
          toElementId: 'rs_debt',
          toElementName: 'Short-term debt',
          toElementQname: 'rs-gaap:DebtCurrent',
          confidence: 1,
        },
      ],
    })
    mockGetMappingCandidates.mockImplementation(async (_graph, cls) =>
      cls === 'liability'
        ? [
            {
              id: 'rs_other',
              name: 'Other current liabilities',
              qname: 'rs-gaap:OtherLiabilitiesCurrent',
              trait: 'liability',
            },
          ]
        : []
    )
  })

  const chooseOtherCurrentLiabilities = async () => {
    render(<ChartOfAccountsContent />)
    fireEvent.click(await screen.findByText('Show mappings'))
    fireEvent.click(await screen.findByText('Short-term debt'))
    fireEvent.click(await screen.findByText('Other current liabilities'))
  }

  it('moves the account in one write and names the closed months it reached', async () => {
    mockCreateMappingAssociation.mockResolvedValue({
      id: 'assoc_new',
      replaced_association_id: 'assoc_old',
      reclassified_periods: ['2026-03', '2026-04', '2026-05'],
    })

    await chooseOtherCurrentLiabilities()

    await waitFor(() =>
      expect(mockCreateMappingAssociation).toHaveBeenCalledWith('kg_a', {
        mapping_id: 'map_1',
        from_element_id: 'el_card',
        to_element_id: 'rs_other',
        confidence: 1.0,
        replaces_association_id: 'assoc_old',
      })
    )
    expect(mockDeleteMappingAssociation).not.toHaveBeenCalled()
    expect(
      await screen.findByText(
        'Reclassified. 3 closed months (Mar 2026 to May 2026) now read as Other current liabilities on live statements; the statements saved at each close keep the answer as closed.'
      )
    ).toBeTruthy()
  })

  it('deletes the old arc itself when the server reports no replacement', async () => {
    mockCreateMappingAssociation.mockResolvedValue({ id: 'assoc_new' })
    mockDeleteMappingAssociation.mockResolvedValue({ deleted: true })

    await chooseOtherCurrentLiabilities()

    await waitFor(() =>
      expect(mockDeleteMappingAssociation).toHaveBeenCalledWith('kg_a', {
        mapping_id: 'map_1',
        association_id: 'assoc_old',
      })
    )
    expect(mockCreateMappingAssociation).toHaveBeenCalledTimes(1)
    expect(screen.queryByText(/^Reclassified\./)).toBeNull()
  })

  it("shows the server's reason when the move is refused", async () => {
    // The facade's shape: the server's body stringified into the message.
    mockCreateMappingAssociation.mockRejectedValue(
      new Error(
        'Create mapping association failed: ' +
          JSON.stringify({
            detail:
              'refusing to disturb facts that the ledger treats as immutable: 7 canonical statement set(s) of closed period(s) 2026-03–2026-09 were computed through the mapping arcs or element attributes this change alters (reopen latest-first down to 2026-03 — closed history is immutable) Moving coa:2110 from the balance sheet to the income statement changes net income and every later carry-in: a restatement, not a reclassification.',
          })
      )
    )

    await chooseOtherCurrentLiabilities()

    expect(
      await screen.findByText(/from the balance sheet to the income statement/)
    ).toBeTruthy()
    expect(screen.queryByText(/^Reclassified\./)).toBeNull()
  })

  it('maps an unmapped account without naming an arc to replace', async () => {
    mockGetMapping.mockResolvedValue({ associations: [] })
    mockCreateMappingAssociation.mockResolvedValue({
      id: 'assoc_new',
      replaced_association_id: null,
      reclassified_periods: [],
    })

    render(<ChartOfAccountsContent />)
    fireEvent.click(await screen.findByText('Show mappings'))
    fireEvent.click(await screen.findByText('Unmapped'))
    fireEvent.click(await screen.findByText('Other current liabilities'))

    await waitFor(() =>
      expect(mockCreateMappingAssociation).toHaveBeenCalledWith('kg_a', {
        mapping_id: 'map_1',
        from_element_id: 'el_card',
        to_element_id: 'rs_other',
        confidence: 1.0,
      })
    )
    expect(screen.queryByText(/^Reclassified\./)).toBeNull()
  })
})

describe('describeReclassification', () => {
  it('spans the months oldest to newest', () => {
    expect(
      describeReclassification('Other current liabilities', [
        '2026-09',
        '2026-03',
      ])
    ).toBe(
      'Reclassified. 2 closed months (Mar 2026 to Sep 2026) now read as Other current liabilities on live statements; the statements saved at each close keep the answer as closed.'
    )
  })

  it('names a single month on its own', () => {
    expect(describeReclassification('Rent', ['2026-06'])).toBe(
      'Reclassified. 1 closed month (Jun 2026) now read as Rent on live statements; the statements saved at each close keep the answer as closed.'
    )
  })
})

describe('editing the chart', () => {
  const node = (id: string, name: string, code: string) => ({
    id,
    code,
    name,
    trait: 'expense',
    balanceType: 'debit',
    depth: 0,
    isActive: true,
  })
  const element = (
    id: string,
    name: string,
    code: string,
    overrides: Record<string, unknown> = {}
  ) => ({
    id,
    code,
    name,
    qname: `coa:${code}`,
    trait: 'expense',
    balanceType: 'debit',
    parentId: null,
    isActive: true,
    source: 'native',
    ...overrides,
  })
  const page = (elements: unknown[]) => ({
    elements,
    pagination: {
      total: elements.length,
      limit: 1000,
      offset: 0,
      hasMore: false,
    },
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockScope.mockReturnValue({
      entityId: 'ent_sub',
      parent: { id: 'ent_parent' },
    })
    mockListMappings.mockResolvedValue([])
    mockGetAccountTree.mockResolvedValue({
      roots: [node('el_rent', 'Rent', '6100')],
    })
    mockListTaxonomies.mockResolvedValue([
      { id: 'tax_parent' },
      { id: 'tax_sub' },
    ])
    // As the API answers: a retired account only when asked for.
    mockListElements.mockImplementation(
      async (_graph, { taxonomyId, includeInactive }) => {
        const rows =
          taxonomyId === 'tax_sub'
            ? [
                element('el_rent', 'Rent', '6100'),
                element('el_old', 'Old lease', '6190', { isActive: false }),
              ]
            : [element('el_parent_rent', 'Rent', '6100')]
        return page(includeInactive ? rows : rows.filter((row) => row.isActive))
      }
    )
    mockUpdateTaxonomyBlock.mockResolvedValue({})
  })

  it("edits the entity's own chart and reloads it after a save", async () => {
    render(<ChartOfAccountsContent />)
    fireEvent.click(await screen.findByLabelText('Edit Rent'))
    expect(mockListElements).toHaveBeenCalledWith('kg_a', {
      taxonomyId: 'tax_sub',
      limit: 1000,
      offset: 0,
      includeInactive: true,
    })
    fireEvent.change(await screen.findByLabelText('Name'), {
      target: { value: 'Office rent' },
    })
    fireEvent.click(screen.getByText('Save'))
    await waitFor(() =>
      expect(mockUpdateTaxonomyBlock).toHaveBeenCalledWith('kg_a', {
        taxonomy_id: 'tax_sub',
        elements_to_update: [{ qname: 'coa:6100', name: 'Office rent' }],
      })
    )
    expect(await screen.findByText('Saved Office rent.')).toBeInTheDocument()
    await waitFor(() => expect(mockGetAccountTree).toHaveBeenCalledTimes(2))
  })

  it('lists retired accounts with a way back', async () => {
    render(<ChartOfAccountsContent />)
    expect(await screen.findByText('Retired accounts (1)')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Reactivate…'))
    fireEvent.click(await screen.findByText('Reactivate account'))
    await waitFor(() =>
      expect(mockUpdateTaxonomyBlock).toHaveBeenCalledWith('kg_a', {
        taxonomy_id: 'tax_sub',
        elements_to_update: [{ qname: 'coa:6190', is_active: true }],
      })
    )
  })

  it('a QuickBooks chart is edited in QuickBooks', async () => {
    mockListElements.mockResolvedValue(
      page([element('el_rent', 'Rent', '6100', { source: 'quickbooks' })])
    )
    render(<ChartOfAccountsContent />)
    expect(
      await screen.findByText(/This chart is synced from QuickBooks/)
    ).toBeInTheDocument()
    expect(screen.queryByText('Add account')).toBeNull()
    expect(screen.queryByLabelText('Edit Rent')).toBeNull()
  })
})
