import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetFiscalCalendar = vi.fn()
const mockListReconciliations = vi.fn()
const mockRefreshReconciliations = vi.fn()
const mockSignOffReconciliation = vi.fn()
const mockSetReconciliationPolicy = vi.fn()
const mockRecordStatementBalance = vi.fn()
const mockListAccounts = vi.fn()
const mockUploadDocumentFile = vi.fn()
const mockDocumentFileUrl = vi.fn()

vi.mock('@/lib/ledger/documents', () => ({
  DOCUMENT_FILE_ACCEPT: 'application/pdf,image/png,image/jpeg',
  isDocumentFileType: (type: string) =>
    ['application/pdf', 'image/png', 'image/jpeg'].includes(type),
  uploadDocumentFile: (...args: any[]) => mockUploadDocumentFile(...args),
  documentFileUrl: (...args: any[]) => mockDocumentFileUrl(...args),
}))

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      getFiscalCalendar: (...args: any[]) => mockGetFiscalCalendar(...args),
      listReconciliations: (...args: any[]) => mockListReconciliations(...args),
      refreshReconciliations: (...args: any[]) =>
        mockRefreshReconciliations(...args),
      signOffReconciliation: (...args: any[]) =>
        mockSignOffReconciliation(...args),
      setReconciliationPolicy: (...args: any[]) =>
        mockSetReconciliationPolicy(...args),
      recordStatementBalance: (...args: any[]) =>
        mockRecordStatementBalance(...args),
      listAccounts: (...args: any[]) => mockListAccounts(...args),
    },
  },
  LoadingState: () => (
    <div data-testid="loading-state" role="status">
      Loading
    </div>
  ),
}))

vi.mock('flowbite-react', () => ({
  Badge: ({ children, color }: any) => (
    <span data-badge-color={color}>{children}</span>
  ),
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  FileInput: ({ id, onChange, accept }: any) => (
    <input id={id} type="file" accept={accept} onChange={onChange} />
  ),
  HelperText: ({ children }: any) => <p>{children}</p>,
  Label: ({ children, htmlFor }: any) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
  Modal: ({ children, show }: any) => (show ? <div>{children}</div> : null),
  ModalBody: ({ children }: any) => <div>{children}</div>,
  ModalFooter: ({ children }: any) => <div>{children}</div>,
  ModalHeader: ({ children }: any) => <div>{children}</div>,
  Select: ({ children, onChange, value, id }: any) => (
    <select id={id} onChange={onChange} value={value}>
      {children}
    </select>
  ),
  Spinner: () => <span data-testid="spinner" />,
  Table: ({ children }: any) => <table>{children}</table>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableCell: ({ children }: any) => <td>{children}</td>,
  TableHead: ({ children }: any) => <thead>{children}</thead>,
  TableHeadCell: ({ children }: any) => <th>{children}</th>,
  TableRow: ({ children }: any) => <tr>{children}</tr>,
  TextInput: ({ value, onChange, id, type }: any) => (
    <input id={id} type={type} value={value} onChange={onChange} />
  ),
}))

vi.mock('react-icons/hi', () => ({
  HiDocumentText: () => <span />,
  HiExclamationCircle: () => <span />,
  HiPlus: () => <span />,
  HiRefresh: () => <span />,
}))

import ReconciliationsPanel from '../components/ReconciliationsPanel'

const CALENDAR = {
  closedThrough: '2026-07',
  catchUpSequence: ['2026-08'],
  periods: [{ name: '2026-07' }, { name: '2026-08' }],
}

