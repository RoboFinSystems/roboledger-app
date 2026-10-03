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
    mockListMappings.mockResolvedValue([{ id: 'map_1', name: 'Default' }])
    mockGetMappingCoverage.mockResolvedValue({
      coveragePercent: 100,
      mappedCount: 10,
      totalCoaElements: 10,
      unmappedCount: 0,
    })
    mockCreateReport.mockResolvedValue({ id: 'rpt_1' })
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
