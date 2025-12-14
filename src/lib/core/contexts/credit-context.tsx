'use client'

import type {
  CheckCreditBalanceResponse,
  CreditSummaryResponse,
} from '@robosystems/client'
import * as SDK from '@robosystems/client'
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useApiError, useToast, useUser } from '../hooks'
import { useGraphContext } from './graph-context'

// Credit summary interface for graph credits
interface GraphCreditSummary {
  graph_id: string
  current_balance: number
  consumed_this_month: number
  monthly_limit: number
  monthly_allocation: number // Additional field for robosystems compatibility
  tier: string
  graph_tier: string // Additional field for robosystems compatibility
  credit_multiplier: number // Additional field for robosystems compatibility
  reset_date?: string
  // Additional computed fields
  consumed_today?: number
  usage_percentage?: number
}

interface CreditState {
  // Graph credits
  graphCredits: Map<string, GraphCreditSummary>
  currentGraphId: string | null
  currentGraphCredits: GraphCreditSummary | null

  // Shared repository credits
  repositoryCredits: Map<string, CreditSummaryResponse>
  totalRepositoryCredits: CreditSummaryResponse | null

  // Loading states
  isLoading: boolean
  isLoadingGraphCredits: Map<string, boolean>
  error: string | null

  // Credit consumption tracking
  recentConsumption: number
  consumptionRate: number // credits per hour
}

interface CreditContextValue extends CreditState {
  // Actions
  loadGraphCredits: (graphId: string) => Promise<void>
  loadAllGraphCredits: () => Promise<void>
  loadRepositoryCredits: () => Promise<void>
  setCurrentGraph: (graphId: string) => void
  switchGraph: (graphId: string) => Promise<void>
  trackConsumption: (credits: number, operation: string) => void
  checkSufficientCredits: (
    graphId: string,
    requiredCredits: number
  ) => Promise<boolean>
  refreshCredits: (graphId?: string) => Promise<void>
  consumeCredits: (
    graphId: string,
    operation: string,
    baseCost?: number
  ) => Promise<boolean>
  hasCredits: (graphId: string, requiredCredits: number) => boolean
  getCreditPercentage: (graphId: string) => number
}

const CreditContext = createContext<CreditContextValue | null>(null)

