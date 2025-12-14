'use client'

import {
  client,
  createCheckoutSession,
  createGraph as createGraphAPI,
  createRepositorySubscription,
  getOrgBillingCustomer,
} from '@robosystems/client'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { OperationProgress, OperationStatus } from './operationMonitor'
import { operationMonitor } from './operationMonitor'

export interface OperationMonitorState {
  isLoading: boolean
  isMonitoring: boolean // Alias for isLoading for consistency
  progress: number | null
  currentStep: string | null
  error: string | null
  operationId: string | null
  result: any | null
  status: OperationStatus | null
}

export interface UseOperationMonitoringResult extends OperationMonitorState {
  startMonitoring: (
    operationId: string,
    options?: { timeout?: number }
  ) => Promise<any>
  cancelOperation: () => Promise<void>
  reset: () => void
  cancelMonitoring: () => Promise<void> // Alias for cancelOperation
}

/**
 * Hook for monitoring operations using SSE
 */
export function useOperationMonitoring(): UseOperationMonitoringResult {
  const [state, setState] = useState<OperationMonitorState>({
    isLoading: false,
    isMonitoring: false, // Alias for isLoading
    progress: null,
    currentStep: null,
    error: null,
    operationId: null,
    result: null,
    status: null,
  })

  const currentOperationId = useRef<string | null>(null)

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      isMonitoring: false, // Alias for isLoading
      progress: null,
      currentStep: null,
      error: null,
      operationId: null,
      result: null,
      status: null,
    })
    currentOperationId.current = null
  }, [])

  const cancelOperation = useCallback(async () => {
    if (currentOperationId.current) {
      try {
        await operationMonitor.cancelOperation(currentOperationId.current)
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isMonitoring: false,
          status: 'cancelled',
          error: 'Operation was cancelled',
          result: null,
        }))
      } catch (error) {
        console.error('Failed to cancel operation:', error)
        setState((prev) => ({
          ...prev,
          error: 'Failed to cancel operation',
          result: null,
        }))
      }
    }
  }, [])

  const startMonitoring = useCallback(
    async (operationId: string, options?: { timeout?: number }) => {
      currentOperationId.current = operationId
      setState({
        isLoading: true,
        isMonitoring: true,
        progress: 0,
        currentStep: 'Starting...',
        error: null,
        operationId,
        result: null,
        status: 'pending',
      })

      try {
        const result = await operationMonitor.monitorOperation({
          operationId,
          timeout: options?.timeout,
          onProgress: (progress: OperationProgress) => {
            setState((prev) => ({
              ...prev,
              progress: progress.percent,
              currentStep: progress.message,
              status: 'running',
            }))
          },
          onComplete: (result) => {
            setState((prev) => ({
              ...prev,
              isLoading: false,
              isMonitoring: false,
              progress: 100,
              currentStep: 'Completed',
              result: result,
              status: 'completed',
            }))
          },
          onError: (errorMsg) => {
            setState((prev) => ({
              ...prev,
              isLoading: false,
              isMonitoring: false,
              error: errorMsg,
              result: null,
              status: 'failed',
            }))
          },
        })

        return result.result || result
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error'
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isMonitoring: false,
          error: errorMessage,
          result: null,
          status: 'failed',
        }))
        throw error
      } finally {
        currentOperationId.current = null
      }
    },
    []
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentOperationId.current) {
        operationMonitor.cancelOperation(currentOperationId.current)
      }
    }
  }, [])

  return {
    ...state,
    startMonitoring,
    cancelOperation,
    cancelMonitoring: cancelOperation, // Alias for consistency
    reset,
  }
}

/**
 * Hook for graph creation using the new unified endpoint
 */
