import { describe, expect, it } from 'vitest'
import { arcTypeColor, classificationColor } from '../colors'

describe('classificationColor', () => {
  it.each([
    ['asset', 'success'],
    ['contraAsset', 'success'],
    ['liability', 'failure'],
    ['contraLiability', 'failure'],
    ['equity', 'purple'],
    ['contraEquity', 'purple'],
    ['temporaryEquity', 'purple'],
    ['revenue', 'info'],
    ['expenseReversal', 'info'],
    ['gain', 'info'],
    ['expense', 'warning'],
    ['loss', 'warning'],
    ['comprehensiveIncome', 'indigo'],
    ['investmentByOwners', 'indigo'],
    ['distributionToOwners', 'indigo'],
    ['metric', 'pink'],
  ])('maps %s → %s', (input, expected) => {
    expect(classificationColor(input)).toBe(expected)
  })

  it('falls back to gray for unknown classifications', () => {
    expect(classificationColor('')).toBe('gray')
    expect(classificationColor('unknown')).toBe('gray')
  })
})

describe('arcTypeColor', () => {
  it.each([
    ['equivalence', 'info'],
    ['general-special', 'purple'],
    ['essence-alias', 'indigo'],
  ])('maps %s → %s', (input, expected) => {
    expect(arcTypeColor(input)).toBe(expected)
  })

  it('falls back to gray for unknown arc types', () => {
    expect(arcTypeColor('')).toBe('gray')
    expect(arcTypeColor('subset')).toBe('gray')
  })
})
