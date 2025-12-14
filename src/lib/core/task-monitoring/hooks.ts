'use client'

import * as SDK from '@robosystems/client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { taskMonitor } from './taskMonitor'
import type { TaskMonitorState, TaskStatusResponse } from './types'

export interface UseTaskMonitoringResult extends TaskMonitorState {
  startMonitoring: (
    taskId: string,
    options?: { maxAttempts?: number; pollInterval?: number }
  ) => Promise<any>
  cancelTask: () => Promise<void>
  reset: () => void
}

export function useTaskMonitoring(): UseTaskMonitoringResult {
  const [state, setState] = useState<TaskMonitorState>({
    isLoading: false,
    progress: null,
    currentStep: null,
    error: null,
    taskId: null,
    result: null,
  })

  const currentTaskId = useRef<string | null>(null)

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      progress: null,
      currentStep: null,
      error: null,
      taskId: null,
      result: null,
    })
    currentTaskId.current = null
  }, [])

  const cancelTask = useCallback(async () => {
    if (currentTaskId.current) {
      try {
        await taskMonitor.cancelTask(currentTaskId.current)
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Task was cancelled',
          result: null,
        }))
      } catch (error) {
        console.error('Failed to cancel task:', error)
        setState((prev) => ({
          ...prev,
          error: 'Failed to cancel task',
          result: null,
        }))
      }
    }
  }, [])

  const startMonitoring = useCallback(
    async (
      taskId: string,
      options?: { maxAttempts?: number; pollInterval?: number }
    ) => {
      currentTaskId.current = taskId
      setState({
        isLoading: true,
        progress: null,
        currentStep: null,
        error: null,
        taskId,
        result: null,
      })

      try {
        const result = await taskMonitor.pollTask({
          taskId,
          maxAttempts: options?.maxAttempts,
          pollInterval: options?.pollInterval,
          onProgress: (status: TaskStatusResponse) => {
            setState((prev) => ({
              ...prev,
              progress: status.progress || null,
              currentStep: status.step || status.message || 'Processing...',
            }))
          },
          onComplete: (result) => {
            setState((prev) => ({
              ...prev,
              isLoading: false,
              progress: 100,
              currentStep: 'Completed',
              result: result,
            }))
          },
          onError: (errorMsg) => {
            setState((prev) => ({
              ...prev,
              isLoading: false,
              error: errorMsg,
              result: null,
            }))
          },
        })

        return result.details || result
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error'
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
          result: null,
        }))
        throw error
      } finally {
        currentTaskId.current = null
      }
    },
    []
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentTaskId.current) {
        taskMonitor.cancelTask(currentTaskId.current)
      }
    }
  }, [])

  return {
    ...state,
    startMonitoring,
    cancelTask,
    reset,
  }
}

// Convenience hook for entity creation specifically
export function useEntityCreationTask() {
  const taskMonitoring = useTaskMonitoring()

  const createEntityWithGraph = useCallback(
    async (entityData: any) => {
      try {
        // Call the SDK function to create company with new graph
        // Note: createCompanyWithNewGraph function does not exist in SDK
        // This is a placeholder implementation
        const response = await SDK.createGraph({
          body: entityData,
        })

        // The response is typed as unknown, but should contain task_id
        const responseData = response.data as {
          task_id: string
          status: string
          message?: string
        }

        if (!responseData?.task_id) {
          throw new Error('No task ID returned from company creation')
        }

        // Start monitoring the task
        const result = await taskMonitoring.startMonitoring(
          responseData.task_id
        )
        return result
      } catch (error) {
        console.error('Company creation failed:', error)
        throw error
      }
    },
    [taskMonitoring]
  )

  return {
    ...taskMonitoring,
    createEntityWithGraph,
  }
}

// Helper function to get progress percentage from step name
export function getProgressFromStep(step?: string | null): number {
  if (!step) return 0

  const stepProgress: Record<string, number> = {
    initializing: 10,
    checking_mode: 20,
    creating_database: 40,
    installing_labels: 60,
    creating_company: 80,
    updating_user_graph: 90,
    completed: 100,
  }

  return stepProgress[step.toLowerCase()] || 0
}