export function CreditProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  const { showInfo, showWarning } = useToast()
  const { handleApiError } = useApiError()
  const { state: graphState } = useGraphContext()

  const [state, setState] = useState<CreditState>({
    graphCredits: new Map(),
    currentGraphId: null,
    currentGraphCredits: null,
    repositoryCredits: new Map(),
    totalRepositoryCredits: null,
    isLoading: false,
    isLoadingGraphCredits: new Map(),
    error: null,
    recentConsumption: 0,
    consumptionRate: 0,
  })

  // Track consumption over time with bounded array
  const [consumptionHistory, setConsumptionHistory] = useState<
    Array<{ timestamp: number; amount: number }>
  >([])

  // Maximum consumption history entries (24 hours worth at 1 per minute)
  const MAX_CONSUMPTION_ENTRIES = 1440

  // Load credits for a specific graph with retry mechanism
  const loadGraphCredits = useCallback(
    async (graphId: string, retryCount = 0) => {
      if (!user) return

      const maxRetries = 3
      const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000) // Exponential backoff

      // Set loading state for this specific graph
      setState((prev) => {
        const newLoadingStates = new Map(prev.isLoadingGraphCredits)
        newLoadingStates.set(graphId, true)
        return { ...prev, isLoadingGraphCredits: newLoadingStates }
      })

      try {
        const response = await SDK.getCreditSummary({
          path: { graph_id: graphId },
        })

        if (response.data) {
          const creditData = response.data as CreditSummaryResponse
          const summary: GraphCreditSummary = {
            graph_id: graphId,
            current_balance: creditData.current_balance || 0,
            consumed_this_month: creditData.consumed_this_month || 0,
            monthly_limit: creditData.monthly_allocation || 0, // Use monthly_allocation as limit
            monthly_allocation: creditData.monthly_allocation || 0,
            tier: 'free', // Default tier since not in API response
            graph_tier: creditData.graph_tier || 'standard',
            credit_multiplier: 1, // Default multiplier, not in API response
            reset_date: creditData.last_allocation_date, // Use last_allocation_date
            consumed_today: 0, // Not available in API response
            usage_percentage: creditData.usage_percentage || 0,
          }

          setState((prev) => {
            const newCredits = new Map(prev.graphCredits)
            newCredits.set(graphId, summary)

            const newLoadingStates = new Map(prev.isLoadingGraphCredits)
            newLoadingStates.set(graphId, false)

            return {
              ...prev,
              graphCredits: newCredits,
              currentGraphCredits:
                prev.currentGraphId === graphId
                  ? summary
                  : prev.currentGraphCredits,
              isLoadingGraphCredits: newLoadingStates,
              error: null, // Clear error on success
            }
          })
        }
      } catch (error) {
        // Retry logic with exponential backoff
        if (retryCount < maxRetries) {
          // Log retry attempt (consider using a proper logger in production)
          if (process.env.NODE_ENV === 'development') {
            console.warn(
              `Credit loading failed for graph ${graphId}, retrying in ${retryDelay}ms (attempt ${retryCount + 1}/${maxRetries})`
            )
          }
          setTimeout(() => {
            loadGraphCredits(graphId, retryCount + 1)
          }, retryDelay)
          return
        }

        // Final failure after all retries
        const errorMessage = handleApiError(
          error,
          `Failed to load credits for graph ${graphId} after ${maxRetries} attempts`
        )
        setState((prev) => {
          const newLoadingStates = new Map(prev.isLoadingGraphCredits)
          newLoadingStates.set(graphId, false)
          return {
            ...prev,
            isLoadingGraphCredits: newLoadingStates,
            error: errorMessage,
          }
        })
      }
    },
    [user, handleApiError]
  )

  // Load credits for all user graphs
  const loadAllGraphCredits = useCallback(async () => {
    if (!user) return

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      // TODO: getAllCreditSummaries no longer exists - need to fetch per-graph
      // const response = await SDK.getAllCreditSummaries()
      const response: any = { data: null }
      const responseData: any = null
      if (
        responseData &&
        typeof responseData === 'object' &&
        'graphs' in responseData &&
        Array.isArray(responseData.graphs)
      ) {
        const creditsMap = new Map<string, GraphCreditSummary>()
        responseData.graphs.forEach((summary: CreditSummaryResponse) => {
          creditsMap.set(summary.graph_id, {
            graph_id: summary.graph_id,
            current_balance: summary.current_balance || 0,
            consumed_this_month: summary.consumed_this_month || 0,
            monthly_limit: summary.monthly_allocation || 0, // Use monthly_allocation as limit
            monthly_allocation: summary.monthly_allocation || 0,
            tier: 'free', // Default tier since not in API response
            graph_tier: summary.graph_tier || 'standard',
            credit_multiplier: 1, // Default multiplier, not in API response
            reset_date: summary.last_allocation_date, // Use last_allocation_date
            consumed_today: 0, // Not available in API response
            usage_percentage: summary.usage_percentage || 0,
          })
        })

        setState((prev) => ({
          ...prev,
          graphCredits: creditsMap,
          isLoading: false,
        }))
      }
    } catch (error) {
      const errorMessage = handleApiError(
        error,
        'Failed to load credit information'
      )
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }))
    }
  }, [user, handleApiError])

  // Load shared repository credits
  const loadRepositoryCredits = useCallback(async () => {
    if (!user) return

    try {
      // TODO: This entire function needs refactoring for new billing system
      // The old getAllCreditSummaries and add-ons concept no longer exists
      // Repository credits are now handled via GraphSubscriptionResponse per-repository
      /* const response = await SDK.getAllCreditSummaries()
      if (response.data) {
        const data = response.data as any
        setState((prev) => ({
          ...prev,
          totalRepositoryCredits: data,
        }))

        if (data.add_ons?.length > 0) {
          const repoCreditsMap = new Map<string, any>()

          data.add_ons.forEach((addon: any) => {
            const repoCredits: any = {
              repository: addon.addon_type,
              has_access: true,
              credits: {
                current_balance: addon.credits_remaining,
                consumed_this_month: addon.credits_consumed,
                monthly_allocation: addon.credits_allocated,
                usage_percentage:
                  (addon.credits_consumed / addon.credits_allocated) * 100,
                rollover_credits: addon.rollover_amount || 0,
                allows_rollover: true,
                is_active: true,
              },
            }
            repoCreditsMap.set(addon.addon_type, repoCredits)
          })

          setState((prev) => ({
            ...prev,
            repositoryCredits: repoCreditsMap,
          }))
        }
      } */
    } catch (error) {
      console.error('Failed to load repository credits:', error)
    }
  }, [user])

  // Set current graph
  const setCurrentGraph = useCallback(
    (graphId: string) => {
      setState((prev) => {
        const credits = prev.graphCredits.get(graphId)

        // Load credits if not already loaded
        if (!credits && !prev.isLoadingGraphCredits.get(graphId)) {
          loadGraphCredits(graphId)
        }

        return {
          ...prev,
          currentGraphId: graphId,
          currentGraphCredits: credits || null,
        }
      })
    },
    [loadGraphCredits]
  )

  // Track credit consumption
  const trackConsumption = useCallback(
    (credits: number, operation: string) => {
      const now = Date.now()

      // Update consumption history with bounded array
      setConsumptionHistory((prev) => {
        const updated = [...prev, { timestamp: now, amount: credits }]
        // Keep only last 24 hours of data and limit total entries
        const oneDayAgo = now - 86400000
        const filtered = updated
          .filter((item) => item.timestamp > oneDayAgo)
          .slice(-MAX_CONSUMPTION_ENTRIES) // Ensure we never exceed max entries
        return filtered
      })

      // Update recent consumption and current graph credits
      let updatedCredits: GraphCreditSummary | null = null
      setState((prev) => {
        const updates: Partial<CreditState> = {
          recentConsumption: prev.recentConsumption + credits,
        }

        // Update current graph credits if available
        if (prev.currentGraphId && prev.currentGraphCredits) {
          updates.currentGraphCredits = {
            ...prev.currentGraphCredits,
            current_balance: Math.max(
              0,
              prev.currentGraphCredits.current_balance - credits
            ),
            consumed_this_month:
              prev.currentGraphCredits.consumed_this_month + credits,
          }
          updatedCredits = updates.currentGraphCredits

          // Also update in the map
          const newCredits = new Map(prev.graphCredits)
          newCredits.set(prev.currentGraphId, updates.currentGraphCredits)
          updates.graphCredits = newCredits
        }

        return { ...prev, ...updates }
      })

      // Show consumption notification
      showInfo(`Consumed ${credits} credits for ${operation}`)

      // Warn if credits are low (using the updated value)
      if (updatedCredits) {
        const remaining = updatedCredits.current_balance
        const percentage = (remaining / updatedCredits.monthly_limit) * 100

        if (percentage < 10 && percentage >= 5) {
          showWarning('Credits running low - less than 10% remaining')
        } else if (percentage < 5) {
          showWarning('Critical: Less than 5% of credits remaining!')
        }
      }
    },
    [showInfo, showWarning]
  )

  // Check if user has sufficient credits
  const checkSufficientCredits = useCallback(
    async (graphId: string, requiredCredits: number): Promise<boolean> => {
      try {
        const response = await SDK.checkCreditBalance({
          path: { graph_id: graphId },
          query: {
            operation_type: 'query',
            base_cost: requiredCredits,
          },
        })

        const data = response.data as CheckCreditBalanceResponse
        return data &&
          typeof data === 'object' &&
          'has_sufficient_credits' in data
          ? Boolean(data.has_sufficient_credits)
          : false
      } catch (error) {
        // Log error (consider using a proper logger in production)
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to check credits:', error)
        }
        return false
      }
    },
    []
  )

  // Refresh credits
  const refreshCredits = useCallback(
    async (graphId?: string) => {
      if (graphId) {
        await loadGraphCredits(graphId)
      } else {
        await loadAllGraphCredits()
      }
    },
    [loadGraphCredits, loadAllGraphCredits]
  )

  // Consume credits (placeholder - actual consumption happens automatically via API)
  const consumeCredits = useCallback(
    async (
      graphId: string,
      operation: string,
      baseCost: number = 1
    ): Promise<boolean> => {
      try {
        // Check if sufficient credits exist
        const hasSufficient = await checkSufficientCredits(graphId, baseCost)

        if (hasSufficient) {
          // Track the consumption optimistically
          trackConsumption(baseCost, operation)

          // Refresh credits after a delay to get actual consumption from API
          setTimeout(() => {
            loadGraphCredits(graphId)
          }, 2000)

          return true
        }

        return false
      } catch (error) {
        // Log error (consider using a proper logger in production)
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to consume credits:', error)
        }
        return false
      }
    },
    [checkSufficientCredits, trackConsumption, loadGraphCredits]
  )

  // Check if user has sufficient credits (sync version)
  const hasCredits = useCallback(
    (graphId: string, requiredCredits: number): boolean => {
      const graphCredits = state.graphCredits.get(graphId)
      if (!graphCredits) return false
      return graphCredits.current_balance >= requiredCredits
    },
    [state.graphCredits]
  )

  // Get credit percentage for a graph
  const getCreditPercentage = useCallback(
    (graphId: string): number => {
      const graphCredits = state.graphCredits.get(graphId)
      if (!graphCredits || graphCredits.monthly_limit === 0) return 0
      return (graphCredits.current_balance / graphCredits.monthly_limit) * 100
    },
    [state.graphCredits]
  )

  // Calculate consumption rate - optimized to only run when there's meaningful data
  useEffect(() => {
    const calculateRate = () => {
      if (consumptionHistory.length < 2) {
        setState((prev) => ({ ...prev, consumptionRate: 0 }))
        return
      }

      const now = Date.now()
      const oneHourAgo = now - 3600000
      const recentHistory = consumptionHistory.filter(
        (item) => item.timestamp > oneHourAgo
      )

      if (recentHistory.length > 0) {
        const totalConsumption = recentHistory.reduce(
          (sum, item) => sum + item.amount,
          0
        )
        const timeSpan = (now - recentHistory[0].timestamp) / 3600000 // hours
        const rate = totalConsumption / Math.max(timeSpan, 0.1) // prevent division by zero

        setState((prev) => ({ ...prev, consumptionRate: rate }))
      } else {
        setState((prev) => ({ ...prev, consumptionRate: 0 }))
      }
    }

    calculateRate()

    // Only start interval if we have consumption data
    let interval: ReturnType<typeof setInterval> | null = null
    if (consumptionHistory.length > 0) {
      interval = setInterval(calculateRate, 60000) // Update every minute
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [consumptionHistory])

  // Switch to a new graph
  const switchGraph = useCallback(
    async (graphId: string) => {
      // Prevent switching to the same graph
      if (state.currentGraphId === graphId && state.currentGraphCredits) {
        return
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        // Check if we already have credits for this graph
        let credits = state.graphCredits.get(graphId)

        // If not, load them
        if (!credits) {
          await loadGraphCredits(graphId)
          credits = state.graphCredits.get(graphId)
        }

        // Update current graph
        setState((prev) => ({
          ...prev,
          currentGraphId: graphId,
          currentGraphCredits: credits || null,
          isLoading: false,
        }))
      } catch (error) {
        const errorMessage = handleApiError(error, 'Failed to switch graph')
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }))
        throw error
      }
    },
    [
      state.graphCredits,
      state.currentGraphId,
      state.currentGraphCredits,
      loadGraphCredits,
      handleApiError,
    ]
  )

  // Sync with graph context and load credits when graph changes
  useEffect(() => {
    const currentGraphId = graphState.currentGraphId

    if (!currentGraphId || !user) {
      // Clear current graph credits if no graph is selected
      setState((prev) => ({
        ...prev,
        currentGraphId: null,
        currentGraphCredits: null,
      }))
      return
    }

    // Validate that the graph exists in the user's graph list
    const graphExists = graphState.graphs.some(
      (g) => g.graphId === currentGraphId
    )

    if (!graphExists) {
      // Graph doesn't belong to this user - don't try to load credits
      setState((prev) => ({
        ...prev,
        currentGraphId: null,
        currentGraphCredits: null,
      }))
      return
    }

    // Update current graph ID and load credits if needed
    setState((prev) => {
      const existingCredits = prev.graphCredits.get(currentGraphId)

      return {
        ...prev,
        currentGraphId,
        currentGraphCredits: existingCredits || null,
      }
    })

    // Load credits if we don't have them yet and not already loading
    const existingCredits = state.graphCredits.get(currentGraphId)
    const isLoadingCredits = state.isLoadingGraphCredits.get(currentGraphId)

    if (!existingCredits && !isLoadingCredits) {
      loadGraphCredits(currentGraphId)
    }
  }, [
    graphState.currentGraphId,
    graphState.graphs,
    user,
    loadGraphCredits,
    state.graphCredits,
    state.isLoadingGraphCredits,
  ])

  // Auto-refresh credits every 5 minutes - only when user is authenticated
  useEffect(() => {
    if (!user) return

    // Initial load - wait a bit to let graph context initialize first
    const initialLoad = setTimeout(() => {
      refreshCredits()
      loadRepositoryCredits()
    }, 100)

    const interval = setInterval(() => {
      refreshCredits()
      loadRepositoryCredits()
    }, 300000) // 5 minutes

    return () => {
      clearTimeout(initialLoad)
      clearInterval(interval)
    }
  }, [user, refreshCredits, loadRepositoryCredits])

  const value: CreditContextValue = {
    ...state,
    loadGraphCredits,
    loadAllGraphCredits,
    loadRepositoryCredits,
    setCurrentGraph,
    switchGraph,
    trackConsumption,
    checkSufficientCredits,
    refreshCredits,
    consumeCredits,
    hasCredits,
    getCreditPercentage,
  }

  return (
    <CreditContext.Provider value={value}>{children}</CreditContext.Provider>
  )
}

