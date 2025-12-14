/**
 * Operation Monitor - SSE-based monitoring for unified backend operations
 * Replaces the polling-based TaskMonitor with EventSource streaming
 *
 * Uses SDK extensions when available (@robosystems/client v0.1.21+)
 * No fallback - fails fast if SDK extensions not available
 */

import { client } from '@robosystems/client'

// Import SDK extensions - check at runtime
const getSDKExtensions = async () => {
  try {
    return await import('@robosystems/client/extensions')
  } catch (error) {
    console.error('SDK extensions not available:', error)
    return null
  }
}

export type OperationStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'

export interface OperationEvent {
  event: string
  data: any
  timestamp?: string
}

export interface OperationProgress {
  percent: number
  message?: string
  current_step?: string
  total_steps?: number
}

export interface OperationResult {
  operation_id: string
  status: OperationStatus
  result?: any
  error?: string
  duration_ms?: number
  events?: OperationEvent[]
}

export interface OperationMonitorOptions {
  operationId: string
  onProgress?: (progress: OperationProgress) => void
  onComplete?: (result: any) => void
  onError?: (error: string) => void
  onEvent?: (event: OperationEvent) => void
  timeout?: number // milliseconds, default 5 minutes
}

export class OperationMonitor {
  private static instance: OperationMonitor
  private activeOperations = new Map<string, EventSource>()
  private operationResults = new Map<string, OperationResult>()

  static getInstance(): OperationMonitor {
    if (!OperationMonitor.instance) {
      OperationMonitor.instance = new OperationMonitor()
    }
    return OperationMonitor.instance
  }

  /**
   * Monitor an operation using SSE streaming
   */
  async monitorOperation({
    operationId,
    onProgress,
    onComplete,
    onError,
    onEvent,
    timeout = 300000, // 5 minutes default
  }: OperationMonitorOptions): Promise<OperationResult> {
    // Get SDK extensions at runtime
    const sdkExtensions = await getSDKExtensions()

    // Require SDK extensions - fail fast if not available
    if (!sdkExtensions?.OperationClient) {
      throw new Error(
        'SDK extensions not available. Please install @robosystems/client with extensions support.'
      )
    }

    return this.monitorWithSDKExtensions(
      {
        operationId,
        onProgress,
        onComplete,
        onError,
        onEvent,
        timeout,
      },
      sdkExtensions
    )
  }

  /**
   * Cancel operation monitoring (does not cancel the operation itself)
   */
  cancelOperation(operationId: string): boolean {
    try {
      const eventSource = this.activeOperations.get(operationId)
      if (eventSource) {
        eventSource.close()
        this.activeOperations.delete(operationId)
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to cancel operation:', error)
      return false
    }
  }

  /**
   * Get cached operation status/result
   */
  getOperationStatus(operationId: string): OperationResult | null {
    if (this.operationResults.has(operationId)) {
      return this.operationResults.get(operationId)!
    }

    try {
      const config = client.getConfig()
      const baseUrl = config.baseUrl || 'http://localhost:8000'
      // This would need to be implemented as a sync call or return cached data only
      // For now, just return cached results
      return null
    } catch (error) {
      console.error('Failed to get operation status:', error)
      return null
    }
  }

  /**
   * Clean up operation monitoring resources
   */
  private cleanupOperation(operationId: string): void {
    const eventSource = this.activeOperations.get(operationId)
    if (eventSource) {
      eventSource.close()
      this.activeOperations.delete(operationId)
    }
  }

  /**
   * Monitor operation using SDK extensions
   */
  private async monitorWithSDKExtensions(
    options: OperationMonitorOptions,
    sdkExtensions: any
  ): Promise<OperationResult> {
    const { OperationClient, extractTokenFromSDKClient } = sdkExtensions
    const { getToken } = await import('../auth-core/token-storage')
    const config = client.getConfig()

    const jwtToken = getToken() || extractTokenFromSDKClient()

    // Create operation client with proper configuration
    const operationClient = new OperationClient({
      baseUrl: config.baseUrl || 'http://localhost:8000',
      credentials: 'include',
      token: jwtToken,
      maxRetries: 3,
      retryDelay: 1000,
    })

    try {
      const result = await operationClient.monitorOperation(
        options.operationId,
        {
          onProgress: (progress: {
            progressPercent?: number
            message?: string
            details?: { current_step?: number; total_steps?: number }
          }) => {
            options.onProgress?.({
              percent: progress.progressPercent || 0,
              message: progress.message || '',
              current_step: progress.details?.current_step?.toString(),
              total_steps: progress.details?.total_steps,
            })
          },
          onEvent: (event: { type: string; data: any }) => {
            options.onEvent?.({
              event: event.type,
              data: event.data,
            })
          },
          timeout: options.timeout,
        }
      )

      // Map OperationResult (success: boolean) to status string
      const status: OperationStatus = result.success
        ? 'completed'
        : result.error === 'Operation cancelled'
          ? 'cancelled'
          : 'failed'

      // Normalize to documented shape
      const normalizedResult: OperationResult = {
        operation_id: options.operationId,
        status,
        result: result.result,
        error: result.error,
      }

      // Store normalized result in cache
      this.operationResults.set(options.operationId, normalizedResult)

      // Handle different success/failure states properly
      if (status === 'completed') {
        options.onComplete?.(result.result || {})
      } else if (status === 'failed') {
        options.onError?.(result.error || 'Operation failed')
      } else if (status === 'cancelled') {
        options.onError?.(result.error || 'Operation cancelled')
      }

      return normalizedResult
    } finally {
      operationClient.closeAll()
    }
  }

  /**
   * Clean up all active operations
   */
  cleanup(): void {
    for (const [, eventSource] of this.activeOperations.entries()) {
      eventSource.close()
    }
    this.activeOperations.clear()
  }

  /**
   * Get list of active operation IDs
   */
  getActiveOperations(): string[] {
    return Array.from(this.activeOperations.keys())
  }

  /**
   * Clear operation results cache
   */
  clearCache(): void {
    this.operationResults.clear()
  }
}

// Export singleton instance and convenience functions
export const operationMonitor = OperationMonitor.getInstance()

export const monitorOperation = (options: OperationMonitorOptions) => {
  return operationMonitor.monitorOperation(options)
}

export const cancelOperation = (operationId: string) => {
  return operationMonitor.cancelOperation(operationId)
}

export const getOperationStatus = (operationId: string) => {
  return operationMonitor.getOperationStatus(operationId)
}

export const getActiveOperations = () => {
  return operationMonitor.getActiveOperations()
}
