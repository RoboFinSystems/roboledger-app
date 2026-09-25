import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetReportPackage = vi.fn()
const mockTransitionFilingStatus = vi.fn()
const mockDeleteReport = vi.fn()
const mockPush = vi.fn()

vi.mock('@robosystems/core', () => ({
  clients: {
    reports: {
      getReportPackage: (...args: any[]) => mockGetReportPackage(...args),
      transitionFilingStatus: (...args: any[]) =>
        mockTransitionFilingStatus(...args),
      deleteReport: (...args: any[]) => mockDeleteReport(...args),
      listPublishLists: vi.fn(),
      getReportDownloadUrl: vi.fn(),
      shareReport: vi.fn(),
    },
  },
  useGraphContext: () => ({ state: { graphs: [], currentGraphId: 'kg_mine' } }),
  useUser: () => ({ user: { id: 'usr_author' } }),
  PageLayout: ({ children }: any) => <div>{children}</div>,
  PageHeader: ({ title, actions }: any) => (
    <div>
      <h1>{title}</h1>
      {actions}
    </div>
  ),
  LoadingState: () => <div role="status" />,
  EmptyState: ({ title }: any) => <div>{title}</div>,
  ReportChat: () => null,
}))

vi.mock('flowbite-react', () => ({
  Alert: ({ children }: any) => <div role="alert">{children}</div>,
  Badge: ({ children }: any) => <span data-testid="badge">{children}</span>,
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Card: ({ children }: any) => <div>{children}</div>,
  Dropdown: ({ children }: any) => <div data-testid="menu">{children}</div>,
  DropdownDivider: () => <hr />,
  DropdownHeader: ({ children }: any) => <div>{children}</div>,
  DropdownItem: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
  Label: ({ children }: any) => <label>{children}</label>,
  Modal: ({ children, show }: any) =>
    show ? <div data-testid="modal">{children}</div> : null,
  ModalBody: ({ children }: any) => <div>{children}</div>,
  ModalFooter: ({ children }: any) => <div>{children}</div>,
  ModalHeader: ({ children }: any) => <div>{children}</div>,
  Spinner: () => <span role="status" />,
}))

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'rpt_1' }),
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams('graph=kg_mine'),
}))
vi.mock('next/link', () => ({ default: ({ children }: any) => children }))
vi.mock('@/lib/graph-role', () => ({ isGraphAdmin: () => false }))
vi.mock('@/lib/reports/chat', () => ({
  reportAnchorNote: () => '',
  reportExampleQuestions: () => [],
  reportFocus: () => '',
}))
vi.mock('../../../ledger/close/components/blockview/BlockView', () => ({
  default: () => null,
}))
vi.mock('../../../ledger/close/components/ViewModeToggle', () => ({
  default: () => null,
}))
vi.mock('../components/BlockSenderModal', () => ({ default: () => null }))
vi.mock('../components/HolonReportView', () => ({ default: () => null }))
vi.mock('../components/ManageSharesModal', () => ({ default: () => null }))
vi.mock('../components/ReportPackageSidebar', () => ({ default: () => null }))

import ReportViewerContent from '../content'

const pkg = (overrides: Record<string, unknown> = {}) => ({
  id: 'rpt_1',
  name: 'FY2025 Annual',
  filingStatus: 'filed',
  generationStatus: 'published',
  periodType: 'annual',
  periodStart: '2025-01-01',
  periodEnd: '2025-12-31',
  filedAt: null,
  filedBy: null,
  createdBy: 'usr_author',
  sourceGraphId: null,
  entityName: null,
  sharedAt: null,
  items: [],
  ...overrides,
})

const renderWith = async (overrides: Record<string, unknown> = {}) => {
  mockGetReportPackage.mockResolvedValue(pkg(overrides))
  render(<ReportViewerContent />)
  await waitFor(() =>
    expect(screen.getByText('FY2025 Annual')).toBeInTheDocument()
  )
}

describe('Report filing actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    globalThis.IntersectionObserver = class {
      observe() {}
      disconnect() {}
    } as any
  })

  it('offers Archive on a filed report, never Delete', async () => {
    await renderWith({ filingStatus: 'filed' })
    expect(screen.getByRole('button', { name: 'Archive' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete report' })).toBeNull()
  })

  it('archives, and the badge follows', async () => {
    mockTransitionFilingStatus.mockResolvedValue({ filing_status: 'archived' })
    await renderWith({ filingStatus: 'filed' })

    fireEvent.click(screen.getByRole('button', { name: 'Archive' }))

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Unarchive' })
      ).toBeInTheDocument()
    )
    expect(mockTransitionFilingStatus).toHaveBeenCalledWith(
      'kg_mine',
      'rpt_1',
      'archived'
    )
    expect(screen.getByText('Archived')).toBeInTheDocument()
  })

  it('unarchives an archived report back to filed', async () => {
    mockTransitionFilingStatus.mockResolvedValue({ filing_status: 'filed' })
    await renderWith({ filingStatus: 'archived' })

    fireEvent.click(screen.getByRole('button', { name: 'Unarchive' }))

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Archive' })
      ).toBeInTheDocument()
    )
    expect(mockTransitionFilingStatus).toHaveBeenCalledWith(
      'kg_mine',
      'rpt_1',
      'filed'
    )
  })

  it.each(['draft', 'under_review'])(
    'offers Delete on a %s report, behind a confirm',
    async (filingStatus) => {
      mockDeleteReport.mockResolvedValue({ deleted: true })
      await renderWith({ filingStatus })
      expect(screen.queryByRole('button', { name: 'Archive' })).toBeNull()

      fireEvent.click(screen.getByRole('button', { name: 'Delete report' }))
      expect(screen.getByText('Delete this report?')).toBeInTheDocument()
      expect(mockDeleteReport).not.toHaveBeenCalled()

      const confirm = screen.getAllByRole('button', { name: 'Delete report' })
      fireEvent.click(confirm[confirm.length - 1])

      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/reports'))
      expect(mockDeleteReport).toHaveBeenCalledWith('kg_mine', 'rpt_1')
    }
  )

  it('shows no filing actions to someone who is not the author', async () => {
    await renderWith({ filingStatus: 'filed', createdBy: 'usr_other' })
    expect(screen.queryByRole('button', { name: 'Archive' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Delete report' })).toBeNull()
  })

  it('surfaces a refused transition instead of changing the badge', async () => {
    mockTransitionFilingStatus.mockRejectedValue(new Error('Not authorized'))
    await renderWith({ filingStatus: 'filed' })

    fireEvent.click(screen.getByRole('button', { name: 'Archive' }))

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByText('Filed')).toBeInTheDocument()
  })
})
