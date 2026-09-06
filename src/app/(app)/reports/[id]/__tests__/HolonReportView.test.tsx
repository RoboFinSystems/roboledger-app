import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetReportDownloadUrl = vi.fn()
const mockParseReportDocument = vi.fn()

vi.mock('@robosystems/core', () => ({
  clients: {
    reports: {
      getReportDownloadUrl: (...args: any[]) =>
        mockGetReportDownloadUrl(...args),
    },
  },
}))

vi.mock('@robosystems/report-components', () => ({
  ReportView: ({ report }: any) => (
    <div data-testid="report-view">{report.entity?.name}</div>
  ),
  reportSections: (report: any) =>
    report.informationBlocks.map((b: any) => ({ id: b.id, title: b.title })),
  sliceReportSection: (report: any) => report,
}))

vi.mock('@robosystems/report-components/adapters', () => ({
  parseReportDocument: (...args: any[]) => mockParseReportDocument(...args),
}))

vi.mock('flowbite-react', () => ({
  Alert: ({ children }: any) => <div data-testid="alert">{children}</div>,
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
  Spinner: () => <span role="status" />,
}))

import HolonReportView from '../components/HolonReportView'

/**
 * The renderer's load path, not the parser: the Tavi is asked for first, the
 * holon only when the Tavi is not available, and a report that does not exist
 * ends the search. The SDK resolves to null only for a missing report; a
 * flavor that is not materialized arrives as a thrown error.
 */
const PARSED = {
  format: 'tavi',
  report: {
    entity: { name: 'Cascade Advisory Group LLC' },
    informationBlocks: [{ id: 'bs', title: 'Balance Sheet' }],
  },
}

const formatsRequested = () =>
  mockGetReportDownloadUrl.mock.calls.map((call) => call[2]?.format)

describe('HolonReportView', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    mockGetReportDownloadUrl.mockReset()
    mockParseReportDocument.mockReset()
    mockParseReportDocument.mockResolvedValue(PARSED)
    globalThis.fetch = vi.fn(async (_url: any, init: any) => {
      const { url } = JSON.parse(init.body)
      return new Response(`{"from":"${url}"}`, { status: 200 })
    }) as any
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('renders from the Tavi and never asks for the holon', async () => {
    mockGetReportDownloadUrl.mockResolvedValue({
      downloadUrl: 'https://s3/tavi',
    })

    render(<HolonReportView graphId="kg_1" reportId="rpt_1" published />)

    await waitFor(() => expect(screen.getByTestId('report-view')).toBeTruthy())
    expect(formatsRequested()).toEqual(['TAVI'])
    expect(mockParseReportDocument).toHaveBeenCalledWith(
      '{"from":"https://s3/tavi"}'
    )
  })

  it('falls back to the holon when the Tavi is not available', async () => {
    mockGetReportDownloadUrl
      .mockRejectedValueOnce(new Error('REPORT_BUNDLE_NOT_AVAILABLE'))
      .mockResolvedValueOnce({ downloadUrl: 'https://s3/holon' })

    render(<HolonReportView graphId="kg_1" reportId="rpt_1" published />)

    await waitFor(() => expect(screen.getByTestId('report-view')).toBeTruthy())
    expect(formatsRequested()).toEqual(['TAVI', 'HOLON_JSONLD'])
    expect(mockParseReportDocument).toHaveBeenCalledWith(
      '{"from":"https://s3/holon"}'
    )
  })

  it('stops at a report that does not exist without trying the holon', async () => {
    mockGetReportDownloadUrl.mockResolvedValue(null)

    render(<HolonReportView graphId="kg_1" reportId="rpt_1" published />)

    await waitFor(() =>
      expect(screen.getByTestId('alert').textContent).toContain(
        'Report not found.'
      )
    )
    expect(formatsRequested()).toEqual(['TAVI'])
    expect(mockParseReportDocument).not.toHaveBeenCalled()
  })

  it('reports the holon’s failure when both flavors fail', async () => {
    mockGetReportDownloadUrl
      .mockRejectedValueOnce(new Error('tavi is out'))
      .mockRejectedValueOnce(new Error('holon is out too'))

    render(<HolonReportView graphId="kg_1" reportId="rpt_1" published />)

    await waitFor(() =>
      expect(screen.getByTestId('alert').textContent).toContain(
        'holon is out too'
      )
    )
    expect(formatsRequested()).toEqual(['TAVI', 'HOLON_JSONLD'])
  })

  it('surfaces a proxy rejection rather than parsing the error body', async () => {
    mockGetReportDownloadUrl.mockResolvedValue({
      downloadUrl: 'https://s3/tavi',
    })
    globalThis.fetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            error: 'URL is not an allowed report artifact URL',
          }),
          {
            status: 400,
          }
        )
    ) as any

    render(<HolonReportView graphId="kg_1" reportId="rpt_1" published />)

    await waitFor(() =>
      expect(screen.getByTestId('alert').textContent).toContain(
        'not an allowed report artifact URL'
      )
    )
    expect(mockParseReportDocument).not.toHaveBeenCalled()
  })

  it('does nothing for an unpublished report', () => {
    render(
      <HolonReportView graphId="kg_1" reportId="rpt_1" published={false} />
    )

    expect(
      screen.getByText(/generated once the report is published/)
    ).toBeTruthy()
    expect(mockGetReportDownloadUrl).not.toHaveBeenCalled()
  })
})
