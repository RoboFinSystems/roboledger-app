'use client'

import {
  DOCUMENT_FILE_ACCEPT,
  documentFileUrl,
  isDocumentFileType,
  uploadDocumentFile,
} from '@/lib/ledger/documents'
import { extractDetail } from '@/lib/ledger/errors'
import { clients } from '@robosystems/core'
import { Button, FileInput, HelperText, Spinner } from 'flowbite-react'
import { type FC, useState } from 'react'
import { HiDocumentText, HiPaperClip } from 'react-icons/hi'

/** The API's own cap on a stored file. */
const MAX_FILE_BYTES = 25 * 1024 * 1024

/** A retracted event's fields can no longer change. */
const RETRACTED = new Set(['voided', 'superseded'])

interface Props {
  graphId: string
  eventId: string
  status: string
  description: string | null
  documentId: string | null
  /** The document changed; re-read the event. */
  onChanged: () => void | Promise<void>
}

const describeError = (err: unknown, fallback: string): string =>
  err instanceof Error ? extractDetail(err.message) : fallback

/**
 * The document an event rests on: the bill, receipt or invoice behind it.
 * Attaching uploads the file and points the event at it; the ledger then
 * refuses to delete that document while the event is live.
 */
const EventDocumentSection: FC<Props> = ({
  graphId,
  eventId,
  status,
  description,
  documentId,
  onChanged,
}) => {
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState<'attach' | 'detach' | 'download' | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)
  const editable = !RETRACTED.has(status)

  const fileProblem = !file
    ? null
    : !isDocumentFileType(file.type)
      ? 'Attach a PDF, PNG or JPEG.'
      : file.size > MAX_FILE_BYTES
        ? 'The file is larger than 25 MB.'
        : null

  const point = async (next: string) => {
    await clients.ledger.updateEventBlock(graphId, {
      event_id: eventId,
      document_id: next,
    })
    await onChanged()
  }

  const handleAttach = async () => {
    if (!file || fileProblem) return
    setBusy('attach')
    setError(null)
    try {
      const id = await uploadDocumentFile(graphId, file, {
        title: description?.trim() || file.name,
      })
      await point(id)
      setFile(null)
    } catch (err) {
      setError(describeError(err, 'The document was not attached.'))
    } finally {
      setBusy(null)
    }
  }

  // The document stays stored; only the event stops citing it.
  const handleDetach = async () => {
    setBusy('detach')
    setError(null)
    try {
      await point('')
    } catch (err) {
      setError(describeError(err, 'The document was not detached.'))
    } finally {
      setBusy(null)
    }
  }

  // Served as an attachment, so pointing the page at it downloads in place.
  const handleDownload = async () => {
    if (!documentId) return
    setBusy('download')
    setError(null)
    try {
      window.location.assign(await documentFileUrl(graphId, documentId))
    } catch (err) {
      setError(describeError(err, 'The document did not download.'))
    } finally {
      setBusy(null)
    }
  }

  if (!documentId && !editable) return null

  return (
    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <div className="mb-2 flex items-center gap-2">
        <HiPaperClip className="h-4 w-4 text-gray-400" />
        <h4 className="font-heading text-sm font-bold text-gray-900 dark:text-white">
          Document
        </h4>
      </div>

      {documentId ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="xs"
            color="light"
            disabled={busy !== null}
            onClick={handleDownload}
          >
            <HiDocumentText className="mr-1 h-4 w-4" />
            Download
          </Button>
          {editable && (
            <Button
              size="xs"
              color="light"
              disabled={busy !== null}
              onClick={handleDetach}
            >
              {busy === 'detach' && <Spinner size="xs" className="mr-1" />}
              Detach
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <FileInput
            id={`event-document-${eventId}`}
            aria-label="Attach a document"
            accept={DOCUMENT_FILE_ACCEPT}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <HelperText>
            {fileProblem ??
              'The bill, receipt or invoice behind this event: a PDF or a photo, up to 25 MB.'}
          </HelperText>
          <Button
            size="xs"
            color="primary"
            disabled={!file || fileProblem !== null || busy !== null}
            onClick={handleAttach}
          >
            {busy === 'attach' && (
              <Spinner size="xs" className="mr-1 text-white" />
            )}
            Attach
          </Button>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}

export default EventDocumentSection
