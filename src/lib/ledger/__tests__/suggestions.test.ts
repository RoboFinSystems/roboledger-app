import { describe, expect, it } from 'vitest'

import {
  isSuggestionSource,
  suggestionSourceLabel,
  suggestionSourceOf,
} from '../suggestions'

describe('suggestion sources', () => {
  it('knows the three sources the server writes', () => {
    expect(suggestionSourceOf({ suggestion_source: 'open_item' })).toBe(
      'open_item'
    )
    expect(suggestionSourceLabel('agent_default')).toBe('Learned')
    expect(suggestionSourceLabel('tier0')).toBe('Bank category')
  })

  it('reads a source the server never writes as no suggestion source', () => {
    expect(isSuggestionSource('ai')).toBe(false)
    expect(suggestionSourceOf({ suggestion_source: 'ai' })).toBeNull()
  })
})
