import * as SDK from '@robosystems/client'
import type { TaskPollingOptions, TaskStatusResponse } from './types'

export class TaskMonitor {
  private static instance: TaskMonitor
  private activeTasks = new Map<string, AbortController>()

  static getInstance(): TaskMonitor {
    if (!TaskMonitor.instance) {
      TaskMonitor.instance = new TaskMonitor()
    }
    return TaskMonitor.instance
  }

  async pollTask({
    taskId,
    onProgress,
    onComplete,
    onError,
    pollInterval = 2000,
    maxAttempts = 150, // 5 minutes at 2s intervals
  }: TaskPollingOptions): Promise<TaskStatusResponse> {
    let attempts = 0
    const abortController = new AbortController()
    this.activeTasks.set(taskId, abortController)

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          if (abortController.signal.aborted) {
            this.activeTasks.delete(taskId)
            reject(new Error('Task polling was cancelled'))
            return
          }

          attempts++

          const response = await SDK.getOperationStatus({
            path: { operation_id: taskId },
          })

          if (!response.data) {
            throw new Error('No data received from task status endpoint')
          }

          const status = response.data as unknown as TaskStatusResponse

          switch (status.status) {
            case 'pending':
            case 'in_progress':
            case 'retrying':
              onProgress?.(status)

              if (attempts < maxAttempts && !abortController.signal.aborted) {
                setTimeout(poll, pollInterval)
              } else if (attempts >= maxAttempts) {
                this.activeTasks.delete(taskId)
                const timeoutError = new Error(
                  `Task polling timeout after ${attempts} attempts`
                )
                onError?.(timeoutError.message)
                reject(timeoutError)
              }
              break

            case 'completed':
              this.activeTasks.delete(taskId)
              onComplete?.(status.details || status)
              resolve(status)
              break

            case 'failed': {
              this.activeTasks.delete(taskId)
              const failureError = new Error(
                status.message || 'Task failed without error message'
              )
              onError?.(failureError.message)
              reject(failureError)
              break
            }

            case 'cancelled': {
              this.activeTasks.delete(taskId)
              const cancelError = new Error('Task was cancelled')
              onError?.(cancelError.message)
              reject(cancelError)
              break
            }

            default:
              // Handle unknown status as in_progress
              onProgress?.(status)
              if (attempts < maxAttempts && !abortController.signal.aborted) {
                setTimeout(poll, pollInterval)
              } else if (attempts >= maxAttempts) {
                this.activeTasks.delete(taskId)
                const unknownError = new Error(
                  `Unknown task status: ${status.status}`
                )
                onError?.(unknownError.message)
                reject(unknownError)
              }
          }
        } catch (error) {
          this.activeTasks.delete(taskId)
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error occurred'
          console.error('Task polling error:', error)
          onError?.(errorMessage)
          reject(error)
        }
      }

      // Start polling
      poll()
    })
  }

  async cancelTask(taskId: string): Promise<boolean> {
    try {
      // Cancel local polling
      const abortController = this.activeTasks.get(taskId)
      if (abortController) {
        abortController.abort()
        this.activeTasks.delete(taskId)
      }

      // Cancel task on server
      await SDK.cancelOperation({
        path: { operation_id: taskId },
      })

      return true
    } catch (error) {
      console.error('Failed to cancel task:', error)
      return false
    }
  }

  cancelAllTasks(): void {
    for (const [, abortController] of this.activeTasks.entries()) {
      abortController.abort()
    }
    this.activeTasks.clear()
  }

  getActiveTasks(): string[] {
    return Array.from(this.activeTasks.keys())
  }
}

// Utility functions for easier usage
export const taskMonitor = TaskMonitor.getInstance()

export const pollTaskStatus = (options: TaskPollingOptions) => {
  return taskMonitor.pollTask(options)
}

export const cancelTask = (taskId: string) => {
  return taskMonitor.cancelTask(taskId)
}

export const getActiveTasks = () => {
  return taskMonitor.getActiveTasks()
}
