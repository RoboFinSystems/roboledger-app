import { vi } from 'vitest'

export const createUserApiKey = vi.fn().mockResolvedValue({
  data: {
    key: 'mock-api-key',
  },
  error: null,
})
