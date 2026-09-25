import { ApiError } from '@robosystems/core/lib/sdk-errors'
import { describe, expect, it } from 'vitest'
import { apiErrorMessage, extractDetail, friendlyError } from '../errors'

/** How the SDK facade actually throws: `<label> failed: <JSON.stringify(error)>`. */
const sdkError = (label: string, body: unknown): string =>
  `${label} failed: ${JSON.stringify(body)}`

describe('extractDetail', () => {
  it('unwraps a FastAPI string detail out of the SDK envelope', () => {
    expect(
      extractDetail(sdkError('Block source graph', { detail: 'Boom.' }))
    ).toBe('Boom.')
  })

  it('joins 422 validation lists into one message', () => {
    const raw = sdkError('Share report', {
      detail: [
        { loc: ['body', 'x'], msg: 'field required', type: 'missing' },
        { loc: ['body', 'y'], msg: 'not a string', type: 'type' },
      ],
    })
    expect(extractDetail(raw)).toBe('field required; not a string')
  })

  it('keeps a detail that itself contains braces intact', () => {
    const raw = sdkError('Revoke report share', {
      detail: "Report '{rpt_1}' not found.",
    })
    expect(extractDetail(raw)).toBe("Report '{rpt_1}' not found.")
  })

  it('falls back to the raw string when there is no JSON at all', () => {
    expect(extractDetail('Block source graph failed: empty response')).toBe(
      'Block source graph failed: empty response'
    )
  })

  it('falls back to the raw string when the JSON does not parse', () => {
    const raw = 'Block source graph failed: {not json'
    expect(extractDetail(raw)).toBe(raw)
  })

  it('falls back when the parsed body carries no detail', () => {
    const raw = sdkError('Block source graph', { code: 500 })
    expect(extractDetail(raw)).toBe(raw)
  })
})

describe('friendlyError — pre-existing ledger cases', () => {
  it('links a closed-period rejection to the close page', () => {
    const result = friendlyError(
      sdkError('Approve event', {
        detail: 'Posting date falls in a closed period.',
      })
    )
    expect(result.message).toContain('closed period')
    expect(result.link).toEqual({
      href: '/ledger/close',
      label: 'Open close page',
    })
  })

  it('sends an account missing from the chart of accounts to a sync', () => {
    const result = friendlyError(
      sdkError('Approve event', {
        detail:
          "Event ev_1: 1 element_external_id(s) could not be resolved against source='quickbooks', connection_id='conn_1': '4000' (entry 0).",
      })
    )
    expect(result.message).toBe(
      "Some accounts in this event aren't in RoboLedger's chart of accounts yet. Sync the connection they came from, then try again."
    )
    expect(result.message).not.toMatch(/mapp/i)
    // The match does not read the source, so the copy must not name one.
    expect(result.message).not.toMatch(/quickbooks/i)
    expect(result.link).toEqual({
      href: '/connections',
      label: 'Open Connections',
    })
  })
})

describe('friendlyError — cross-graph share controls', () => {
  it('explains a self-block attempt', () => {
    const result = friendlyError(
      sdkError('Block source graph', { detail: 'A graph cannot block itself.' })
    )
    expect(result.message).toContain("A graph can't block itself")
  })

  it('keeps the admin-required copy but drops its backticks', () => {
    const result = friendlyError(
      sdkError('Block source graph', {
        detail:
          'Purging reports already shared in requires the graph admin role. Block without `purge` to stop further shares.',
      })
    )
    expect(result.message).not.toContain('`')
    expect(result.message).toContain('requires the graph admin role')
  })

  it('handles the other admin-only half — lifting a block', () => {
    const result = friendlyError(
      sdkError('Unblock source graph', {
        detail: 'Lifting a block requires the graph admin role.',
      })
    )
    expect(result.message).toBe(
      'Lifting a block requires the graph admin role.'
    )
  })

  it('points an already-lifted block at the blocked senders list', () => {
    const result = friendlyError(
      sdkError('Unblock source graph', {
        detail: "Graph 'kg1a2b' is not blocked.",
      })
    )
    expect(result.link?.href).toBe('/reports/blocked-senders')
  })

  it('explains a revoke against a recipient that never received it', () => {
    const result = friendlyError(
      sdkError('Revoke report share', {
        detail: "No active share of report 'rpt_1' to 'kg9z'.",
      })
    )
    expect(result.message).toContain('never shared to that recipient')
  })

  it('maps the revoke 403 to a permission explanation', () => {
    const result = friendlyError(
      sdkError('Revoke report share', {
        detail: 'Not authorized to revoke shares of this report.',
      })
    )
    expect(result.message).toContain("don't have permission")
  })

  it('names the admin requirement when deleting a received copy is refused', () => {
    const result = friendlyError(
      sdkError('Delete report', {
        detail: 'Not authorized to delete this report.',
      })
    )
    expect(result.message).toContain('graph admin role')
  })

  it('never leaks the raw JSON envelope for a mapped error', () => {
    const result = friendlyError(
      sdkError('Block source graph', { detail: 'A graph cannot block itself.' })
    )
    expect(result.message).not.toContain('{')
    expect(result.message).not.toContain('failed:')
  })

  it('passes an unrecognized detail through unwrapped rather than raw', () => {
    const result = friendlyError(
      sdkError('Block source graph', { detail: 'Something unexpected.' })
    )
    expect(result.message).toBe('Something unexpected.')
  })
})

describe('friendlyError — chart of accounts', () => {
  it('explains the one-time initialize refusal from the raw SDK envelope', () => {
    const raw =
      'Initialize chart of accounts failed: {"detail":"This graph already has a chart of accounts; a chart is never replaced. Customize it with update-taxonomy-block."}'
    const result = friendlyError(raw)
    expect(result.message).toContain('already has a chart of accounts')
    expect(result.message).toContain('Reload the page')
    expect(result.message).not.toContain('{"detail"')
    expect(result.link).toBeUndefined()
  })
})

describe('nested detail and contention', () => {
  it('unwraps a nested detail.detail', () => {
    expect(
      extractDetail(
        sdkError('Sync', {
          detail: { detail: 'Connection not found', code: 'NOT_FOUND' },
        })
      )
    ).toBe('Connection not found')
  })

  it('turns a 409 row-lock into a retry message', () => {
    expect(
      friendlyError(
        'Event evt_1 is being written by another process (most likely a running sync). Retry in a moment.'
      ).message
    ).toMatch(/wait a moment and try again/i)
  })
})

describe('apiErrorMessage', () => {
  it('maps an ApiError refusal through friendlyError', () => {
    const err = new ApiError({ status: 404, detail: 'Connection not found' })
    expect(apiErrorMessage(err, 'fallback')).toBe('Connection not found')
  })

  it('uses the fallback for a network failure or a detail-less refusal', () => {
    expect(
      apiErrorMessage(
        new ApiError({ status: 0, detail: 'Unable to reach the server' }),
        'fallback'
      )
    ).toBe('fallback')
    expect(
      apiErrorMessage(
        new ApiError({ status: 500, detail: 'Request failed with status 500' }),
        'fallback'
      )
    ).toBe('fallback')
    expect(apiErrorMessage(new TypeError('x is undefined'), 'fallback')).toBe(
      'fallback'
    )
  })
})