export function useCreditContext() {
  const context = useContext(CreditContext)
  if (!context) {
    throw new Error('useCreditContext must be used within a CreditProvider')
  }
  return context
}

// Alias for convenience
export const useCredits = useCreditContext

// Utility hook for credit-aware operations
export function useCreditAwareOperation() {
  const { currentGraphId, checkSufficientCredits, trackConsumption } =
    useCreditContext()
  const { showError } = useToast()

  const executeWithCredits = useCallback(
    async <T,>(
      operation: () => Promise<T>,
      operationType: string,
      estimatedCost: number = 1
    ): Promise<T | null> => {
      if (!currentGraphId) {
        showError('No graph selected')
        return null
      }

      // Check credits first
      const hasSufficient = await checkSufficientCredits(
        currentGraphId,
        estimatedCost
      )
      if (!hasSufficient) {
        showError(
          `Insufficient credits. This operation requires ${estimatedCost} credits.`
        )
        return null
      }

      try {
        const result = await operation()

        // Track consumption after successful operation
        trackConsumption(estimatedCost, operationType)

        return result
      } catch (error) {
        // Log error (consider using a proper logger in production)
        if (process.env.NODE_ENV === 'development') {
          console.error(`Operation failed: ${operationType}`, error)
        }
        showError(`Operation failed: ${operationType}`)
        throw error
      }
    },
    [currentGraphId, checkSufficientCredits, trackConsumption, showError]
  )

  return { executeWithCredits }
}
