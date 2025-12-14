/**
 * Entity interface - represents an Entity node in the graph
 * Entity is a base node type that can represent companies, subsidiaries, or other business entities
 */
export interface Entity {
  identifier: string
  name: string
  entityType?: string // Entity type: 'corporation', 'llc', 'partnership', etc.
  parentEntityId?: string | null
  isParent?: boolean | null
  [key: string]: any
}

/**
 * Collection of entities
 */
export interface Entities {
  entities: Entity[]
}
