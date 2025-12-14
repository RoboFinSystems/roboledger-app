/* global globalThis */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OperationMonitor } from '../operationMonitor'

vi.mock('@robosystems/client', () => ({
  client: {
    getConfig: vi.fn(),
  },
}))

vi.mock('@robosystems/client/extensions', () => ({
  OperationClient: vi.fn(),
  extractTokenFromSDKClient: vi.fn(),
}))

import { client } from '@robosystems/client'
import { OperationClient } from '@robosystems/client/extensions'

const mockClient = client as unknown as {
  getConfig: ReturnType<typeof vi.fn>
}
const MockOperationClient = OperationClient as unknown as vi.Mock

describe('OperationMonitor', () => {
  let operationMonitor: OperationMonitor
  let mockEventSource: any
  let mockOperationClientInstance: {
    monitorOperation: ReturnType<typeof vi.fn>
    closeAll: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.clearAllMocks()
    operationMonitor = new OperationMonitor()

    mockEventSource = {
      close: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }
    ;(globalThis as any).EventSource = vi.fn(() => mockEventSource)

    mockOperationClientInstance = {
      monitorOperation: vi.fn(),
      closeAll: vi.fn(),
    }
    MockOperationClient.mockImplementation(() => mockOperationClientInstance)

    mockClient.getConfig.mockReturnValue({
      baseUrl: 'http://localhost:8000',
    })
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = OperationMonitor.getInstance()
      const instance2 = OperationMonitor.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('monitorOperation', () => {
    const mockOperationId = 'test-operation-123'

    it('should successfully monitor operation with SDK extensions', async () => {
      const mockResult = {
        operation_id: mockOperationId,
        success: true,
        result: { data: 'success' },
        duration_ms: 1000,
      }

      mockOperationClientInstance.monitorOperation.mockResolvedValue(mockResult)

      const onProgress = vi.fn()
      const onComplete = vi.fn()
      const onError = vi.fn()
      const onEvent = vi.fn()

      const result = await operationMonitor.monitorOperation({
        operationId: mockOperationId,
        onProgress,
        onComplete,
        onError,
        onEvent,
        timeout: 5000,
      })

      expect(mockOperationClientInstance.monitorOperation).toHaveBeenCalledWith(
        mockOperationId,
        {
          onProgress: expect.any(Function),
          onEvent: expect.any(Function),
          timeout: 5000,
        }
      )

      expect(result).toEqual({
        operation_id: mockOperationId,
        status: 'completed',
        result: mockResult.result,
        error: undefined,
      })
    })

    it('should use default timeout when not specified', async () => {
      const mockResult = {
        operation_id: mockOperationId,
        success: true,
        result: { data: 'success' },
      }

      mockOperationClientInstance.monitorOperation.mockResolvedValue(mockResult)

      await operationMonitor.monitorOperation({
        operationId: mockOperationId,
      })

      expect(mockOperationClientInstance.monitorOperation).toHaveBeenCalledWith(
        mockOperationId,
        {
          onProgress: expect.any(Function),
          onEvent: expect.any(Function),
          timeout: 300000,
        }
      )
    })

    it('should handle operation monitoring errors', async () => {
      const error = new Error('Operation monitoring failed')
      mockOperationClientInstance.monitorOperation.mockRejectedValue(error)

      await expect(
        operationMonitor.monitorOperation({
          operationId: mockOperationId,
        })
      ).rejects.toThrow('Operation monitoring failed')
    })
  })

  describe('cancelOperation', () => {
    const mockOperationId = 'test-operation-123'

    it('should cancel active operation successfully', () => {
      ;(operationMonitor as any).activeOperations.set(
        mockOperationId,
        mockEventSource
      )

      const result = operationMonitor.cancelOperation(mockOperationId)

      expect(result).toBe(true)
      expect(mockEventSource.close).toHaveBeenCalled()
      expect(
        (operationMonitor as any).activeOperations.has(mockOperationId)
      ).toBe(false)
    })

    it('should return false when operation not found', () => {
      const result = operationMonitor.cancelOperation('non-existent-operation')

      expect(result).toBe(false)
      expect(mockEventSource.close).not.toHaveBeenCalled()
    })

    it('should handle errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      mockEventSource.close.mockImplementation(() => {
        throw new Error('Close error')
      })
      ;(operationMonitor as any).activeOperations.set(
        mockOperationId,
        mockEventSource
      )

      const result = operationMonitor.cancelOperation(mockOperationId)

      expect(result).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to cancel operation:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('getOperationStatus', () => {
    it('should return cached operation result', () => {
      const operationId = 'operation-1'
      const mockResult = { operation_id: operationId, status: 'completed' }
      ;(operationMonitor as any).operationResults.set(operationId, mockResult)

      const result = operationMonitor.getOperationStatus(operationId)

      expect(result).toEqual(mockResult)
    })

    it('should return null when operation not cached', () => {
      const result = operationMonitor.getOperationStatus('missing-operation')

      expect(result).toBeNull()
    })

    it('should handle client config errors gracefully', () => {
      mockClient.getConfig.mockImplementation(() => {
        throw new Error('Config error')
      })

      const result = operationMonitor.getOperationStatus('operation-1')

      expect(result).toBeNull()
    })
  })

  describe('cleanupOperation', () => {
    it('should clean up operation resources', () => {
      const operationId = 'operation-1'
      ;(operationMonitor as any).activeOperations.set(
        operationId,
        mockEventSource
      )
      ;(operationMonitor as any).cleanupOperation(operationId)

      expect(mockEventSource.close).toHaveBeenCalled()
      expect((operationMonitor as any).activeOperations.has(operationId)).toBe(
        false
      )
    })

    it('should handle cleanup errors gracefully', () => {
      mockEventSource.close.mockImplementation(() => {
        throw new Error('Cleanup error')
      })

      const operationId = 'operation-1'
      ;(operationMonitor as any).activeOperations.set(
        operationId,
        mockEventSource
      )

      expect(() =>
        (operationMonitor as any).cleanupOperation(operationId)
      ).toThrow('Cleanup error')
    })
  })
})
