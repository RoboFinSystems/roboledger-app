// Pin a negative-UTC-offset zone before importing the module under test.
// Date-only values parse as UTC midnight, so this is the zone class where a
// missing UTC pin renders the previous calendar day.
process.env.TZ = 'America/Los_Angeles'

import { describe, expect, it } from 'vitest'
import {
  formatAddress,
  formatAmount,
  formatDate,
  formatDateTime,
} from '../formatters'

describe('formatDate', () => {
  it('renders a date-only value as the day it names, west of Greenwich', () => {
    // Without the UTC pin this renders "Jan 14, 2026" in this timezone.
    expect(formatDate('2026-01-15')).toBe('Jan 15, 2026')
  })

  it('does not shift a date-only value across a month boundary', () => {
    expect(formatDate('2026-03-01')).toBe('Mar 1, 2026')
    expect(formatDate('2026-01-01')).toBe('Jan 1, 2026')
  })

  it('renders a full timestamp in local time', () => {
    // 08:00 UTC is midnight PST, so this is still the 15th locally.
    expect(formatDate('2026-01-15T08:00:00Z')).toBe('Jan 15, 2026')
    // 04:00 UTC is 8pm PST the previous day — local rendering is intended
    // for real timestamps.
    expect(formatDate('2026-01-15T04:00:00Z')).toBe('Jan 14, 2026')
  })

  it('renders an em dash for missing values', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate(undefined)).toBe('—')
    expect(formatDate('')).toBe('—')
  })
})

describe('formatDateTime', () => {
  it('renders an em dash for missing values', () => {
    expect(formatDateTime(null)).toBe('—')
    expect(formatDateTime(undefined)).toBe('—')
  })

  it('includes a time component', () => {
    expect(formatDateTime('2026-01-15T20:30:00Z')).toContain('2026')
    expect(formatDateTime('2026-01-15T20:30:00Z')).toMatch(/\d:\d{2}/)
  })
})

describe('formatAmount', () => {
  it('treats the input as cents', () => {
    // The wire format is cents; 152550 is $1,525.50, not $152,550.
    expect(formatAmount(152550, 'USD')).toBe('$1,525.50')
    expect(formatAmount(100, 'USD')).toBe('$1.00')
    expect(formatAmount(1, 'USD')).toBe('$0.01')
  })

  it('handles zero and negative amounts', () => {
    expect(formatAmount(0, 'USD')).toBe('$0.00')
    expect(formatAmount(-2500, 'USD')).toBe('-$25.00')
  })

  it('defaults to USD when the currency is missing', () => {
    expect(formatAmount(500, null)).toBe('$5.00')
    expect(formatAmount(500, '')).toBe('$5.00')
  })

  it('renders an em dash for missing amounts, including a real zero', () => {
    expect(formatAmount(null, 'USD')).toBe('—')
    expect(formatAmount(undefined, 'USD')).toBe('—')
    // Guard against a truthiness regression: 0 is a value, not "missing".
    expect(formatAmount(0, 'USD')).not.toBe('—')
  })
})

describe('formatAddress', () => {
  it('returns an em dash for a missing address', () => {
    expect(formatAddress(null)).toBe('—')
    expect(formatAddress(undefined)).toBe('—')
  })
})
