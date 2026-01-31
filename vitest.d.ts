import '@testing-library/jest-dom/vitest'
import 'vitest'
import type { vi } from 'vitest'

declare global {
  var jest: typeof vi

  var mockFetch: (data: unknown) => void
}
