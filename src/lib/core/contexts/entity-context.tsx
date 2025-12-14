'use client'

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type PropsWithChildren,
} from 'react'
import {
  clearEntitySelection,
  persistEntitySelection,
} from '../actions/entity-actions'
import type { Entity } from '../types'
import { useGraphContext } from './graph-context'

export interface EntityContextValue {
  // Current entity selection
  currentEntity: Entity | null
  // Set the current entity
  setCurrentEntity: (entity: Entity | null) => void
  // Clear entity selection
  clearEntity: () => void
}

const EntityContext = createContext<EntityContextValue | null>(null)

export interface EntityProviderProps extends PropsWithChildren {
  initialEntityCookie?: {
    identifier: string
    name: string
    graphId: string
  } | null
}

/**
 * EntityProvider - Manages entity selection for entity-based graphs
 *
 * This provider wraps GraphProvider and adds entity-specific state management.
 * Entity selection persists across page refreshes using cookies.
 *
 * Use this for apps that work with entity-based graphs (RoboLedger, RoboInvestor, etc.)
 */
export function EntityProvider({
  children,
  initialEntityCookie,
}: EntityProviderProps) {
  const { state: graphState } = useGraphContext()
  const [currentEntity, setCurrentEntityState] = useState<Entity | null>(() => {
    // Initialize from cookie if available
    if (initialEntityCookie) {
      return {
        identifier: initialEntityCookie.identifier,
        name: initialEntityCookie.name,
      }
    }
    return null
  })

  const setCurrentEntity = useCallback(
    async (entity: Entity | null) => {
      setCurrentEntityState(entity)

      // Persist to cookie
      try {
        if (entity && graphState.currentGraphId) {
          await persistEntitySelection(entity, graphState.currentGraphId)
        } else {
          await clearEntitySelection()
        }
      } catch (error) {
        console.error('Failed to persist entity selection:', error)
        // Don't throw - we don't want to break the UI if cookie persistence fails
        // The entity state is still updated in memory
      }
    },
    [graphState.currentGraphId]
  )

  const clearEntity = useCallback(async () => {
    setCurrentEntityState(null)
    try {
      await clearEntitySelection()
    } catch (error) {
      console.error('Failed to clear entity selection:', error)
      // Don't throw - we don't want to break the UI if cookie clearing fails
      // The entity state is still cleared in memory
    }
  }, [])

  const value: EntityContextValue = {
    currentEntity,
    setCurrentEntity,
    clearEntity,
  }

  return (
    <EntityContext.Provider value={value}>{children}</EntityContext.Provider>
  )
}

/**
 * Hook to access entity context
 * Must be used within an EntityProvider
 */
export function useEntity(): EntityContextValue {
  const context = useContext(EntityContext)
  if (!context) {
    throw new Error('useEntity must be used within an EntityProvider')
  }
  return context
}
