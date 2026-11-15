import { describe, expect, it } from 'vitest'
import { keptEntityOf } from '../keptEntity'

const parent = { id: 'ent_parent', name: 'Harbor Holdings' }
const sub = { id: 'ent_sub', name: 'Maple Court LLC' }
const entities = [parent, sub]

describe('keptEntityOf', () => {
  it('is the parent for a connection that names none, or names it', () => {
    const asParent = { entityId: null, name: 'Harbor Holdings' }
    expect(keptEntityOf({}, entities, parent)).toEqual(asParent)
    expect(keptEntityOf({ entity_id: 'ent_parent' }, entities, parent)).toEqual(
      asParent
    )
  })

  it('names the subsidiary a connection keeps the books of', () => {
    expect(keptEntityOf({ entity_id: 'ent_sub' }, entities, parent)).toEqual({
      entityId: 'ent_sub',
      name: 'Maple Court LLC',
    })
  })

  it('names nobody for an entity the list does not hold', () => {
    expect(keptEntityOf({ entity_id: 'ent_gone' }, entities, parent)).toBeNull()
    expect(keptEntityOf({}, [], null)).toBeNull()
  })
})
