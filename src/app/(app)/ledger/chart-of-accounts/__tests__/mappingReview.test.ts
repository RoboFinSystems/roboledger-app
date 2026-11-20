import { describe, expect, it } from 'vitest'

import { needsMappingReview } from '../mappingReview'

describe('needsMappingReview', () => {
  it('flags what the auto-map scored below its 0.90 auto-approve line', () => {
    expect(needsMappingReview(0.7)).toBe(true)
    expect(needsMappingReview(0.89)).toBe(true)
  })

  it('leaves auto-approved and hand-made mappings alone', () => {
    expect(needsMappingReview(0.9)).toBe(false)
    expect(needsMappingReview(1)).toBe(false)
    expect(needsMappingReview(null)).toBe(false)
    expect(needsMappingReview(undefined)).toBe(false)
  })
})