const rec = (overrides: Record<string, unknown> = {}) => ({
  structureId: 'struct_prepaid',
  name: 'Prepaid Insurance (schedules)',
  scope: 'account',
  method: 'schedule_register',
  elementId: 'elem_prepaid',
  requiredForClose: true,
  materiality: 0,
  period: '2026-08',
  asOf: '2026-08-31',
  status: 'reconciled',
  unreconciledDifference: 0,
  accountsCompared: null,
  accountsDifferent: null,
  ledgerBalance: 400,
  independentBalance: 400,
  balanceAsOf: '2026-08-31',
  components: [
    {
      name: 'Insurance policy',
      amount: 400,
      structureId: 'struct_sched',
      eventId: null,
      documentId: null,
      note: null,
    },
  ],
  source: 'schedules',
  comparedAt: '2026-09-02T08:00:00Z',
  factSetId: 'fs_1',
  comparedBy: 'usr_1',
  comparedVia: 'operation',
  reviewRequired: false,
  separateReviewer: false,
  reviewedBy: null,
  reviewedAt: null,
  selfReviewed: null,
  differences: [],
  ...overrides,
})

const listOf = (...reconciliations: unknown[]) => ({
  period: '2026-08',
  asOf: '2026-08-31',
  notes: [],
  reconciliations,
})

