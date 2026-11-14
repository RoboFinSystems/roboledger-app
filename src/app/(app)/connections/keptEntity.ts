import type { FeedEntity } from './components/ConnectionCard'

interface ScopedEntity {
  id: string
  name: string
}

/**
 * The entity whose books a connection keeps: the one it names, or the group
 * parent when it names none. A named entity the list does not hold (a linked
 * counterparty, or a list still loading) is nobody the card can name, and is
 * never passed off as the parent.
 */
export const keptEntityOf = (
  connection: { entity_id?: string | null },
  entities: ScopedEntity[],
  parent: ScopedEntity | null
): FeedEntity | null => {
  if (!connection.entity_id || connection.entity_id === parent?.id)
    return parent ? { entityId: null, name: parent.name } : null
  const kept = entities.find((e) => e.id === connection.entity_id)
  return kept ? { entityId: kept.id, name: kept.name } : null
}
