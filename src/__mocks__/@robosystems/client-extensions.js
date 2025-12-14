// Mock implementation of @robosystems/client/extensions for Vitest tests
import { vi } from 'vitest'

export const useQuery = vi.fn()

export const streamQuery = vi.fn()

export class OperationClient {
  constructor() {
    this.monitorOperation = vi.fn()
    this.closeAll = vi.fn()
  }
}

// Re-export client for compatibility
export const client = {
  getConfig: vi.fn(),
  setConfig: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}
