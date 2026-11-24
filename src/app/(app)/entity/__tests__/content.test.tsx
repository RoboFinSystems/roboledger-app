import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetEntity = vi.fn()
const mockUpdateEntity = vi.fn()
const mockListIndustries = vi.fn()
const mockRecordAcquisition = vi.fn()
const mockScope = vi.fn()
const mockRefresh = vi.fn()

// Every graph these tests select is a RoboLedger graph.
vi.mock('@/lib/useLedgerGraph', async () => {
  const core = await import('@robosystems/core')
  return {
    useLedgerGraph: () => {
      const id = core.useGraphContext().state.currentGraphId
      return {
        graph: id ? { graphId: id } : null,
        ledgerGraphs: [],
        mismatch: false,
      }
    },
  }
})

// The entity in scope: the group parent unless a test picks a subsidiary.
vi.mock('@/lib/entity-scope', () => ({
  useEntityScope: () => mockScope(),
}))

vi.mock('@robosystems/core', () => ({
  PageLayout: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  PageHeader: () => <div data-testid="page-header" />,
  useGraphContext: vi.fn(),
  useEntity: vi.fn(),
  clients: {
    ledger: {
      getEntity: (...args: any[]) => mockGetEntity(...args),
      updateEntity: (...args: any[]) => mockUpdateEntity(...args),
      listIndustries: (...args: any[]) => mockListIndustries(...args),
      recordAcquisition: (...args: any[]) => mockRecordAcquisition(...args),
      recordOwnershipChange: vi.fn(),
      recordDeconsolidation: vi.fn(),
    },
  },
}))

vi.mock('@robosystems/core/ui', () => ({
  Alert: ({ children }: any) => <div role="alert">{children}</div>,
  Badge: ({ children }: any) => <span>{children}</span>,
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Card: ({ children }: any) => <div>{children}</div>,
  Label: ({ children, htmlFor }: any) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
  Select: ({ children, ...props }: any) => (
    <select {...props}>{children}</select>
  ),
  Spinner: () => <div data-testid="spinner" />,
  TextInput: (props: any) => <input {...props} />,
}))

vi.mock('react-icons/hi', () => ({
  HiOfficeBuilding: () => <span />,
  HiPencil: () => <span />,
  HiSave: () => <span />,
  HiX: () => <span />,
}))

import { useEntity, useGraphContext } from '@robosystems/core'
import EntityInfoPageContent from '../content'

const mockUseGraphContext = vi.mocked(useGraphContext)
const mockUseEntity = vi.mocked(useEntity)

const entityFor = (graphId: string) => ({
  id: `ent_${graphId}`,
  uri: `https://example.test/${graphId}`,
  name: `Entity ${graphId}`,
  legalName: `Entity ${graphId} LLC`,
  phone: '',
  website: '',
  industry: '',
  entityType: '',
  stateOfIncorporation: '',
  fiscalYearEnd: '',
  taxId: '',
  lei: '',
  ticker: '',
  exchange: '',
  cik: '',
  sic: '',
  sicDescription: '',
  addressLine1: '',
  addressCity: '',
  addressState: '',
  addressPostalCode: '',
  addressCountry: '',
  parentEntityId: null,
  isParent: true,
  consolidationMethod: 'none',
  entityRole: 'operating',
  joinedOn: null,
  leftOn: null,
})

const node = (id: string, label: string, path: string[], level: string) => ({
  id,
  parentId: id.includes('/') ? id.slice(0, id.lastIndexOf('/')) : null,
  level,
  label,
  path,
  carried: false,
  replacedBy: null,
})
const INDUSTRIES = [
  node('technology', 'Technology', ['Technology'], 'sector'),
  node(
    'technology/software',
    'Software',
    ['Technology', 'Software'],
    'subsector'
  ),
]

function setGraph(graphId: string) {
  mockUseGraphContext.mockReturnValue({
    state: { currentGraphId: graphId, graphs: [] },
  } as any)
}

const parentScope = () =>
  mockScope.mockReturnValue({
    entityId: null,
    entities: [],
    entity: null,
    refresh: mockRefresh,
  })

