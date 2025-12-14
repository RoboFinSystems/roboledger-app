import '@testing-library/jest-dom/vitest'
import { beforeEach, vi } from 'vitest'

globalThis.jest = vi

vi.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '',
      query: {},
      asPath: '',
      push: vi.fn(),
      replace: vi.fn(),
    }
  },
}))

vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
    }
  },
  usePathname() {
    return ''
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

globalThis.fetch = vi.fn() as unknown as typeof fetch

globalThis.mockFetch = (data: unknown) => {
  ;(
    globalThis.fetch as unknown as ReturnType<typeof vi.fn>
  ).mockImplementationOnce(() =>
    Promise.resolve({
      json: () => Promise.resolve(data),
    })
  )
}

beforeEach(() => {
  // Note: Not clearing mocks globally to preserve test-specific mock setup
  // Individual test files can call vi.clearAllMocks() or vi.resetAllMocks() as needed
})