describe('ReconciliationsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetFiscalCalendar.mockResolvedValue(CALENDAR)
    mockListReconciliations.mockResolvedValue(listOf(rec()))
    mockListAccounts.mockResolvedValue({
      accounts: [{ id: 'elem_loan', code: '2100', name: 'Equipment Loan' }],
    })
  })

  it('opens on the next period to close and lists where each check stands', async () => {
    render(<ReconciliationsPanel graphId="kg1" />)

    expect(
      await screen.findByText('Prepaid Insurance (schedules)')
    ).toBeInTheDocument()
    expect(mockListReconciliations).toHaveBeenCalledWith('kg1', '2026-08', {
      entityId: null,
    })
    expect(screen.getByText('Reconciled')).toBeInTheDocument()
    expect(screen.getByText('Against its schedules')).toBeInTheDocument()
  })

  it('marks a comparison the books have moved past as out of date', async () => {
    mockListReconciliations.mockResolvedValue(listOf(rec({ status: 'stale' })))
    render(<ReconciliationsPanel graphId="kg1" />)

    expect(await screen.findByText('Out of date')).toBeInTheDocument()
    expect(screen.queryByText('Sign off')).not.toBeInTheDocument()
  })

  it('says what running them does when nothing has been reconciled', async () => {
    mockListReconciliations.mockResolvedValue(listOf())
    render(<ReconciliationsPanel graphId="kg1" />)

    expect(
      await screen.findByText('Nothing has been reconciled yet.')
    ).toBeInTheDocument()
    expect(
      screen.getByText(/starts holding the period's close/)
    ).toBeInTheDocument()
  })

  it('runs the reconciliations and shows what could not be compared', async () => {
    mockRefreshReconciliations.mockResolvedValue({
      ...listOf(rec({ status: 'unreconciled', unreconciledDifference: 600 })),
      notes: ['Source ledger (QuickBooks) was not compared.'],
    })
    render(<ReconciliationsPanel graphId="kg1" />)
    await screen.findByText('Prepaid Insurance (schedules)')

    fireEvent.click(screen.getByText('Run reconciliations'))

    expect(await screen.findByText('Does not tie')).toBeInTheDocument()
    expect(mockRefreshReconciliations).toHaveBeenCalledWith('kg1', '2026-08', {
      entityId: null,
    })
    expect(
      screen.getByText('Source ledger (QuickBooks) was not compared.')
    ).toBeInTheDocument()
  })

  it('signs off a reconciled period', async () => {
    mockSignOffReconciliation.mockResolvedValue(rec({ status: 'reviewed' }))
    render(<ReconciliationsPanel graphId="kg1" />)

    fireEvent.click(await screen.findByText('Sign off'))

    await waitFor(() =>
      expect(mockSignOffReconciliation).toHaveBeenCalledWith(
        'kg1',
        'struct_prepaid',
        '2026-08'
      )
    )
  })

  it("does not show one period's rows under another while it loads", async () => {
    render(<ReconciliationsPanel graphId="kg1" />)
    await screen.findByText('Sign off')

    // The next period's read never answers.
    mockListReconciliations.mockReturnValue(new Promise(() => {}))
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: '2026-07' },
    })

    await waitFor(() =>
      expect(screen.queryByText('Sign off')).not.toBeInTheDocument()
    )
    expect(mockSignOffReconciliation).not.toHaveBeenCalled()
  })

  it('drops a run that finishes after the period changed', async () => {
    let finishRun: (value: unknown) => void = () => {}
    mockRefreshReconciliations.mockReturnValue(
      new Promise((resolve) => {
        finishRun = resolve
      })
    )
    render(<ReconciliationsPanel graphId="kg1" />)
    await screen.findByText('Prepaid Insurance (schedules)')
    fireEvent.click(screen.getByText('Run reconciliations'))

    mockListReconciliations.mockResolvedValue({
      ...listOf(rec({ name: 'Equipment Loan (statement)', period: '2026-07' })),
      period: '2026-07',
    })
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: '2026-07' },
    })
    await screen.findByText('Equipment Loan (statement)')

    finishRun({
      ...listOf(rec({ status: 'unreconciled' })),
      notes: ['Source ledger (QuickBooks) was not compared.'],
    })

    await waitFor(() =>
      expect(screen.getByText('Run reconciliations')).not.toBeDisabled()
    )
    expect(screen.getByText('Equipment Loan (statement)')).toBeInTheDocument()
    expect(
      screen.queryByText('Source ledger (QuickBooks) was not compared.')
    ).not.toBeInTheDocument()
  })

  it('releases a reconciliation from the close', async () => {
    mockSetReconciliationPolicy.mockResolvedValue({})
    render(<ReconciliationsPanel graphId="kg1" />)

    fireEvent.click(
      await screen.findByLabelText(
        'Prepaid Insurance (schedules) holds the close'
      )
    )

    await waitFor(() =>
      expect(mockSetReconciliationPolicy).toHaveBeenCalledWith(
        'kg1',
        'struct_prepaid',
        { requiredForClose: false }
      )
    )
  })

  it('shows the schedules behind the figure when a row is opened', async () => {
    render(<ReconciliationsPanel graphId="kg1" />)

    fireEvent.click(await screen.findByText('Prepaid Insurance (schedules)'))

    expect(await screen.findByText('Insurance policy')).toBeInTheDocument()
  })

  it('surfaces a refusal from the API in plain words', async () => {
    mockRefreshReconciliations.mockRejectedValue(
      new Error(
        'Refresh reconciliations failed: {"detail":"Nothing to reconcile."}'
      )
    )
    render(<ReconciliationsPanel graphId="kg1" />)
    await screen.findByText('Prepaid Insurance (schedules)')

    fireEvent.click(screen.getByText('Run reconciliations'))

    expect(await screen.findByText('Nothing to reconcile.')).toBeInTheDocument()
  })

  it('records a statement and moves to the period it ends in', async () => {
    mockRecordStatementBalance.mockResolvedValue(
      rec({
        structureId: 'struct_loan',
        name: 'Equipment Loan (statement)',
        method: 'statement',
        period: '2026-07',
      })
    )
    render(<ReconciliationsPanel graphId="kg1" />)
    await screen.findByText('Prepaid Insurance (schedules)')

    fireEvent.click(screen.getByText('Record statement'))
    await screen.findByText('2100 · Equipment Loan')
    fireEvent.change(screen.getByLabelText('Account'), {
      target: { value: 'elem_loan' },
    })
    fireEvent.change(screen.getByLabelText('Statement ending date'), {
      target: { value: '2026-07-31' },
    })
    fireEvent.change(screen.getByLabelText('Ending balance'), {
      target: { value: '4800' },
    })
    fireEvent.click(screen.getByText('Record balance'))

    await waitFor(() =>
      expect(mockRecordStatementBalance).toHaveBeenCalledWith('kg1', {
        elementId: 'elem_loan',
        entityId: null,
        asOf: '2026-07-31',
        balance: 4800,
        documentId: null,
        note: null,
      })
    )
    expect(mockUploadDocumentFile).not.toHaveBeenCalled()
    await waitFor(() =>
      expect(mockListReconciliations).toHaveBeenCalledWith('kg1', '2026-07', {
        entityId: null,
      })
    )
  })

  it("uploads the statement first and records a subsidiary's balance against it", async () => {
    mockUploadDocumentFile.mockResolvedValue('doc_stmt')
    mockRecordStatementBalance.mockResolvedValue(
      rec({
        structureId: 'struct_cash',
        method: 'statement',
        period: '2026-07',
      })
    )
    render(<ReconciliationsPanel graphId="kg1" entityId="ent_rfs" />)
    await screen.findByText('Prepaid Insurance (schedules)')

    fireEvent.click(screen.getByText('Record statement'))
    await screen.findByText('2100 · Equipment Loan')
    fireEvent.change(screen.getByLabelText('Account'), {
      target: { value: 'elem_loan' },
    })
    fireEvent.change(screen.getByLabelText('Statement ending date'), {
      target: { value: '2026-07-31' },
    })
    fireEvent.change(screen.getByLabelText('Ending balance'), {
      target: { value: '4800' },
    })
    const statement = new File(['%PDF-1.7'], 'july.pdf', {
      type: 'application/pdf',
    })
    fireEvent.change(screen.getByLabelText('Statement (optional)'), {
      target: { files: [statement] },
    })
    fireEvent.click(screen.getByText('Record balance'))

    await waitFor(() =>
      expect(mockRecordStatementBalance).toHaveBeenCalledWith('kg1', {
        elementId: 'elem_loan',
        entityId: 'ent_rfs',
        asOf: '2026-07-31',
        balance: 4800,
        documentId: 'doc_stmt',
        note: null,
      })
    )
    expect(mockUploadDocumentFile).toHaveBeenCalledWith('kg1', statement, {
      title: 'Equipment Loan statement ending 2026-07-31',
      tags: ['bank-statement'],
    })
  })

  it('refuses a file type the ledger cannot store', async () => {
    render(<ReconciliationsPanel graphId="kg1" />)
    await screen.findByText('Prepaid Insurance (schedules)')
    fireEvent.click(screen.getByText('Record statement'))
    await screen.findByText('2100 · Equipment Loan')
    fireEvent.change(screen.getByLabelText('Statement (optional)'), {
      target: {
        files: [new File(['x'], 'notes.docx', { type: 'application/msword' })],
      },
    })
    expect(
      await screen.findByText('Attach a PDF, PNG or JPEG.')
    ).toBeInTheDocument()
  })

  it('downloads the statement a reconciliation rests on', async () => {
    mockListReconciliations.mockResolvedValue(
      listOf(
        rec({
          name: 'Operating Checking (statement)',
          method: 'statement',
          components: [
            {
              name: 'Statement ending 2026-08-31',
              amount: 1200,
              structureId: null,
              eventId: 'evt_1',
              documentId: 'doc_stmt',
              note: null,
            },
          ],
        })
      )
    )
    mockDocumentFileUrl.mockResolvedValue('https://files.example/stmt.pdf')
    const assign = vi.fn()
    const location = window.location
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...location, assign },
    })
    render(<ReconciliationsPanel graphId="kg1" />)

    fireEvent.click(await screen.findByText('Operating Checking (statement)'))
    fireEvent.click(await screen.findByText('Download statement'))

    await waitFor(() =>
      expect(assign).toHaveBeenCalledWith('https://files.example/stmt.pdf')
    )
    expect(mockDocumentFileUrl).toHaveBeenCalledWith('kg1', 'doc_stmt')
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: location,
    })
  })
})
