import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockCreateDocumentUpload = vi.fn()
const mockCompleteDocumentUpload = vi.fn()
const mockGetDocumentFile = vi.fn()

vi.mock('@robosystems/client', () => ({
  createDocumentUpload: (...args: unknown[]) =>
    mockCreateDocumentUpload(...args),
  completeDocumentUpload: (...args: unknown[]) =>
    mockCompleteDocumentUpload(...args),
  getDocumentFile: (...args: unknown[]) => mockGetDocumentFile(...args),
}))

import { documentFileUrl, uploadDocumentFile } from '../documents'
import { extractDetail } from '../errors'

const pdf = () =>
  new File(['%PDF-1.7 statement'], 'july.pdf', { type: 'application/pdf' })

describe('uploadDocumentFile', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', fetchMock)
    mockCreateDocumentUpload.mockResolvedValue({
      data: {
        result: { upload_id: 'up_1', upload_url: 'https://s3.example/put' },
      },
    })
    fetchMock.mockResolvedValue({ ok: true, status: 200 })
    mockCompleteDocumentUpload.mockResolvedValue({
      data: { result: { id: 'doc_1' } },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('presigns, puts the bytes with the signed type, then completes', async () => {
    const file = pdf()

    const id = await uploadDocumentFile('kg1', file, { title: 'July' })

    expect(id).toBe('doc_1')
    expect(mockCreateDocumentUpload).toHaveBeenCalledWith({
      path: { graph_id: 'kg1' },
      body: {
        file_name: 'july.pdf',
        content_type: 'application/pdf',
        file_size_bytes: file.size,
      },
    })
    expect(fetchMock).toHaveBeenCalledWith('https://s3.example/put', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/pdf' },
      body: file,
    })
    expect(mockCompleteDocumentUpload).toHaveBeenCalledWith({
      path: { graph_id: 'kg1' },
      body: { upload_id: 'up_1', title: 'July', tags: null },
    })
  })

  it("titles the document with the file's name when none is given", async () => {
    await uploadDocumentFile('kg1', pdf())
    expect(mockCompleteDocumentUpload.mock.calls[0][0].body.title).toBe(
      'july.pdf'
    )
  })

  it('refuses a type the ledger does not store before presigning', async () => {
    const doc = new File(['x'], 'a.docx', { type: 'application/msword' })
    await expect(uploadDocumentFile('kg1', doc)).rejects.toThrow(
      'Only PDF, PNG and JPEG'
    )
    expect(mockCreateDocumentUpload).not.toHaveBeenCalled()
  })

  it('stops when the PUT fails, without making a document', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 403 })
    await expect(uploadDocumentFile('kg1', pdf())).rejects.toThrow('403')
    expect(mockCompleteDocumentUpload).not.toHaveBeenCalled()
  })

  it("throws the API's refusal in the facade's shape", async () => {
    mockCompleteDocumentUpload.mockResolvedValue({
      error: { detail: 'The upload was not found.' },
    })
    const err = await uploadDocumentFile('kg1', pdf()).catch((e) => e)
    expect(extractDetail((err as Error).message)).toBe(
      'The upload was not found.'
    )
  })
})

describe('documentFileUrl', () => {
  it('returns the short-lived link', async () => {
    mockGetDocumentFile.mockResolvedValue({
      data: { download_url: 'https://s3.example/get' },
    })
    await expect(documentFileUrl('kg1', 'doc_1')).resolves.toBe(
      'https://s3.example/get'
    )
    expect(mockGetDocumentFile).toHaveBeenCalledWith({
      path: { graph_id: 'kg1', document_id: 'doc_1' },
    })
  })
})
