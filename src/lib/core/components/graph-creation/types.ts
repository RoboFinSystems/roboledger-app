import type { InitialEntityData } from '@robosystems/client'

export type EntityCreate = InitialEntityData

export interface GraphCreationConfig {
  allowGenericGraphs?: boolean

  requiredExtensions?: string[]

  showTierSelection?: boolean

  requireInitialEntity?: boolean

  validateEntity?: (entity: EntityCreate) => string | null

  onSuccess?: (graphId: string, result?: any) => void | Promise<void>

  onCancel?: () => void
}

export interface GraphFormData {
  graphType: 'entity' | 'generic'

  entityName: string
  entityDetails?: Partial<EntityCreate>
  createEntity?: boolean
  graphName?: string

  entityDescription?: string
  entityTags?: string[]

  selectedExtensions: string[]

  selectedTier?:
    | 'ladybug-standard'
    | 'ladybug-large'
    | 'ladybug-xlarge'
    | 'neo4j-community-large'
    | 'neo4j-enterprise-xlarge'

  genericGraphName?: string
  genericGraphDescription?: string
  genericGraphTags?: string[]
  genericSchemaType?: 'empty' | 'custom'
  genericCustomSchema?: string

  confirmed?: boolean
}

export interface GraphCreationStep {
  id: string
  title: string
  description?: string
  isOptional?: boolean
  validate?: (data: GraphFormData) => boolean
}
