import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cancelTask,
  getActiveTasks,
  pollTaskStatus,
  TaskMonitor,
  taskMonitor,
} from '../taskMonitor'

vi.useFakeTimers()

import { cancelOperation, getOperationStatus } from '@robosystems/client'

const mockGetOperationStatus = vi.mocked(getOperationStatus)
const mockCancelOperation = vi.mocked(cancelOperation)

describe('TaskMonitor', () => {
  let taskMonitorInstance: TaskMonitor

  beforeEach(() => {
    vi.clearAllMocks()
    taskMonitorInstance = new TaskMonitor()
    // Clear any existing tasks
    ;(taskMonitorInstance as any).activeTasks.clear()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = TaskMonitor.getInstance()
      const instance2 = TaskMonitor.getInstance()
      expect(instance1).toBe(instance2)
    })

    it('should export the singleton instance', () => {
      expect(taskMonitor).toBe(TaskMonitor.getInstance())
    })
  })

  describe('pollTask', () => {
    const mockTaskId = 'test-task-123'

    it('should successfully poll a task until completion', async () => {
      const mockStatusResponse = {
        status: 'completed',
        details: { result: 'success' },
        message: 'Task completed successfully',
      }

      mockGetOperationStatus.mockResolvedValue({
        data: mockStatusResponse,
        request: {} as Request,
        response: {} as Response,
      })

      const onProgress = vi.fn()
      const onComplete = vi.fn()
      const onError = vi.fn()

      const pollPromise = taskMonitorInstance.pollTask({
        taskId: mockTaskId,
        onProgress,
        onComplete,
        onError,
        pollInterval: 100,
      })

      // Fast-forward time to trigger polling
      vi.advanceTimersByTime(100)

      const result = await pollPromise

      expect(mockGetOperationStatus).toHaveBeenCalledWith({
        path: { operation_id: mockTaskId },
      })
      expect(onProgress).not.toHaveBeenCalled()
      expect(onComplete).toHaveBeenCalledWith(mockStatusResponse.details)
      expect(onError).not.toHaveBeenCalled()
      expect(result).toEqual(mockStatusResponse)
    })

    it('should poll task in progress and continue polling', async () => {
      const inProgressStatus = {
        status: 'in_progress',
        progress: { percent: 50, message: 'Processing...' },
      }

      const completedStatus = {
        status: 'completed',
        details: { result: 'done' },
      }

      mockGetOperationStatus
        .mockResolvedValueOnce({
          data: inProgressStatus,
          request: {} as Request,
          response: {} as Response,
        })
        .mockResolvedValueOnce({
          data: completedStatus,
          request: {} as Request,
          response: {} as Response,
        })

      const onProgress = vi.fn()
      const onComplete = vi.fn()
      const onError = vi.fn()

      const pollPromise = taskMonitorInstance.pollTask({
        taskId: mockTaskId,
        onProgress,
        onComplete,
        onError,
        pollInterval: 100,
      })

      // First poll
      vi.advanceTimersByTime(100)
      await Promise.resolve() // Allow first poll to complete

      // Second poll
      vi.advanceTimersByTime(100)

      const result = await pollPromise

      expect(mockGetOperationStatus).toHaveBeenCalledTimes(2)
      expect(onProgress).toHaveBeenCalledWith(inProgressStatus)
      expect(onComplete).toHaveBeenCalledWith(completedStatus.details)
      expect(onError).not.toHaveBeenCalled()
      expect(result).toEqual(completedStatus)
    })

    it('should handle task failure', async () => {
      const failedStatus = {
        status: 'failed',
        message: 'Task execution failed',
        details: { error: 'Database error' },
      }

      mockGetOperationStatus.mockResolvedValue({
        data: failedStatus,
        request: {} as Request,
        response: {} as Response,
      })

      const onProgress = vi.fn()
      const onComplete = vi.fn()
      const onError = vi.fn()

      const pollPromise = taskMonitorInstance.pollTask({
        taskId: mockTaskId,
        onProgress,
        onComplete,
        onError,
        pollInterval: 100,
      })

      vi.advanceTimersByTime(100)

      await expect(pollPromise).rejects.toThrow('Task execution failed')
      expect(onError).toHaveBeenCalledWith('Task execution failed')
      expect(onComplete).not.toHaveBeenCalled()
    })

    it('should handle task cancellation', async () => {
      const cancelledStatus = {
        status: 'cancelled',
        message: 'Task was cancelled by user',
      }

      mockGetOperationStatus.mockResolvedValue({
        data: cancelledStatus,
        request: {} as Request,
        response: {} as Response,
      })

      const onProgress = vi.fn()
      const onComplete = vi.fn()
      const onError = vi.fn()

      const pollPromise = taskMonitorInstance.pollTask({
        taskId: mockTaskId,
        onProgress,
        onComplete,
        onError,
        pollInterval: 100,
      })

      vi.advanceTimersByTime(100)

      await expect(pollPromise).rejects.toThrow('Task was cancelled')
      expect(onError).toHaveBeenCalledWith('Task was cancelled')
    })

    it('should handle retrying status', async () => {
      const retryingStatus = {
        status: 'retrying',
        progress: { percent: 25, message: 'Retrying...' },
      }

      const completedStatus = {
        status: 'completed',
        details: { result: 'success' },
      }

      mockGetOperationStatus
        .mockResolvedValueOnce({
          data: retryingStatus,
          request: {} as Request,
          response: {} as Response,
        })
        .mockResolvedValueOnce({
          data: completedStatus,
          request: {} as Request,
          response: {} as Response,
        })

      const onProgress = vi.fn()
      const onComplete = vi.fn()
      const onError = vi.fn()

      const pollPromise = taskMonitorInstance.pollTask({
        taskId: mockTaskId,
        onProgress,
        onComplete,
        onError,
        pollInterval: 100,
      })

      // First poll (retrying)
      vi.advanceTimersByTime(100)
      await Promise.resolve()

      // Second poll (completed)
      vi.advanceTimersByTime(100)

      const result = await pollPromise

      expect(onProgress).toHaveBeenCalledWith(retryingStatus)
      expect(onComplete).toHaveBeenCalledWith(completedStatus.details)
      expect(result).toEqual(completedStatus)
    })

    it('should handle unknown status as in_progress', async () => {
      const unknownStatus = {
        status: 'unknown_status',
        progress: { percent: 10, message: 'Processing...' },
      }

      const completedStatus = {
        status: 'completed',
        details: { result: 'done' },
      }

      mockGetOperationStatus
        .mockResolvedValueOnce({
          data: unknownStatus,
          request: {} as Request,
          response: {} as Response,
        })
        .mockResolvedValueOnce({
          data: completedStatus,
          request: {} as Request,
          response: {} as Response,
        })

      const onProgress = vi.fn()
      const onComplete = vi.fn()
      const onError = vi.fn()

      const pollPromise = taskMonitorInstance.pollTask({
        taskId: mockTaskId,
        onProgress,
        onComplete,
        onError,
        pollInterval: 100,
      })

      // First poll (unknown status)
      vi.advanceTimersByTime(100)
      await Promise.resolve()

      // Second poll (completed)
      vi.advanceTimersByTime(100)

      const result = await pollPromise

      expect(onProgress).toHaveBeenCalledWith(unknownStatus)
      expect(onComplete).toHaveBeenCalledWith(completedStatus.details)
      expect(result).toEqual(completedStatus)
    })

    it('should timeout after max attempts', async () => {
      const pendingStatus = {
        status: 'pending',
        progress: { percent: 0, message: 'Waiting...' },
      }

      mockGetOperationStatus.mockResolvedValue({
        data: pendingStatus,
        request: {} as Request,
        response: {} as Response,
      })

      const onProgress = vi.fn()
      const onComplete = vi.fn()
      const onError = vi.fn()

      const pollPromise = taskMonitorInstance.pollTask({
        taskId: mockTaskId,
        onProgress,
        onComplete,
        onError,
        pollInterval: 100,
        maxAttempts: 3,
      })

      // Run all attempts
      for (let i = 0; i < 3; i++) {
        vi.advanceTimersByTime(100)
        await Promise.resolve()
      }

      await expect(pollPromise).rejects.toThrow(
        'Task polling timeout after 3 attempts'
      )
      expect(onError).toHaveBeenCalledWith(
        'Task polling timeout after 3 attempts'
      )
      expect(onComplete).not.toHaveBeenCalled()
    })

    it('should handle API errors gracefully', async () => {
      mockGetOperationStatus.mockRejectedValue(new Error('Network error'))

      const onProgress = vi.fn()
      const onComplete = vi.fn()
      const onError = vi.fn()

      const pollPromise = taskMonitorInstance.pollTask({
        taskId: mockTaskId,
        onProgress,
        onComplete,
        onError,
        pollInterval: 100,
      })

      vi.advanceTimersByTime(100)

      await expect(pollPromise).rejects.toThrow('Network error')
      expect(onError).toHaveBeenCalledWith('Network error')
    })

    it('should handle missing response data', async () => {
      mockGetOperationStatus.mockResolvedValue({
        data: null,
        request: {} as Request,
        response: {} as Response,
      })

      const onProgress = vi.fn()
      const onComplete = vi.fn()
      const onError = vi.fn()

      const pollPromise = taskMonitorInstance.pollTask({
        taskId: mockTaskId,
        onProgress,
        onComplete,
        onError,
        pollInterval: 100,
      })

      vi.advanceTimersByTime(100)

      await expect(pollPromise).rejects.toThrow(
        'No data received from task status endpoint'
      )
      expect(onError).toHaveBeenCalledWith(
        'No data received from task status endpoint'
      )
    })

    it('should respect custom poll interval', async () => {
      const pendingStatus = {
        status: 'pending',
        progress: { percent: 0 },
      }

      mockGetOperationStatus.mockResolvedValue({
        data: pendingStatus,
        request: {} as Request,
        response: {} as Response,
      })

      const pollPromise = taskMonitorInstance.pollTask({
        taskId: mockTaskId,
        pollInterval: 500,
        maxAttempts: 2,
      })

      vi.advanceTimersByTime(500)
      await Promise.resolve()
      expect(mockGetOperationStatus).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(500)
      await Promise.resolve()
      expect(mockGetOperationStatus).toHaveBeenCalledTimes(2)

      await taskMonitorInstance.cancelTask(mockTaskId)
      vi.advanceTimersByTime(500)
      await expect(pollPromise).rejects.toThrow()
    })

    it('should allow cancellation during polling', async () => {
      const pendingStatus = {
        status: 'pending',
        progress: { percent: 0 },
      }

      let resolveStatus: (value: any) => void
      mockGetOperationStatus.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveStatus = resolve
        }) as any
      )

      const onProgress = vi.fn()
      const onComplete = vi.fn()
      const onError = vi.fn()

      const pollPromise = taskMonitorInstance.pollTask({
        taskId: mockTaskId,
        onProgress,
        onComplete,
        onError,
        pollInterval: 100,
      })

      resolveStatus!({
        data: pendingStatus,
        request: {} as Request,
        response: {} as Response,
      })
      await Promise.resolve()

      const cancelResult = await taskMonitorInstance.cancelTask(mockTaskId)

      expect(cancelResult).toBe(true)
      vi.advanceTimersByTime(100)
      await Promise.resolve()
      await expect(pollPromise).rejects.toThrow('Task polling was cancelled')
      expect(onError).not.toHaveBeenCalled()
    })
  })

  describe('cancelTask', () => {
    const mockTaskId = 'test-task-123'

    it('should cancel active task successfully', async () => {
      // Set up an active task
      const abortController = new AbortController()
      ;(taskMonitorInstance as any).activeTasks.set(mockTaskId, abortController)

      mockCancelOperation.mockResolvedValue({
        data: { success: true },
        request: {} as Request,
        response: {} as Response,
      })

      const result = await taskMonitorInstance.cancelTask(mockTaskId)

      expect(result).toBe(true)
      expect(mockCancelOperation).toHaveBeenCalledWith({
        path: { operation_id: mockTaskId },
      })
      expect((taskMonitorInstance as any).activeTasks.has(mockTaskId)).toBe(
        false
      )
    })

    it('should handle task not found', async () => {
      mockCancelOperation.mockResolvedValue({
        data: { success: true },
        request: {} as Request,
        response: {} as Response,
      })

      const result = await taskMonitorInstance.cancelTask('non-existent-task')

      expect(result).toBe(true)
      expect(mockCancelOperation).toHaveBeenCalledWith({
        path: { operation_id: 'non-existent-task' },
      })
    })

    it('should handle API errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      mockCancelOperation.mockRejectedValue(new Error('API Error'))

      const result = await taskMonitorInstance.cancelTask(mockTaskId)

      expect(result).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to cancel task:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('cancelAllTasks', () => {
    it('should cancel all active tasks', () => {
      const abortController1 = new AbortController()
      const abortController2 = new AbortController()

      ;(taskMonitorInstance as any).activeTasks.set('task1', abortController1)
      ;(taskMonitorInstance as any).activeTasks.set('task2', abortController2)

      taskMonitorInstance.cancelAllTasks()

      expect(abortController1.signal.aborted).toBe(true)
      expect(abortController2.signal.aborted).toBe(true)
      expect((taskMonitorInstance as any).activeTasks.size).toBe(0)
    })
  })

  describe('getActiveTasks', () => {
    it('should return list of active task IDs', () => {
      ;(taskMonitorInstance as any).activeTasks.set(
        'task1',
        new AbortController()
      )
      ;(taskMonitorInstance as any).activeTasks.set(
        'task2',
        new AbortController()
      )
      ;(taskMonitorInstance as any).activeTasks.set(
        'task3',
        new AbortController()
      )

      const activeTasks = taskMonitorInstance.getActiveTasks()

      expect(activeTasks).toEqual(['task1', 'task2', 'task3'])
    })

    it('should return empty array when no active tasks', () => {
      const activeTasks = taskMonitorInstance.getActiveTasks()

      expect(activeTasks).toEqual([])
    })
  })

  describe('Utility Functions', () => {
    it('should export pollTaskStatus utility', async () => {
      const mockStatusResponse = {
        status: 'completed',
        details: { result: 'success' },
      }

      mockGetOperationStatus.mockResolvedValue({
        data: mockStatusResponse,
        request: {} as Request,
        response: {} as Response,
      })

      const result = await pollTaskStatus({
        taskId: 'test-task',
        pollInterval: 100,
      })

      expect(result).toEqual(mockStatusResponse)
    })

    it('should export cancelTask utility', async () => {
      mockCancelOperation.mockResolvedValue({
        data: { success: true },
        request: {} as Request,
        response: {} as Response,
      })

      const result = await cancelTask('test-task')

      expect(result).toBe(true)
    })

    it('should export getActiveTasks utility', () => {
      ;(taskMonitor as any).activeTasks.set('task1', new AbortController())

      const activeTasks = getActiveTasks()

      expect(activeTasks).toEqual(['task1'])
      ;(taskMonitor as any).activeTasks.clear()
    })
  })

  describe('Error Handling', () => {
    it('should handle non-Error exceptions', async () => {
      mockGetOperationStatus.mockRejectedValue('String error')

      const pollPromise = taskMonitorInstance.pollTask({
        taskId: 'test-task',
        pollInterval: 100,
      })

      vi.advanceTimersByTime(100)

      await expect(pollPromise).rejects.toThrow('String error')
    })

    it('should clean up active tasks on error', async () => {
      mockGetOperationStatus.mockRejectedValue(new Error('API Error'))

      const pollPromise = taskMonitorInstance.pollTask({
        taskId: 'test-task',
        pollInterval: 100,
      })

      vi.advanceTimersByTime(100)

      await expect(pollPromise).rejects.toThrow('API Error')
      expect((taskMonitorInstance as any).activeTasks.has('test-task')).toBe(
        false
      )
    })

    it('should clean up active tasks on completion', async () => {
      const mockStatusResponse = {
        status: 'completed',
        details: { result: 'success' },
      }

      mockGetOperationStatus.mockResolvedValue({
        data: mockStatusResponse,
        request: {} as Request,
        response: {} as Response,
      })

      await taskMonitorInstance.pollTask({
        taskId: 'test-task',
        pollInterval: 100,
      })

      expect((taskMonitorInstance as any).activeTasks.has('test-task')).toBe(
        false
      )
    })

    it('should clean up active tasks on failure', async () => {
      const mockStatusResponse = {
        status: 'failed',
        message: 'Task failed',
      }

      mockGetOperationStatus.mockResolvedValue({
        data: mockStatusResponse,
        request: {} as Request,
        response: {} as Response,
      })

      await expect(
        taskMonitorInstance.pollTask({
          taskId: 'test-task',
          pollInterval: 100,
        })
      ).rejects.toThrow('Task failed')

      expect((taskMonitorInstance as any).activeTasks.has('test-task')).toBe(
        false
      )
    })
  })
})
