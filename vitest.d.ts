import '@testing-library/jest-dom/vitest'
import 'vitest'
import type { vi } from 'vitest'

declare global {
  // eslint-disable-next-line no-var
  var jest: typeof vi
  // eslint-disable-next-line no-var
  var mockFetch: (data: unknown) => void
}