export function useGraphCreation() {
  const operationMonitoring = useOperationMonitoring()
  const [isCreating, setIsCreating] = useState(false)

  const createGraph = useCallback(
    async (graphData: {
      graph_type: 'generic' | 'company' | 'entity'
      graph_name: string
      description?: string
      tags?: string[]
      instance_tier?: string
      schema_extensions?: string[]
      create_entity?: boolean
      // Legacy company fields (deprecated)
      company_name?: string
      company_identifier?: string
      company_identifier_type?: 'ein' | 'name'
      // New entity fields
      entity_name?: string
      entity_identifier?: string
      entity_identifier_type?: 'ein' | 'name'
    }) => {
      setIsCreating(true)
      try {
        // Check if billing is enabled and user needs to complete checkout
        // TODO: Update to use getOrgBillingCustomer with org_id parameter
        // const billingResponse = await getOrgBillingCustomer({ client })
        // const billingData = billingResponse.data

        // Only check payment if billing is enabled (response exists)
        // If billing disabled, getBillingCustomer will return 404 and we skip checkout
        const billingData = null // Temporarily disabled
        if (
          billingData &&
          !billingData.has_payment_method &&
          !billingData.invoice_billing_enabled
        ) {
          // User needs to add payment method - create checkout session
          const checkoutResponse = await createCheckoutSession({
            client,
            body: {
              resource_type: 'graph',
              plan_name: graphData.instance_tier || 'ladybug-standard',
              resource_config: {
                graph_type: graphData.graph_type,
                graph_name: graphData.graph_name,
                description: graphData.description,
                tags: graphData.tags,
                schema_extensions: graphData.schema_extensions,
                create_entity: graphData.create_entity,
                entity_name: graphData.entity_name,
                entity_identifier: graphData.entity_identifier,
                entity_identifier_type: graphData.entity_identifier_type,
                company_name: graphData.company_name,
                company_identifier: graphData.company_identifier,
                company_identifier_type: graphData.company_identifier_type,
              },
            },
          })

          if (checkoutResponse.error) {
            const errorMsg =
              typeof checkoutResponse.error === 'object' &&
              'detail' in checkoutResponse.error
                ? String(checkoutResponse.error.detail)
                : 'Failed to create checkout session'
            throw new Error(errorMsg)
          }

          // Check if billing is disabled on the backend
          // @ts-ignore - billing_disabled field will be in next SDK release
          if (checkoutResponse.data?.billing_disabled) {
            // Billing disabled - proceed with normal graph creation without payment
            // Fall through to the graph creation logic below
          } else if (checkoutResponse.data?.checkout_url) {
            // Redirect to Stripe checkout (leave isCreating=true since we're redirecting)
            window.location.href = checkoutResponse.data.checkout_url
            // Return a pending state to prevent further processing
            return {
              requires_checkout: true,
              checkout_url: checkoutResponse.data.checkout_url,
              session_id: checkoutResponse.data.session_id,
              subscription_id: checkoutResponse.data.subscription_id,
            }
          }
        }

        // User has payment method or invoice billing - proceed with normal graph creation
        // Prepare the request in the correct format for CreateGraphRequest
        const requestBody: any = {
          metadata: {
            graph_name: graphData.graph_name,
            description: graphData.description,
            tags: graphData.tags,
            schema_extensions: graphData.schema_extensions || [],
          },
          instance_tier: graphData.instance_tier || 'ladybug-standard',
          create_entity:
            graphData.graph_type === 'generic'
              ? false
              : (graphData.create_entity ?? true),
        }

        // Add initial_entity for entity or company graphs
        if (graphData.graph_type === 'entity' && graphData.entity_name) {
          requestBody.initial_entity = {
            name: graphData.entity_name,
            uri: graphData.entity_name.toLowerCase().replace(/\s+/g, '-'),
            ein:
              graphData.entity_identifier_type === 'ein'
                ? graphData.entity_identifier
                : undefined,
          }
        } else if (
          graphData.graph_type === 'company' &&
          graphData.company_name
        ) {
          // Legacy support for company type
          requestBody.initial_entity = {
            name: graphData.company_name,
            uri: graphData.company_name.toLowerCase().replace(/\s+/g, '-'),
            ein:
              graphData.company_identifier_type === 'ein'
                ? graphData.company_identifier
                : undefined,
          }
        }

        // Call the new unified graph creation endpoint
        const response = await createGraphAPI({
          client,
          body: requestBody,
        })

        // Check for error in response
        const apiError = (response as any).error
        if (apiError) {
          setIsCreating(false)

          // Format validation error message
          let errorMessage = 'Graph creation failed'
          if (Array.isArray(apiError.detail)) {
            errorMessage = apiError.detail
              .map((err: any) => {
                if (typeof err === 'string') return err
                if (err.msg)
                  return `${err.loc?.join('.') || 'field'}: ${err.msg}`
                return JSON.stringify(err)
              })
              .join(', ')
          } else if (typeof apiError.detail === 'string') {
            errorMessage = apiError.detail
          } else if (apiError.message) {
            errorMessage = apiError.message
          }

          throw new Error(errorMessage)
        }

        // Check if response contains operation_id (async) or direct result
        const responseData = response.data as any

        if (responseData?.operation_id) {
          // Async operation - monitor it
          const result = await operationMonitoring.startMonitoring(
            responseData.operation_id
          )
          setIsCreating(false)
          return result
        } else if (responseData?.graph_id || responseData?.graphId) {
          // Synchronous result - return directly
          // Handle both snake_case and camelCase, normalize initial_entity
          setIsCreating(false)
          return {
            graph_id: responseData.graph_id || responseData.graphId,
            initial_entity:
              responseData.initial_entity || responseData.initialEntity,
            ...responseData,
          }
        } else {
          setIsCreating(false)
          throw new Error('Invalid response from graph creation')
        }
      } catch (error) {
        setIsCreating(false)
        throw error
      }
    },
    [operationMonitoring]
  )

  const createEntityGraph = useCallback(
    async (entityData: {
      entity_name: string
      entity_identifier?: string
      entity_identifier_type?: 'ein' | 'name'
      instance_tier?: string
      schema_extensions?: string[]
      create_entity?: boolean
      description?: string
      tags?: string[]
    }) => {
      return createGraph({
        graph_type: 'entity',
        graph_name: entityData.entity_name,
        entity_name: entityData.entity_name,
        entity_identifier: entityData.entity_identifier,
        entity_identifier_type: entityData.entity_identifier_type,
        instance_tier: entityData.instance_tier,
        schema_extensions: entityData.schema_extensions,
        create_entity: entityData.create_entity,
        description: entityData.description,
        tags: entityData.tags,
      })
    },
    [createGraph]
  )

  const createGenericGraph = useCallback(
    async (graphData: {
      graph_name: string
      description?: string
      instance_tier?: string
      schema_extensions?: string[]
    }) => {
      return createGraph({
        graph_type: 'generic',
        ...graphData,
      })
    },
    [createGraph]
  )

  return {
    ...operationMonitoring,
    isLoading: isCreating || operationMonitoring.isLoading,
    createGraph,
    createEntityGraph,
    createGenericGraph,
  }
}

