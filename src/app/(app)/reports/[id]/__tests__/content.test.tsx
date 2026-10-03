import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetReportPackage = vi.fn()
const mockTransitionFilingStatus = vi.fn()
const mockDeleteReport = vi.fn()
const mockFileReport = vi.fn()
const mockRegenerateReport = vi.fn()
const mockListPublishLists = vi.fn()
const mockPush = vi.fn()
// How many times the holon view mounted: it loads its own copy once per mount.
const holon = { mounts: 0 }

vi.mock('@robosystems/core', () => ({
  clients: {
    reports: {
      getReportPackage: (...args: any[]) => mockGetReportPackage(...args),
      transitionFilingStatus: (...args: any[]) =>
        mockTransitionFilingStatus(...args),
      deleteReport: (...args: any[]) => mockDeleteReport(...args),
      fileReport: (...args: any[]) => mockFileReport(...args),
      regenerateReport: (...args: any[]) => mockRegenerateReport(...args),
      listPublishLists: (...args: any[]) => mockListPublishLists(...args),
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
  // The dismiss button stands in for Escape or a backdrop click.
  Modal: ({ children, show, onClose }: any) =>
    show ? (
      <div data-testid="modal">
        <button aria-label="dismiss dialog" onClick={onClose} />
        {children}
      </div>
    ) : null,
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
vi.mock('../components/HolonReportView', () => ({
  default: function HolonStub() {
    useEffect(() => {
      holon.mounts += 1
    }, [])
    return <div data-testid="holon-view" />
  },
}))
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
    holon.mounts = 0
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

  it('shows no draft actions to someone who is not the author', async () => {
    await renderWith({ filingStatus: 'draft', createdBy: 'usr_other' })
    expect(screen.queryByRole('button', { name: 'File report' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Regenerate' })).toBeNull()
    expect(
      screen.queryByRole('button', { name: 'Mark under review' })
    ).toBeNull()
  })

  it('files a draft behind a confirm, and the badge follows', async () => {
    mockFileReport.mockResolvedValue({
      filing_status: 'filed',
      filed_at: '2026-10-03T12:00:00Z',
      filed_by: 'usr_author',
    })
    await renderWith({ filingStatus: 'draft' })
    // The page reloads the package once the report is filed.
    mockGetReportPackage.mockResolvedValue(
      pkg({
        filingStatus: 'filed',
        filedAt: '2026-10-03T12:00:00Z',
        filedBy: 'usr_author',
      })
    )

    fireEvent.click(screen.getByRole('button', { name: 'File report' }))
    expect(screen.getByText('File this report?')).toBeInTheDocument()
    expect(mockFileReport).not.toHaveBeenCalled()

    const confirm = screen.getAllByRole('button', { name: 'File report' })
    fireEvent.click(confirm[confirm.length - 1])

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Archive' })
      ).toBeInTheDocument()
    )
    expect(mockFileReport).toHaveBeenCalledWith('kg_mine', 'rpt_1')
    expect(screen.getByText('Filed')).toBeInTheDocument()
    expect(screen.getByText(/Filed Oct 3, 2026 by you/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'File report' })).toBeNull()
  })

  it.each(['generating', 'pending', 'failed'])(
    'does not offer File while generation is %s',
    async (generationStatus) => {
      await renderWith({ filingStatus: 'draft', generationStatus })
      expect(screen.queryByRole('button', { name: 'File report' })).toBeNull()
    }
  )

  it.each(['filed', 'archived'])(
    'offers neither File nor Regenerate on a %s report',
    async (filingStatus) => {
      await renderWith({ filingStatus })
      expect(screen.queryByRole('button', { name: 'File report' })).toBeNull()
      expect(screen.queryByRole('button', { name: 'Regenerate' })).toBeNull()
    }
  )

  const confirmRegenerate = () => {
    fireEvent.click(screen.getByRole('button', { name: 'Regenerate' }))
    const confirm = screen.getAllByRole('button', { name: 'Regenerate' })
    fireEvent.click(confirm[confirm.length - 1])
  }

  it('regenerates behind a confirm and shows the rebuilt package', async () => {
    mockRegenerateReport.mockResolvedValue({ id: 'rpt_1' })
    await renderWith({ filingStatus: 'draft' })
    expect(mockGetReportPackage).toHaveBeenCalledTimes(1)
    mockGetReportPackage.mockResolvedValue(
      pkg({ filingStatus: 'draft', name: 'FY2025 Annual (rebuilt)' })
    )

    fireEvent.click(screen.getByRole('button', { name: 'Regenerate' }))
    expect(screen.getByText('Regenerate this report?')).toBeInTheDocument()
    expect(mockRegenerateReport).not.toHaveBeenCalled()

    const confirm = screen.getAllByRole('button', { name: 'Regenerate' })
    fireEvent.click(confirm[confirm.length - 1])

    // The page shows the reloaded package, not the one it had.
    expect(
      await screen.findByRole('heading', { name: 'FY2025 Annual (rebuilt)' })
    ).toBeInTheDocument()
    expect(mockRegenerateReport).toHaveBeenCalledWith('kg_mine', 'rpt_1')
    expect(screen.queryByText('Regenerate this report?')).toBeNull()
  })

  it('loads the holon view again after a regenerate', async () => {
    mockRegenerateReport.mockResolvedValue({ id: 'rpt_1' })
    await renderWith({ filingStatus: 'draft' })
    fireEvent.click(screen.getByRole('button', { name: 'Holon' }))
    await waitFor(() => expect(holon.mounts).toBe(1))

    confirmRegenerate()

    // Its copy is the pre-regeneration one, so it has to mount afresh.
    await waitFor(() => expect(holon.mounts).toBe(2))
  })

  it('does not call a regenerate failed when only the reload failed', async () => {
    mockRegenerateReport.mockResolvedValue({ id: 'rpt_1' })
    await renderWith({ filingStatus: 'draft' })
    mockGetReportPackage.mockRejectedValue(new Error('network'))

    confirmRegenerate()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('The report was regenerated')
    expect(alert).toHaveTextContent('Refresh the page')
    expect(screen.queryByText('Regenerate this report?')).toBeNull()
  })

  it('says so when the reload after a regenerate comes back empty', async () => {
    mockRegenerateReport.mockResolvedValue({ id: 'rpt_1' })
    await renderWith({ filingStatus: 'draft' })
    mockGetReportPackage.mockResolvedValue(null)

    confirmRegenerate()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('The report was regenerated')
    expect(alert).toHaveTextContent('Refresh the page')
    // The report it had stays on screen.
    expect(screen.getByText('FY2025 Annual')).toBeInTheDocument()
  })

  it('cannot be dismissed while the request is in flight', async () => {
    let finish: (value: unknown) => void = () => {}
    mockRegenerateReport.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve
      })
    )
    await renderWith({ filingStatus: 'draft' })

    confirmRegenerate()
    await waitFor(() => expect(mockRegenerateReport).toHaveBeenCalled())
    // Escape or a backdrop click mid-request: the dialog stays.
    const dismissals = screen.getAllByRole('button', { name: 'dismiss dialog' })
    fireEvent.click(dismissals[dismissals.length - 1])
    expect(screen.getByText('Regenerate this report?')).toBeInTheDocument()

    finish({ id: 'rpt_1' })
    await waitFor(() =>
      expect(screen.queryByText('Regenerate this report?')).toBeNull()
    )
  })

  it('can be dismissed before anything is sent', async () => {
    await renderWith({ filingStatus: 'draft' })
    fireEvent.click(screen.getByRole('button', { name: 'File report' }))
    expect(screen.getByText('File this report?')).toBeInTheDocument()

    const dismissals = screen.getAllByRole('button', { name: 'dismiss dialog' })
    fireEvent.click(dismissals[dismissals.length - 1])

    expect(screen.queryByText('File this report?')).toBeNull()
    expect(mockFileReport).not.toHaveBeenCalled()
  })

  it('reloads the package after filing, so the page shows what was filed', async () => {
    mockFileReport.mockResolvedValue({
      filing_status: 'filed',
      filed_at: '2026-10-03T12:00:00Z',
      filed_by: 'usr_author',
    })
    await renderWith({ filingStatus: 'draft' })
    mockGetReportPackage.mockResolvedValue(
      pkg({
        filingStatus: 'filed',
        filedAt: '2026-10-03T12:00:00Z',
        filedBy: 'usr_author',
        name: 'FY2025 Annual (as filed)',
      })
    )

    fireEvent.click(screen.getByRole('button', { name: 'File report' }))
    const confirm = screen.getAllByRole('button', { name: 'File report' })
    fireEvent.click(confirm[confirm.length - 1])

    expect(
      await screen.findByRole('heading', { name: 'FY2025 Annual (as filed)' })
    ).toBeInTheDocument()
    expect(screen.getByText('Filed')).toBeInTheDocument()
  })

  it('keeps the filed status when the reload after filing fails', async () => {
    mockFileReport.mockResolvedValue({
      filing_status: 'filed',
      filed_at: '2026-10-03T12:00:00Z',
      filed_by: 'usr_author',
    })
    await renderWith({ filingStatus: 'draft' })
    mockGetReportPackage.mockRejectedValue(new Error('network'))

    fireEvent.click(screen.getByRole('button', { name: 'File report' }))
    const confirm = screen.getAllByRole('button', { name: 'File report' })
    fireEvent.click(confirm[confirm.length - 1])

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Archive' })
      ).toBeInTheDocument()
    )
    expect(screen.getByText('Filed')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('says filing cannot be undone and does not update shared copies', async () => {
    await renderWith({ filingStatus: 'draft' })
    fireEvent.click(screen.getByRole('button', { name: 'File report' }))

    const dialog = screen.getByText('File this report?').parentElement!
    expect(dialog).toHaveTextContent('cannot be undone')
    expect(dialog).toHaveTextContent('share again after filing')
  })

  it('surfaces a refused regenerate and keeps the report on screen', async () => {
    mockRegenerateReport.mockRejectedValue(new Error('Not authorized'))
    await renderWith({ filingStatus: 'draft' })

    fireEvent.click(screen.getByRole('button', { name: 'Regenerate' }))
    const confirm = screen.getAllByRole('button', { name: 'Regenerate' })
    fireEvent.click(confirm[confirm.length - 1])

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(mockGetReportPackage).toHaveBeenCalledTimes(1)
    expect(screen.getByText('FY2025 Annual')).toBeInTheDocument()
  })

  it('moves a draft under review and back', async () => {
    mockTransitionFilingStatus.mockResolvedValueOnce({
      filing_status: 'under_review',
    })
    await renderWith({ filingStatus: 'draft' })

    fireEvent.click(screen.getByRole('button', { name: 'Mark under review' }))
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Return to draft' })
      ).toBeInTheDocument()
    )
    expect(mockTransitionFilingStatus).toHaveBeenCalledWith(
      'kg_mine',
      'rpt_1',
      'under_review'
    )

    mockTransitionFilingStatus.mockResolvedValueOnce({ filing_status: 'draft' })
    fireEvent.click(screen.getByRole('button', { name: 'Return to draft' }))
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Mark under review' })
      ).toBeInTheDocument()
    )
    expect(mockTransitionFilingStatus).toHaveBeenLastCalledWith(
      'kg_mine',
      'rpt_1',
      'draft'
    )
  })

  it.each([
    ['draft', 'Draft'],
    ['under_review', 'Under Review'],
  ])(
    'warns before sharing a %s report that recipients see it unfiled',
    async (filingStatus, label) => {
      mockListPublishLists.mockResolvedValue([])
      await renderWith({ filingStatus })

      fireEvent.click(screen.getByRole('button', { name: 'Share' }))

      await waitFor(() =>
        expect(screen.getByText('No publish lists yet.')).toBeInTheDocument()
      )
      expect(screen.getByRole('alert')).toHaveTextContent(
        `recipients will see it marked ${label}`
      )
    }
  )

  it('shares a filed report without the warning', async () => {
    mockListPublishLists.mockResolvedValue([])
    await renderWith({ filingStatus: 'filed' })

    fireEvent.click(screen.getByRole('button', { name: 'Share' }))

    await waitFor(() =>
      expect(screen.getByText('No publish lists yet.')).toBeInTheDocument()
    )
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('surfaces a refused transition instead of changing the badge', async () => {
    mockTransitionFilingStatus.mockRejectedValue(new Error('Not authorized'))
    await renderWith({ filingStatus: 'filed' })

    fireEvent.click(screen.getByRole('button', { name: 'Archive' }))

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByText('Filed')).toBeInTheDocument()
  })
})
