import { describe, expect, it } from 'vitest'
import { formatFetchedLabel } from '../relative-time'

const now = new Date('2026-08-22T12:00:00Z')

describe('formatFetchedLabel', () => {
  it('returns null when nothing has been fetched', () => {
    expect(formatFetchedLabel(null, now)).toBeNull()
  })

  it('says just now for under a minute', () => {
    expect(formatFetchedLabel(new Date('2026-08-22T11:59:01Z'), now)).toBe(
      'Fetched just now'
    )
    expect(formatFetchedLabel(now, now)).toBe('Fetched just now')
  })

  it('uses compact minutes and hours', () => {
    expect(formatFetchedLabel(new Date('2026-08-22T11:58:00Z'), now)).toBe(
      'Fetched 2m ago'
    )
    expect(formatFetchedLabel(new Date('2026-08-22T09:00:00Z'), now)).toBe(
      'Fetched 3h ago'
    )
  })

  it('falls back to days past 24h', () => {
    expect(formatFetchedLabel(new Date('2026-08-20T12:00:00Z'), now)).toBe(
      'Fetched 2d ago'
    )
  })

  it('does not go negative when the clock skews', () => {
    expect(formatFetchedLabel(new Date('2026-08-22T12:00:05Z'), now)).toBe(
      'Fetched just now'
    )
  })
})