/**
 * Hook for creating repository subscriptions with billing integration
 * Mirrors the graph creation pattern for consistency
 */
export function useRepositorySubscription() {
  const [isSubscribing, setIsSubscribing] = useState(false)

  const subscribe = useCallback(
    async (subscriptionData: {
      repository_name: string
      plan_name: string
      org_id: string
    }) => {
      setIsSubscribing(true)

      try {
        // Check if billing is enabled and user needs to complete checkout
        const billingResponse = await getOrgBillingCustomer({
          client,
          path: { org_id: subscriptionData.org_id },
        })

        const billingData = billingResponse.data

        // Only check payment if billing is enabled (response exists without error)
        // If billing disabled, getOrgBillingCustomer will return 404 and we skip checkout
        if (
          !billingResponse.error &&
          billingData &&
          !billingData.has_payment_method &&
          !billingData.invoice_billing_enabled
        ) {
          // User needs to add payment method - create checkout session
          const checkoutResponse = await createCheckoutSession({
            client,
            body: {
              resource_type: 'repository',
              plan_name: subscriptionData.plan_name,
              resource_config: {
                repository_name: subscriptionData.repository_name,
              },
            },
          })

          if (checkoutResponse.error) {
            const errorMsg =
              typeof checkoutResponse.error === 'object' &&
              'detail' in checkoutResponse.error
                ? String(checkoutResponse.error.detail)
                : 'Failed to create checkout session'
            throw new Error(errorMsg)
          }

          // Check if billing is disabled on the backend
          // @ts-ignore - billing_disabled field will be in next SDK release
          if (checkoutResponse.data?.billing_disabled) {
            // Billing disabled - proceed with direct subscription creation
            // Fall through to the subscription creation logic below
          } else if (checkoutResponse.data?.checkout_url) {
            // Redirect to Stripe checkout
            window.location.href = checkoutResponse.data.checkout_url
            // Return a pending state to prevent further processing
            return {
              requires_checkout: true,
              checkout_url: checkoutResponse.data.checkout_url,
              session_id: checkoutResponse.data.session_id,
              subscription_id: checkoutResponse.data.subscription_id,
            }
          }
        }

        // User has payment method, invoice billing, or billing is disabled
        // Proceed with direct subscription creation
        const response = await createRepositorySubscription({
          client,
          path: { graph_id: subscriptionData.repository_name },
          body: {
            plan_name: subscriptionData.plan_name,
          },
        })

        if (response.error) {
          const errorMsg =
            typeof response.error === 'object' && 'detail' in response.error
              ? String(response.error.detail)
              : 'Failed to create repository subscription'
          throw new Error(errorMsg)
        }

        setIsSubscribing(false)
        return response.data
      } catch (error) {
        console.error('Repository subscription failed:', error)
        setIsSubscribing(false)
        throw error
      }
    },
    []
  )

  return {
    isSubscribing,
    subscribe,
  }
}

