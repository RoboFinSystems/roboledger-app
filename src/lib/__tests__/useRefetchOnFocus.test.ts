import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useRefetchOnFocus } from '../useRefetchOnFocus'

const setVisibility = (state: 'visible' | 'hidden') =>
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  })

describe('useRefetchOnFocus', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setVisibility('visible')
  })
  afterEach(() => vi.useRealTimers())

  it('does not refetch on focus inside the interval', () => {
    const refetch = vi.fn()
    renderHook(() => useRefetchOnFocus(refetch, 1000))
    window.dispatchEvent(new Event('focus'))
    expect(refetch).not.toHaveBeenCalled()
  })

  it('refetches once when focus and visibility fire together', () => {
    const refetch = vi.fn()
    renderHook(() => useRefetchOnFocus(refetch, 1000))
    vi.advanceTimersByTime(1500)
    window.dispatchEvent(new Event('focus'))
    document.dispatchEvent(new Event('visibilitychange'))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('ignores a visibility change to hidden', () => {
    const refetch = vi.fn()
    renderHook(() => useRefetchOnFocus(refetch, 1000))
    vi.advanceTimersByTime(1500)
    setVisibility('hidden')
    document.dispatchEvent(new Event('visibilitychange'))
    expect(refetch).not.toHaveBeenCalled()
  })

  it('calls the latest callback', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { rerender } = renderHook(({ cb }) => useRefetchOnFocus(cb, 1000), {
      initialProps: { cb: first },
    })
    rerender({ cb: second })
    vi.advanceTimersByTime(1500)
    window.dispatchEvent(new Event('focus'))
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('stops listening on unmount', () => {
    const refetch = vi.fn()
    const { unmount } = renderHook(() => useRefetchOnFocus(refetch, 1000))
    unmount()
    vi.advanceTimersByTime(1500)
    window.dispatchEvent(new Event('focus'))
    expect(refetch).not.toHaveBeenCalled()
  })
})
