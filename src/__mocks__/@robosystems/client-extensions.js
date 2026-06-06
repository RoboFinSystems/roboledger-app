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

// Lazy client singleton used by feature components (e.g. clients.ledger).
// Each per-domain client exposes vi.fn() methods so tests can spy/override.
export const clients = {
  ledger: {
    getAccountTree: vi.fn().mockResolvedValue({ roots: [], totalAccounts: 0 }),
  },
}
