import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListMappings = vi.fn()
const mockGetMappingCoverage = vi.fn()
const mockCreateReport = vi.fn()
const mockPush = vi.fn()

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      listMappings: (...args: any[]) => mockListMappings(...args),
      getMappingCoverage: (...args: any[]) => mockGetMappingCoverage(...args),
      autoMapElements: vi.fn(),
    },
    reports: {
      createReport: (...args: any[]) => mockCreateReport(...args),
    },
    operations: { monitorOperation: vi.fn() },
  },
  PageLayout: ({ children }: any) => <div>{children}</div>,
  PageHeader: ({ title }: any) => <h1>{title}</h1>,
  LoadingState: () => <div role="status" />,
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
  Progress: () => null,
  Spinner: () => null,
  TextInput: (props: any) => <input {...props} />,
  ToggleSwitch: () => null,
}))

const { GRAPH } = vi.hoisted(() => ({ GRAPH: { graphId: 'kg1' } }))
vi.mock('@/lib/useLedgerGraph', () => ({
  useLedgerGraph: () => ({ graph: GRAPH }),
}))
const mockScope = vi.fn((): any => ({
  entityId: null,
  entity: null,
  entities: [],
  parent: null,
}))
const UNSCOPED = { entityId: null, entity: null, entities: [], parent: null }
const PARENT = { id: 'ent_parent', name: 'Harbor Holdings', isParent: true }
const GROUP = {
  id: 'ent_cons',
  name: 'Consolidation Adjustments',
  isParent: false,
  entityRole: 'consolidation',
}
vi.mock('@/lib/entity-scope', () => ({ useEntityScope: () => mockScope() }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

import ReportBuilderContent from '../content'

const generate = async () => {
  const button = await screen.findByRole('button', { name: /Generate Report/ })
  await waitFor(() => expect(button).not.toBeDisabled())
  fireEvent.click(button)
  await waitFor(() => expect(mockCreateReport).toHaveBeenCalledTimes(1))
  return mockCreateReport.mock.calls[0][1]
}

describe('Report builder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockScope.mockReturnValue(UNSCOPED)
    mockListMappings.mockResolvedValue([{ id: 'map_1', name: 'Default' }])
    mockGetMappingCoverage.mockResolvedValue({
      coveragePercent: 100,
      mappedCount: 10,
      totalCoaElements: 10,
      unmappedCount: 0,
    })
    mockCreateReport.mockResolvedValue({ id: 'rpt_1' })
  })

  it('names the parent when the parent is in scope', async () => {
    mockScope.mockReturnValue({ ...UNSCOPED, parent: { id: 'ent_parent' } })
    render(<ReportBuilderContent />)
    await waitFor(() =>
      expect(mockListMappings).toHaveBeenCalledWith('kg1', {
        entityId: 'ent_parent',
      })
    )
  })

  it("offers the subsidiary's own mappings when it is in scope", async () => {
    mockScope.mockReturnValue({
      ...UNSCOPED,
      entityId: 'ent_sub',
      parent: { id: 'ent_parent' },
    })
    render(<ReportBuilderContent />)
    await waitFor(() =>
      expect(mockListMappings).toHaveBeenCalledWith('kg1', {
        entityId: 'ent_sub',
      })
    )
  })

  it("the parent's page builds the group's consolidated report", async () => {
    mockScope.mockReturnValue({
      entityId: null,
      entity: PARENT,
      entities: [PARENT, GROUP],
      parent: PARENT,
    })
    mockListMappings.mockImplementation(
      async (_g: string, { entityId }: { entityId: string }) => [
        { id: `map_${entityId}`, name: 'Default' },
      ]
    )
    render(<ReportBuilderContent />)
    fireEvent.click(await screen.findByText('Consolidated group'))
    await waitFor(() =>
      expect(mockListMappings).toHaveBeenCalledWith('kg1', {
        entityId: 'ent_cons',
      })
    )

    const options = await generate()

    expect(options.entityId).toBe('ent_cons')
    expect(options.mappingId).toBe('map_ent_cons')
  })

  it('the consolidation entity builds the consolidated report', async () => {
    mockScope.mockReturnValue({
      entityId: 'ent_cons',
      entity: GROUP,
      entities: [PARENT, GROUP],
      parent: PARENT,
    })
    render(<ReportBuilderContent />)
    expect(
      await screen.findByText(/consolidated report sums every member/)
    ).toBeInTheDocument()
    expect(screen.queryByText('Consolidated group')).not.toBeInTheDocument()

    const options = await generate()

    expect(options.entityId).toBe('ent_cons')
  })

  // Unset, the SDK labels every report quarterly, whatever its period.
  it.each([
    ['This Month', 'monthly'],
    ['Last Quarter', 'quarterly'],
    ['Monthly YTD', 'monthly'],
    ['Year over Year', 'annual'],
  ])('labels a %s report %s', async (preset, periodType) => {
    render(<ReportBuilderContent />)
    fireEvent.click(await screen.findByText(preset))

    const options = await generate()

    expect(options.periodType).toBe(periodType)
    expect(options.mappingId).toBe('map_1')
  })
})
