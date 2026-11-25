import { describe, expect, it } from 'vitest'
import {
  codeLabel,
  COUNTRIES,
  einHint,
  formatFiscalYearEnd,
  identifierError,
  US_STATES,
} from '../regions'

describe('regions', () => {
  it('lists the United States first, then countries by name', () => {
    expect(COUNTRIES[0]).toEqual({ value: 'US', label: 'United States' })
    expect(COUNTRIES.length).toBeGreaterThan(240)
    expect(codeLabel(COUNTRIES, 'DE')).toBe('Germany')
  })

  it('names a state by its code and shows a value off the list as stored', () => {
    expect(codeLabel(US_STATES, 'DE')).toBe('Delaware')
    expect(codeLabel(US_STATES, 'Delaware')).toBe('Delaware')
    expect(codeLabel(US_STATES, '')).toBe('')
  })

  it('reads a fiscal year end as a date, anything else as stored', () => {
    expect(formatFiscalYearEnd('12-31')).toBe('December 31')
    expect(formatFiscalYearEnd('02-28')).toBe('February 28')
    expect(formatFiscalYearEnd('December')).toBe('December')
    expect(formatFiscalYearEnd(null)).toBe('')
  })

  it('checks the shapes the server checks', () => {
    expect(identifierError('lei', '5493001kj5x1kjt2j567')).toBe('')
    expect(identifierError('lei', 'ABC')).not.toBe('')
    expect(identifierError('cik', '0000320193')).toBe('')
    expect(identifierError('cik', 'CIK123')).not.toBe('')
    expect(identifierError('cik', '')).toBe('')
  })

  it('hints at the EIN shape without refusing other text', () => {
    expect(einHint('12-3456789')).toBe('')
    expect(einHint('123456789')).toBe('')
    expect(einHint('GB123456789')).not.toBe('')
  })
})
