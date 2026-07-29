import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetEntity = vi.fn()
const mockUpdateEntity = vi.fn()

vi.mock('@robosystems/core', () => ({
  customTheme: { card: {}, alert: {}, textInput: {} },
  PageLayout: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  PageHeader: () => <div data-testid="page-header" />,
  useGraphContext: vi.fn(),
  useEntity: vi.fn(),
  clients: {
    ledger: {
      getEntity: (graphId: string) => mockGetEntity(graphId),
      updateEntity: (graphId: string, updates: unknown) =>
        mockUpdateEntity(graphId, updates),
    },
  },
}))

vi.mock('flowbite-react', () => ({
  Alert: ({ children }: any) => <div role="alert">{children}</div>,
  Badge: ({ children }: any) => <span>{children}</span>,
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Card: ({ children }: any) => <div>{children}</div>,
  Label: ({ children }: any) => <label>{children}</label>,
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
})

function setGraph(graphId: string) {
  mockUseGraphContext.mockReturnValue({
    state: { currentGraphId: graphId, graphs: [] },
  } as any)
}

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
    mockUpdateEntity.mockImplementation((graphId: string) =>
      Promise.resolve(entityFor(graphId))
    )
    setGraph('kg_a')
  })

  it('loads the entity for the selected graph', async () => {
    render(<EntityInfoPageContent />)
    await waitFor(() => expect(mockGetEntity).toHaveBeenCalledWith('kg_a'))
    // Read-only view renders values as text; inputs appear only while editing.
    expect(
      await screen.findByText('https://example.test/kg_a')
    ).toBeInTheDocument()
  })

  it('abandons an in-progress edit when the graph changes', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<EntityInfoPageContent />)
    await waitFor(() => expect(mockGetEntity).toHaveBeenCalledWith('kg_a'))

    await user.click(await screen.findByText('Edit'))
    const nameInput = await screen.findByDisplayValue('Entity kg_a')
    await user.clear(nameInput)
    await user.type(nameInput, 'Renamed while on graph A')

    // Switch graphs mid-edit. The form held graph A's values; carrying them
    // over would let a save write them onto graph B's entity.
    setGraph('kg_b')
    rerender(<EntityInfoPageContent />)

    await waitFor(() => expect(mockGetEntity).toHaveBeenCalledWith('kg_b'))
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
    await waitFor(() => expect(mockGetEntity).toHaveBeenCalledWith('kg_a'))

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
})
