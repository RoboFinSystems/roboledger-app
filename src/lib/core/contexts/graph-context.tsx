'use client'

import type { GraphInfo } from '@robosystems/client'
import * as SDK from '@robosystems/client'
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

// Generic graph state that can be extended by apps
export interface GraphState {
  graphs: GraphInfo[]
  currentGraphId: string | null
  isLoading: boolean
  error: string | null
}

// Base context value that apps can extend
export interface GraphContextValue<T extends GraphState = GraphState> {
  // State
  state: T
  // Core actions
  loadGraphs: () => Promise<void>
  setCurrentGraph: (graphId: string) => Promise<void>
  refreshGraphs: () => Promise<void>
}

// Factory function to create a typed graph context
export function createGraphContext<T extends GraphState = GraphState>() {
  return createContext<GraphContextValue<T> | null>(null)
}

// Props for the provider
export interface GraphProviderProps<T extends GraphState = GraphState> {
  children: React.ReactNode
  // Optional initial graph ID (from cookies/server)
  initialGraphId?: string | null
  // Optional graph filter (e.g., only graphs with certain extensions)
  graphFilter?: (graph: GraphInfo) => boolean
  // Optional state transformer for app-specific needs
  transformState?: (baseState: GraphState) => T
  // Server action to persist graph selection
  persistGraphSelection: (graphId: string) => Promise<void>
}

// Helper to check if error is 403 Forbidden
function is403Error(error: any): boolean {
  return (
    error?.status === 403 ||
    error?.response?.status === 403 ||
    (typeof error === 'object' && 'status' in error && error.status === 403)
  )
}

// Generic provider factory
export function createGraphProvider<T extends GraphState = GraphState>(
  Context: React.Context<GraphContextValue<T> | null>
) {
  return function GraphProvider({
    children,
    initialGraphId,
    graphFilter,
    transformState,
    persistGraphSelection,
  }: GraphProviderProps<T>) {
    const [baseState, setBaseState] = useState<GraphState>({
      graphs: [],
      currentGraphId: initialGraphId ?? null,
      isLoading: false,
      error: null,
    })

    // Transform state if needed
    const state = transformState ? transformState(baseState) : (baseState as T)

    // Load all user graphs
    const loadGraphs = useCallback(async () => {
      setBaseState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        const response = await SDK.getGraphs()

        if (response.data) {
          const graphsData = response.data as any
          let graphs = graphsData.graphs || []

          // Apply optional filter
          if (graphFilter) {
            graphs = graphs.filter(graphFilter)
          }

          const selectedGraphId = graphsData.selectedGraphId || initialGraphId

          // Validate that selectedGraphId exists in graphs array
          const graphIds = graphs.map((g: any) => g.graphId)
          const validSelectedId =
            selectedGraphId && graphIds.includes(selectedGraphId)
              ? selectedGraphId
              : null

          setBaseState((prev) => {
            // Determine which graph should be selected
            let newCurrentGraphId =
              validSelectedId || (graphs.length > 0 ? graphs[0].graphId : null)

            // IMPORTANT: If we currently have a repository selected, preserve it
            // The API's selectedGraphId only tracks user graphs, not repositories
            if (prev.currentGraphId) {
              const currentGraph = graphs.find(
                (g: any) => g.graphId === prev.currentGraphId
              )
              // If current selection is still in the graph list, keep it
              // This prevents loadGraphs from overwriting repository selections
              if (currentGraph) {
                newCurrentGraphId = prev.currentGraphId
              }
            }

            return {
              ...prev,
              graphs,
              currentGraphId: newCurrentGraphId,
              isLoading: false,
            }
          })
        }
      } catch (error) {
        console.error('Failed to load graphs:', error)
        setBaseState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Failed to load graphs',
        }))
      }
    }, [initialGraphId, graphFilter])

    // Set current graph with persistence
    const setCurrentGraph = useCallback(
      async (graphId: string) => {
        try {
          // Use functional setState to access current graphs and determine if repository
          let isRepository = false
          setBaseState((prev) => {
            const graph = prev.graphs.find((g) => g.graphId === graphId)
            isRepository = graph?.isRepository ?? false
            return {
              ...prev,
              currentGraphId: graphId,
            }
          })

          // Only call selectGraph API for user graphs, not repositories
          // Repositories can be accessed but not "selected" in the backend
          if (!isRepository) {
            await SDK.selectGraph({
              path: { graph_id: graphId },
            })
          }

          // Persist to cookies via server action (works for both graphs and repositories)
          await persistGraphSelection(graphId)
        } catch (error) {
          console.error('Failed to set current graph:', error)
          throw error
        }
      },
      [persistGraphSelection]
    )

    // Refresh graphs
    const refreshGraphs = useCallback(async () => {
      await loadGraphs()
    }, [loadGraphs])

    // Initialize on mount
    useEffect(() => {
      loadGraphs()
    }, [loadGraphs])

    const value: GraphContextValue<T> = {
      state,
      loadGraphs,
      setCurrentGraph,
      refreshGraphs,
    }

    return <Context.Provider value={value}>{children}</Context.Provider>
  }
}

// Factory for creating a typed hook
export function createUseGraphContext<T extends GraphState = GraphState>(
  Context: React.Context<GraphContextValue<T> | null>
) {
  return function useGraphContext() {
    const context = useContext(Context)
    if (!context) {
      throw new Error('useGraphContext must be used within a GraphProvider')
    }
    return context
  }
}

// Default implementation for simple use cases
export const GraphContext = createGraphContext()
export const GraphProvider = createGraphProvider(GraphContext)
export const useGraphContext = createUseGraphContext(GraphContext)
