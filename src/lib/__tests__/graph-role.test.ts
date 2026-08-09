import type { GraphInfo } from '@robosystems/client'
import { describe, expect, it } from 'vitest'
import { isGraphAdmin, roleAtLeast } from '../graph-role'

const graph = (graphId: string, role: string): GraphInfo =>
  ({ graphId, role }) as GraphInfo

describe('roleAtLeast', () => {
  it('ranks viewer < member < admin', () => {
    expect(roleAtLeast('admin', 'admin')).toBe(true)
    expect(roleAtLeast('member', 'admin')).toBe(false)
    expect(roleAtLeast('viewer', 'admin')).toBe(false)
    expect(roleAtLeast('admin', 'member')).toBe(true)
    expect(roleAtLeast('member', 'member')).toBe(true)
    expect(roleAtLeast('viewer', 'member')).toBe(false)
  })

  it('accepts role casing the platform may vary', () => {
    expect(roleAtLeast('ADMIN', 'admin')).toBe(true)
  })

  it('denies unknown, empty, and missing roles', () => {
    expect(roleAtLeast('owner', 'admin')).toBe(false)
    expect(roleAtLeast('', 'admin')).toBe(false)
    expect(roleAtLeast(null, 'admin')).toBe(false)
    expect(roleAtLeast(undefined, 'admin')).toBe(false)
  })
})

describe('isGraphAdmin', () => {
  const graphs = [graph('kg_a', 'admin'), graph('kg_b', 'member')]

  it('reads the role off the matching graph, not the first one', () => {
    expect(isGraphAdmin(graphs, 'kg_a')).toBe(true)
    expect(isGraphAdmin(graphs, 'kg_b')).toBe(false)
  })

  it('denies when the graph is absent from the context', () => {
    expect(isGraphAdmin(graphs, 'kg_missing')).toBe(false)
  })

  it('denies while the context is still empty or the graph unresolved', () => {
    expect(isGraphAdmin(null, 'kg_a')).toBe(false)
    expect(isGraphAdmin(undefined, 'kg_a')).toBe(false)
    expect(isGraphAdmin([], 'kg_a')).toBe(false)
    expect(isGraphAdmin(graphs, null)).toBe(false)
    expect(isGraphAdmin(graphs, undefined)).toBe(false)
  })
})
