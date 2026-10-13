import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockRecordStatementBalance = vi.fn()
const mockListAccounts = vi.fn()
const mockUploadDocumentFile = vi.fn()

vi.mock('@/lib/ledger/documents', () => ({
  DOCUMENT_FILE_ACCEPT: 'application/pdf,image/png,image/jpeg',
  isDocumentFileType: (type: string) =>
    ['application/pdf', 'image/png', 'image/jpeg'].includes(type),
  uploadDocumentFile: (...args: any[]) => mockUploadDocumentFile(...args),
}))

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      recordStatementBalance: (...args: any[]) =>
        mockRecordStatementBalance(...args),
      listAccounts: (...args: any[]) => mockListAccounts(...args),
    },
  },
}))

// The real Modal renders nothing while hidden, so a reopened dialog has an
// empty file input whatever the component still holds in state.
vi.mock('flowbite-react', () => ({
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
  TextInput: ({ value, onChange, id, type }: any) => (
    <input id={id} type={type} value={value} onChange={onChange} />
  ),
}))

import RecordStatementModal from '../components/RecordStatementModal'

/** Opens and closes the dialog the way the reconciliations panel does. */
const Harness = () => {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>Record statement</button>
      <RecordStatementModal
        graphId="kg1"
        open={open}
        onClose={() => setOpen(false)}
        onRecorded={() => setOpen(false)}
      />
    </>
  )
}

const fill = (account: string, asOf: string, balance: string) => {
  fireEvent.change(screen.getByLabelText('Account'), {
    target: { value: account },
  })
  fireEvent.change(screen.getByLabelText('Statement ending date'), {
    target: { value: asOf },
  })
  fireEvent.change(screen.getByLabelText('Ending balance'), {
    target: { value: balance },
  })
}

const attach = (name: string) =>
  fireEvent.change(screen.getByLabelText('Statement (optional)'), {
    target: {
      files: [new File(['%PDF-1.7'], name, { type: 'application/pdf' })],
    },
  })

const refusedOnce = () =>
  mockRecordStatementBalance
    .mockRejectedValueOnce(
      new Error(
        'Record statement balance failed: {"detail":"Period 2026-07 is closed."}'
      )
    )
    .mockResolvedValue({ structureId: 'struct_card' })

describe('RecordStatementModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListAccounts.mockResolvedValue({
      accounts: [
        { id: 'elem_loan', code: '2100', name: 'Equipment Loan' },
        { id: 'elem_card', code: '2200', name: 'Amex Card' },
      ],
    })
  })

  it('forgets a cancelled statement, so the next balance cites no document', async () => {
    mockUploadDocumentFile.mockResolvedValue('doc_loan_july')
    refusedOnce()
    render(<Harness />)

    fireEvent.click(screen.getByText('Record statement'))
    await screen.findByText('2100 · Equipment Loan')
    fill('elem_loan', '2026-07-31', '4800')
    attach('loan-july.pdf')
    fireEvent.click(screen.getByText('Record balance'))
    expect(
      await screen.findByText('Period 2026-07 is closed.')
    ).toBeInTheDocument()

    fireEvent.click(screen.getByText('Cancel'))
    await waitFor(() =>
      expect(screen.queryByLabelText('Account')).not.toBeInTheDocument()
    )

    fireEvent.click(screen.getByText('Record statement'))
    await screen.findByText('2200 · Amex Card')
    fill('elem_card', '2026-08-31', '350')
    fireEvent.click(screen.getByText('Record balance'))

    await waitFor(() =>
      expect(mockRecordStatementBalance).toHaveBeenCalledTimes(2)
    )
    expect(mockRecordStatementBalance.mock.calls[1][1]).toMatchObject({
      elementId: 'elem_card',
      asOf: '2026-08-31',
      documentId: null,
    })
    expect(mockUploadDocumentFile).toHaveBeenCalledTimes(1)
  })

  it('opens empty after a Cancel', async () => {
    render(<Harness />)

    fireEvent.click(screen.getByText('Record statement'))
    await screen.findByText('2100 · Equipment Loan')
    fill('elem_loan', '2026-07-31', '4800')
    fireEvent.change(screen.getByLabelText('Note (optional)'), {
      target: { value: 'July' },
    })
    fireEvent.click(screen.getByText('Cancel'))

    fireEvent.click(screen.getByText('Record statement'))
    await screen.findByText('2100 · Equipment Loan')
    for (const label of [
      'Account',
      'Statement ending date',
      'Ending balance',
      'Note (optional)',
    ]) {
      expect((screen.getByLabelText(label) as HTMLInputElement).value).toBe('')
    }
  })

  it('uploads the statement again when the account changes after a refusal', async () => {
    mockUploadDocumentFile
      .mockResolvedValueOnce('doc_first')
      .mockResolvedValueOnce('doc_second')
    refusedOnce()
    render(<Harness />)

    fireEvent.click(screen.getByText('Record statement'))
    await screen.findByText('2100 · Equipment Loan')
    fill('elem_loan', '2026-07-31', '4800')
    attach('statement.pdf')
    fireEvent.click(screen.getByText('Record balance'))
    expect(
      await screen.findByText('Period 2026-07 is closed.')
    ).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Account'), {
      target: { value: 'elem_card' },
    })
    fireEvent.click(screen.getByText('Record balance'))

    await waitFor(() =>
      expect(mockRecordStatementBalance).toHaveBeenCalledTimes(2)
    )
    expect(mockUploadDocumentFile).toHaveBeenCalledTimes(2)
    expect(mockUploadDocumentFile.mock.calls[1][2]).toMatchObject({
      title: 'Amex Card statement ending 2026-07-31',
    })
    expect(mockRecordStatementBalance.mock.calls[1][1]).toMatchObject({
      elementId: 'elem_card',
      documentId: 'doc_second',
    })
  })
})