/**
 * Hook for monitoring multiple operations simultaneously
 */
export function useMultipleOperations() {
  const [operations, setOperations] = useState<
    Map<string, OperationMonitorState>
  >(new Map())

  // Keep a ref to the latest operations for cleanup without triggering effect re-runs
  const operationsRef = useRef(operations)

  // Update ref whenever operations change
  useEffect(() => {
    operationsRef.current = operations
  }, [operations])

  const addOperation = useCallback(
    async (operationId: string, options?: { timeout?: number }) => {
      // Initialize state for this operation
      setOperations((prev) => {
        const newMap = new Map(prev)
        newMap.set(operationId, {
          isLoading: true,
          isMonitoring: true,
          progress: 0,
          currentStep: 'Starting...',
          error: null,
          operationId,
          result: null,
          status: 'pending',
        })
        return newMap
      })

      try {
        const result = await operationMonitor.monitorOperation({
          operationId,
          timeout: options?.timeout,
          onProgress: (progress) => {
            setOperations((prev) => {
              const newMap = new Map(prev)
              const current = newMap.get(operationId)
              if (current) {
                newMap.set(operationId, {
                  ...current,
                  progress: progress.percent,
                  currentStep: progress.message,
                  status: 'running',
                })
              }
              return newMap
            })
          },
          onComplete: (result) => {
            setOperations((prev) => {
              const newMap = new Map(prev)
              const current = newMap.get(operationId)
              if (current) {
                newMap.set(operationId, {
                  ...current,
                  isLoading: false,
                  isMonitoring: false,
                  progress: 100,
                  currentStep: 'Completed',
                  result: result,
                  status: 'completed',
                })
              }
              return newMap
            })
          },
          onError: (errorMsg) => {
            setOperations((prev) => {
              const newMap = new Map(prev)
              const current = newMap.get(operationId)
              if (current) {
                newMap.set(operationId, {
                  ...current,
                  isLoading: false,
                  isMonitoring: false,
                  error: errorMsg,
                  result: null,
                  status: 'failed',
                })
              }
              return newMap
            })
          },
        })

        return result
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error'
        setOperations((prev) => {
          const newMap = new Map(prev)
          const current = newMap.get(operationId)
          if (current) {
            newMap.set(operationId, {
              ...current,
              isLoading: false,
              isMonitoring: false,
              error: errorMessage,
              result: null,
              status: 'failed',
            })
          }
          return newMap
        })
        throw error
      }
    },
    []
  )

  const cancelOperation = useCallback(async (operationId: string) => {
    await operationMonitor.cancelOperation(operationId)
    setOperations((prev) => {
      const newMap = new Map(prev)
      const current = newMap.get(operationId)
      if (current) {
        newMap.set(operationId, {
          ...current,
          isLoading: false,
          isMonitoring: false,
          status: 'cancelled',
          error: 'Operation was cancelled',
        })
      }
      return newMap
    })
  }, [])

  const removeOperation = useCallback((operationId: string) => {
    setOperations((prev) => {
      const newMap = new Map(prev)
      newMap.delete(operationId)
      return newMap
    })
  }, [])

  const clearAll = useCallback(() => {
    // Cancel all active operations
    for (const [operationId, state] of operations) {
      if (state.isLoading) {
        operationMonitor.cancelOperation(operationId)
      }
    }
    setOperations(new Map())
  }, [operations])

  // Cleanup on unmount - use ref to avoid stale closures
  useEffect(() => {
    return () => {
      for (const [operationId, state] of operationsRef.current) {
        if (state.isLoading) {
          operationMonitor.cancelOperation(operationId)
        }
      }
    }
  }, [])

  return {
    operations: Array.from(operations.values()),
    addOperation,
    cancelOperation,
    removeOperation,
    clearAll,
  }
}

/**
 * Helper to determine if an operation is still active
 */
export function isOperationActive(status: OperationStatus | null): boolean {
  return status === 'pending' || status === 'running'
}

/**
 * Helper to get progress color based on status
 */
export function getProgressColor(status: OperationStatus | null): string {
  switch (status) {
    case 'completed':
      return 'text-green-600'
    case 'failed':
      return 'text-red-600'
    case 'cancelled':
      return 'text-yellow-600'
    case 'running':
      return 'text-blue-600'
    default:
      return 'text-gray-600'
  }
}
