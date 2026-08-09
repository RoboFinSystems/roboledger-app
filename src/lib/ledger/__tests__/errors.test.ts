import { describe, expect, it } from 'vitest'
import { extractDetail, friendlyError } from '../errors'

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

  it('links an unresolved element to the chart of accounts', () => {
    const result = friendlyError(
      sdkError('Approve event', {
        detail: 'Could not resolve element for account 4000.',
      })
    )
    expect(result.link?.href).toBe('/ledger/chart-of-accounts')
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
