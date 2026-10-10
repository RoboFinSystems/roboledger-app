/**
 * Document files: a statement, invoice or receipt stored on the graph.
 *
 * The file goes from the browser straight to a presigned URL, never through
 * the API: presign, PUT the bytes, then complete, which checks them and makes
 * the document. Errors are thrown in the facade's shape
 * (`"<label> failed: <JSON>"`) so `extractDetail` reads them the same way.
 */

import {
  completeDocumentUpload,
  createDocumentUpload,
  getDocumentFile,
} from '@robosystems/client'

/** The types the API stores. Anything else is refused at presign. */
export const DOCUMENT_FILE_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
] as const

export type DocumentFileType = (typeof DOCUMENT_FILE_TYPES)[number]

/** For an `<input type="file" accept>`. */
export const DOCUMENT_FILE_ACCEPT = DOCUMENT_FILE_TYPES.join(',')

export const isDocumentFileType = (type: string): type is DocumentFileType =>
  (DOCUMENT_FILE_TYPES as readonly string[]).includes(type)

const failure = (label: string, error: unknown): Error =>
  new Error(`${label} failed: ${JSON.stringify(error ?? {})}`)

interface EnvelopeResult<T> {
  result?: T | null
}

const resultOf = <T>(label: string, data: unknown): T => {
  const result = (data as EnvelopeResult<T> | undefined)?.result
  if (!result)
    throw failure(label, { detail: 'The response carried no result.' })
  return result
}

export interface UploadDocumentFileOptions {
  /** The document's title; defaults to the file's name. */
  title?: string
  tags?: string[]
}

/** Upload a file and store it as a document. Returns the document's id. */
export async function uploadDocumentFile(
  graphId: string,
  file: File,
  options: UploadDocumentFileOptions = {}
): Promise<string> {
  if (!isDocumentFileType(file.type)) {
    throw failure('Upload', {
      detail: 'Only PDF, PNG and JPEG files can be stored.',
    })
  }

  const presigned = await createDocumentUpload({
    path: { graph_id: graphId },
    body: {
      file_name: file.name,
      content_type: file.type,
      file_size_bytes: file.size,
    },
  })
  if (presigned.error) throw failure('Upload', presigned.error)
  const { upload_id, upload_url } = resultOf<{
    upload_id: string
    upload_url: string
  }>('Upload', presigned.data)

  // The type (and size) are signed into the URL; a PUT of anything else fails.
  const put = await fetch(upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })
  if (!put.ok) {
    throw failure('Upload', {
      detail: `The file did not upload (${put.status}).`,
    })
  }

  const completed = await completeDocumentUpload({
    path: { graph_id: graphId },
    body: {
      upload_id,
      title: options.title?.trim() || file.name,
      tags: options.tags ?? null,
    },
  })
  if (completed.error) throw failure('Upload', completed.error)
  return resultOf<{ id: string }>('Upload', completed.data).id
}

/** A short-lived link to a stored document's file. */
export async function documentFileUrl(
  graphId: string,
  documentId: string
): Promise<string> {
  const res = await getDocumentFile({
    path: { graph_id: graphId, document_id: documentId },
  })
  if (res.error) throw failure('Open document', res.error)
  if (!res.data?.download_url) {
    throw failure('Open document', { detail: 'The response carried no link.' })
  }
  return res.data.download_url
}