describe('EntityInfoPageContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseEntity.mockReturnValue({
      currentEntity: null,
      setCurrentEntity: vi.fn(),
    } as any)
    mockGetEntity.mockImplementation((graphId: string) =>
      Promise.resolve(entityFor(graphId))
    )
    mockListIndustries.mockResolvedValue(INDUSTRIES)
    mockUpdateEntity.mockImplementation((graphId: string) =>
      Promise.resolve(entityFor(graphId))
    )
    setGraph('kg_a')
    parentScope()
  })

  it('loads the entity for the selected graph', async () => {
    render(<EntityInfoPageContent />)
    await waitFor(() =>
      expect(mockGetEntity).toHaveBeenCalledWith('kg_a', { entityId: null })
    )
    // Read-only view renders values as text; inputs appear only while editing.
    expect(
      await screen.findByText('https://example.test/kg_a')
    ).toBeInTheDocument()
  })

  it('abandons an in-progress edit when the graph changes', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<EntityInfoPageContent />)
    await waitFor(() =>
      expect(mockGetEntity).toHaveBeenCalledWith('kg_a', { entityId: null })
    )

    await user.click(await screen.findByText('Edit'))
    const nameInput = await screen.findByDisplayValue('Entity kg_a')
    await user.clear(nameInput)
    await user.type(nameInput, 'Renamed while on graph A')

    // Switch graphs mid-edit. The form held graph A's values; carrying them
    // over would let a save write them onto graph B's entity.
    setGraph('kg_b')
    rerender(<EntityInfoPageContent />)

    await waitFor(() =>
      expect(mockGetEntity).toHaveBeenCalledWith('kg_b', { entityId: null })
    )
    await waitFor(() =>
      expect(
        screen.queryByDisplayValue('Renamed while on graph A')
      ).not.toBeInTheDocument()
    )
    // Back to the read-only view, so there is no Save button to press.
    expect(screen.queryByText('Save')).not.toBeInTheDocument()
    expect(mockUpdateEntity).not.toHaveBeenCalled()
  })

  it('saves edited fields against the graph they were entered on', async () => {
    const user = userEvent.setup()
    render(<EntityInfoPageContent />)
    await waitFor(() =>
      expect(mockGetEntity).toHaveBeenCalledWith('kg_a', { entityId: null })
    )

    await user.click(await screen.findByText('Edit'))
    const nameInput = await screen.findByDisplayValue('Entity kg_a')
    await user.clear(nameInput)
    await user.type(nameInput, 'New name')
    await user.click(screen.getByText('Save'))

    await waitFor(() => expect(mockUpdateEntity).toHaveBeenCalledTimes(1))
    expect(mockUpdateEntity).toHaveBeenCalledWith(
      'kg_a',
      expect.objectContaining({ name: 'New name' })
    )
  })
  it('picks an industry from the list and saves its id', async () => {
    const user = userEvent.setup()
    render(<EntityInfoPageContent />)
    await user.click(await screen.findByText('Edit'))
    await user.type(screen.getByLabelText('Industry'), 'soft')
    await user.click(await screen.findByRole('option', { name: /Software/ }))
    expect(screen.getByLabelText('Industry')).toHaveValue(
      'Technology › Software'
    )
    await user.click(screen.getByText('Save'))

    await waitFor(() => expect(mockUpdateEntity).toHaveBeenCalledTimes(1))
    expect(mockUpdateEntity).toHaveBeenCalledWith('kg_a', {
      industry: 'technology/software',
    })
  })

  it('starts a new search from empty after a pick, and highlights by arrow key', async () => {
    const user = userEvent.setup()
    render(<EntityInfoPageContent />)
    await user.click(await screen.findByText('Edit'))
    const input = screen.getByLabelText('Industry')
    await user.type(input, 'soft')
    await user.click(await screen.findByRole('option', { name: /Software/ }))
    expect(input).toHaveValue('Technology › Software')

    // Focus never left: typing replaces the shown path instead of appending.
    await user.keyboard('tech')
    expect(input).toHaveValue('tech')
    await user.keyboard('{ArrowDown}')
    const active = input.getAttribute('aria-activedescendant')
    expect(active).toBeTruthy()
    expect(document.getElementById(active!)).toHaveAttribute(
      'aria-selected',
      'true'
    )
    await user.keyboard('{Enter}')
    expect(input).toHaveValue('Technology')
  })

  it('offers nothing focusable inside the list, so Tab leaves the field', async () => {
    const user = userEvent.setup()
    render(<EntityInfoPageContent />)
    await user.click(await screen.findByText('Edit'))
    await user.click(screen.getByLabelText('Industry'))
    const list = await screen.findByRole('listbox')
    expect(list.querySelector('button, a, [tabindex]')).toBeNull()
  })

  it('says the list is loading until it arrives, and failed only when it fails', async () => {
    const user = userEvent.setup()
    let arrive: (rows: typeof INDUSTRIES) => void = () => {}
    mockListIndustries.mockReturnValue(
      new Promise((resolve) => {
        arrive = resolve
      })
    )
    const { unmount } = render(<EntityInfoPageContent />)
    await user.click(await screen.findByText('Edit'))
    expect(screen.getByText('Loading industries…')).toBeInTheDocument()
    expect(screen.getByLabelText('Industry')).toBeDisabled()
    arrive(INDUSTRIES)
    await waitFor(() => expect(screen.getByLabelText('Industry')).toBeEnabled())
    unmount()

    mockListIndustries.mockRejectedValue(new Error('unknown field'))
    render(<EntityInfoPageContent />)
    await user.click(await screen.findByText('Edit'))
    expect(
      await screen.findByText('The industry list could not be loaded.')
    ).toBeInTheDocument()
  })

  it('shows an entity’s SIC code without offering to edit it', async () => {
    const user = userEvent.setup()
    mockGetEntity.mockResolvedValue({
      ...entityFor('kg_a'),
      sic: '3674',
      sicDescription: 'Semiconductors',
    })
    render(<EntityInfoPageContent />)
    expect(await screen.findByText('3674 · Semiconductors')).toBeInTheDocument()
    await user.click(screen.getByText('Edit'))
    expect(screen.queryByDisplayValue('3674')).not.toBeInTheDocument()
  })

  it('keeps an industry from before the list unless one is chosen', async () => {
    const user = userEvent.setup()
    mockGetEntity.mockResolvedValue({
      ...entityFor('kg_a'),
      industry: 'Industrial robotics',
    })
    render(<EntityInfoPageContent />)
    expect(await screen.findByText('Industrial robotics')).toBeInTheDocument()

    await user.click(screen.getByText('Edit'))
    expect(screen.getByText(/Currently “Industrial robotics”/)).toBeVisible()
    const nameInput = await screen.findByDisplayValue('Entity kg_a')
    await user.type(nameInput, ' Two')
    await user.click(screen.getByText('Save'))

    await waitFor(() => expect(mockUpdateEntity).toHaveBeenCalledTimes(1))
    expect(mockUpdateEntity).toHaveBeenCalledWith('kg_a', {
      name: 'Entity kg_a Two',
    })
  })

  it('clears a chosen industry', async () => {
    const user = userEvent.setup()
    mockGetEntity.mockResolvedValue({
      ...entityFor('kg_a'),
      industry: 'technology',
    })
    render(<EntityInfoPageContent />)
    await user.click(await screen.findByText('Edit'))
    await user.click(screen.getByText('Clear'))
    await user.click(screen.getByText('Save'))

    await waitFor(() => expect(mockUpdateEntity).toHaveBeenCalledTimes(1))
    expect(mockUpdateEntity).toHaveBeenCalledWith('kg_a', { industry: null })
  })

  it('reads and writes the subsidiary in scope, then re-reads the group', async () => {
    const user = userEvent.setup()
    const sub = {
      id: 'ent_s',
      name: 'Maple Court',
      isParent: false,
      parentEntityId: 'ent_kg_a',
      ownershipPct: 100,
      consolidationMethod: 'full',
      entityRole: 'operating',
      joinedOn: '2026-03-01',
      leftOn: null,
    }
    mockScope.mockReturnValue({
      entityId: 'ent_s',
      entities: [entityFor('kg_a'), sub],
      entity: sub,
      refresh: mockRefresh,
    })
    mockGetEntity.mockResolvedValue({
      ...entityFor('kg_a'),
      ...sub,
      uri: 'https://example.test/sub',
    })
    mockUpdateEntity.mockResolvedValue({ ...entityFor('kg_a'), ...sub })
    render(<EntityInfoPageContent />)

    await waitFor(() =>
      expect(mockGetEntity).toHaveBeenCalledWith('kg_a', { entityId: 'ent_s' })
    )
    expect(await screen.findByText(/Held under/)).toBeInTheDocument()
    expect(screen.getByText('Entity kg_a')).toBeInTheDocument()
    expect(screen.getByText(/100% owned/)).toBeInTheDocument()
    expect(screen.getByText(/consolidated in full/)).toBeInTheDocument()
    expect(screen.getByText(/member since 2026-03/)).toBeInTheDocument()

    await user.click(screen.getByText('Edit'))
    const nameInput = await screen.findByDisplayValue('Maple Court')
    await user.clear(nameInput)
    await user.type(nameInput, 'Maple Court LLC')
    await user.click(screen.getByText('Save'))

    await waitFor(() => expect(mockUpdateEntity).toHaveBeenCalledTimes(1))
    expect(mockUpdateEntity).toHaveBeenCalledWith(
      'kg_a',
      expect.objectContaining({ name: 'Maple Court LLC', entity_id: 'ent_s' })
    )
    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1))
  })

  it('shows a member that has left as former, with its lifecycle card', async () => {
    const gone = {
      id: 'ent_n',
      name: 'Northside Café',
      isParent: false,
      parentEntityId: 'ent_kg_a',
      ownershipPct: 75,
      consolidationMethod: 'full',
      entityRole: 'operating',
      joinedOn: '2025-10-01',
      leftOn: '2026-05-31',
      isFormer: true,
    }
    mockScope.mockReturnValue({
      entityId: 'ent_n',
      entities: [entityFor('kg_a'), gone],
      entity: gone,
      refresh: mockRefresh,
    })
    mockGetEntity.mockResolvedValue({
      ...entityFor('kg_a'),
      ...gone,
      uri: 'https://example.test/north',
    })
    render(<EntityInfoPageContent />)

    expect(await screen.findByText('former member')).toBeInTheDocument()
    expect(screen.getByText(/left 2026-05/)).toBeInTheDocument()
    expect(screen.getByText('Group lifecycle')).toBeInTheDocument()
    expect(screen.getByText('Record the deconsolidation')).toBeInTheDocument()
  })

  it('keeps the recorded figures on screen and re-reads the entity in place', async () => {
    const user = userEvent.setup()
    const bought = {
      id: 'ent_n',
      name: 'Northside Café',
      isParent: false,
      parentEntityId: 'ent_kg_a',
      ownershipPct: 75,
      consolidationMethod: 'full',
      entityRole: 'operating',
      joinedOn: '2025-10-01',
      leftOn: null,
      isFormer: false,
    }
    mockScope.mockReturnValue({
      entityId: 'ent_n',
      entities: [entityFor('kg_a'), bought],
      entity: bought,
      refresh: mockRefresh,
    })
    mockGetEntity.mockResolvedValue({
      ...entityFor('kg_a'),
      ...bought,
      uri: 'https://example.test/north',
    })
    mockRecordAcquisition.mockResolvedValue({
      joined_on: '2025-10-01',
      consideration: 3150000,
      parent_share: 2250000,
      excess: 900000,
      goodwill: 900000,
      noncontrolling_interest: 0,
    })
    render(<EntityInfoPageContent />)

    await user.click(await screen.findByText('Record the acquisition'))
    await user.type(screen.getByLabelText('Price paid ($)'), '31500')
    await user.type(screen.getByLabelText('Basis'), 'Purchase agreement')
    await user.click(screen.getByText('Record'))

    expect(
      await screen.findByText(/Acquisition recorded as a draft/)
    ).toBeInTheDocument()
    expect(screen.getByText(/goodwill \$9,000\.00/)).toBeInTheDocument()
    await waitFor(() => expect(mockGetEntity).toHaveBeenCalledTimes(2))
    expect(screen.queryByTestId('spinner')).not.toBeInTheDocument()
    expect(screen.getByText(/goodwill \$9,000\.00/)).toBeInTheDocument()
    expect(screen.getByText('Edit')).toBeInTheDocument()
  })

  describe('a member of a group that has closed months', () => {
    const member = {
      id: 'ent_s',
      name: 'Maple Court',
      isParent: false,
      parentEntityId: 'ent_kg_a',
      ownershipPct: 100,
      consolidationMethod: 'full',
      entityRole: 'operating',
      joinedOn: '2026-03-01',
      leftOn: null,
    }

    beforeEach(() => {
      mockScope.mockReturnValue({
        entityId: 'ent_s',
        entities: [entityFor('kg_a'), member],
        entity: member,
        refresh: mockRefresh,
      })
      mockGetEntity.mockResolvedValue({ ...entityFor('kg_a'), ...member })
    })

    it('edits the membership dates as dates', async () => {
      const user = userEvent.setup()
      render(<EntityInfoPageContent />)
      await user.click(await screen.findByText('Edit'))

      expect(await screen.findByDisplayValue('2026-03-01')).toHaveAttribute(
        'type',
        'date'
      )
      expect(document.getElementById('left_on')).toHaveAttribute('type', 'date')
    })

    it("shows the server's refusal, never the raw envelope", async () => {
      const user = userEvent.setup()
      mockUpdateEntity.mockRejectedValue(
        new Error(
          'Update entity failed: ' +
            JSON.stringify({
              detail:
                'The group has closed its consolidated months through 2026-09; a change of method from a date is not supported yet.',
            })
        )
      )
      render(<EntityInfoPageContent />)
      await user.click(await screen.findByText('Edit'))
      await user.selectOptions(
        await screen.findByDisplayValue('Consolidated in full'),
        'equity'
      )
      await user.click(screen.getByText('Save'))

      expect(await screen.findByRole('alert')).toHaveTextContent(
        /^The group has closed its consolidated months through 2026-09; a change of method from a date is not supported yet\.$/
      )
    })
  })
})
