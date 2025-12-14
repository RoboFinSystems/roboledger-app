'use client'

import { useCallback, useRef, useState } from 'react'

// Import SDK extensions - check at runtime
const getSDKExtensions = async () => {
  try {
    return await import('@robosystems/client/extensions')
  } catch (error) {
    console.error('SDK extensions not available:', error)
    return null
  }
}

export interface StreamingQueryState {
  isStreaming: boolean
  results: any[]
  error: string | null
  progress: number | null
  totalRows: number | null
  currentRow: number | null
  status:
    | 'idle'
    | 'connecting'
    | 'streaming'
    | 'completed'
    | 'error'
    | 'cancelled'
  creditsUsed: number | null
  cached: boolean
  duration: number | null
}

export interface UseStreamingQueryResult extends StreamingQueryState {
  executeQuery: (
    graphId: string,
    query: string,
    parameters?: Record<string, any>
  ) => Promise<void>
  cancelQuery: () => void
  reset: () => void
}

/**
 * Hook for streaming query results using SDK extensions when available
 * Falls back to manual SSE implementation for older SDK versions
 */
export function useStreamingQuery(): UseStreamingQueryResult {
  const [state, setState] = useState<StreamingQueryState>({
    isStreaming: false,
    results: [],
    error: null,
    progress: null,
    totalRows: null,
    currentRow: null,
    status: 'idle',
    creditsUsed: null,
    cached: false,
    duration: null,
  })

  const eventSourceRef = useRef<EventSource | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const queryClientRef = useRef<any>(null)

  const reset = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (queryClientRef.current?.close) {
      queryClientRef.current.close()
      queryClientRef.current = null
    }
    setState({
      isStreaming: false,
      results: [],
      error: null,
      progress: null,
      totalRows: null,
      currentRow: null,
      status: 'idle',
      creditsUsed: null,
      cached: false,
      duration: null,
    })
  }, [])

  const cancelQuery = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (queryClientRef.current?.close) {
      queryClientRef.current.close()
      queryClientRef.current = null
    }
    setState((prev) => ({
      ...prev,
      isStreaming: false,
      status: 'cancelled',
      error: 'Query was cancelled',
    }))
  }, [])

  const executeQuery = useCallback(
    async (
      graphId: string,
      query: string,
      parameters?: Record<string, any>
    ) => {
      // Get SDK extensions at runtime
      const sdkExtensions = await getSDKExtensions()

      // Require SDK extensions - fail fast if not available
      if (!sdkExtensions?.streamQuery) {
        throw new Error(
          'SDK extensions not available. Please install @robosystems/client with extensions support.'
        )
      }

      return executeQueryWithExtensions(
        graphId,
        query,
        sdkExtensions,
        parameters
      )
    },
    []
  )

  // Helper function to execute query with SDK extensions
  const executeQueryWithExtensions = async (
    graphId: string,
    query: string,
    sdkExtensions: any,
    parameters?: Record<string, any>
  ) => {
    try {
      // Reset state for new query
      setState({
        isStreaming: true,
        results: [],
        error: null,
        progress: 0,
        totalRows: null,
        currentRow: 0,
        status: 'connecting',
        creditsUsed: null,
        cached: false,
        duration: null,
      })

      startTimeRef.current = Date.now()

      // Use the centralized streamQuery function with proper authentication
      const iterator = sdkExtensions.streamQuery(
        graphId,
        query,
        parameters,
        100
      )

      setState((prev) => ({ ...prev, status: 'streaming' }))

      let rowCount = 0
      const allResults: any[] = []

      for await (const batch of iterator) {
        // Handle both single rows and batches
        const rows = Array.isArray(batch) ? batch : [batch]

        for (const row of rows) {
          rowCount++
          allResults.push(row)
        }

        // Update state with progress
        setState((prev) => ({
          ...prev,
          results: [...allResults],
          currentRow: rowCount,
          progress: prev.totalRows
            ? Math.round((rowCount / prev.totalRows) * 100)
            : null,
        }))
      }

      const duration = Date.now() - startTimeRef.current

      setState((prev) => ({
        ...prev,
        isStreaming: false,
        status: 'completed',
        results: allResults,
        totalRows: rowCount,
        currentRow: rowCount,
        progress: 100,
        duration,
      }))
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Query execution failed'

      setState((prev) => ({
        ...prev,
        isStreaming: false,
        status: 'error',
        error: errorMessage,
      }))
    }
  }

  return {
    ...state,
    executeQuery,
    cancelQuery,
    reset,
  }
}
