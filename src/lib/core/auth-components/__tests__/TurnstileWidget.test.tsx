import { act, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TurnstileWidget, type TurnstileWidgetRef } from '../TurnstileWidget'

// Mock the global window.turnstile object
const mockTurnstile = {
  render: vi.fn(),
  reset: vi.fn(),
  remove: vi.fn(),
  getResponse: vi.fn(),
}

// Mock script loading
const mockScriptElement = {
  onload: null as any,
  onerror: null as any,
  src: '',
  async: false,
  defer: false,
}

describe('TurnstileWidget', () => {
  const defaultProps = {
    siteKey: 'test-site-key',
    onVerify: vi.fn(),
  }

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    mockTurnstile.render.mockReturnValue('widget-id-123')

    // Store original createElement
    const originalCreateElement = document.createElement.bind(document)

    // Mock document.createElement for script injection
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'script') {
        return mockScriptElement as any
      }
      return originalCreateElement(tag)
    })

    // Mock document.head.appendChild
    vi.spyOn(document.head, 'appendChild').mockImplementation(
      (element: any) => {
        if (element === mockScriptElement) {
          // Simulate successful script load
          setTimeout(() => {
            window.turnstile = mockTurnstile
            mockScriptElement.onload?.()
          }, 0)
        }
        return element
      }
    )
  })

  afterEach(() => {
    delete window.turnstile
    vi.restoreAllMocks()
  })

  it('renders without crashing', () => {
    render(<TurnstileWidget {...defaultProps} />)
    expect(screen.getByTestId('turnstile-widget')).toBeInTheDocument()
  })

  it('loads Turnstile script and renders widget', async () => {
    const onLoad = vi.fn()
    render(<TurnstileWidget {...defaultProps} onLoad={onLoad} />)

    await waitFor(() => {
      expect(window.turnstile).toBeDefined()
      expect(onLoad).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(mockTurnstile.render).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({
          sitekey: 'test-site-key',
          callback: expect.any(Function),
          theme: 'auto',
          size: 'normal',
        })
      )
    })
  })

  it('calls onVerify when token is received', async () => {
    const onVerify = vi.fn()
    render(<TurnstileWidget {...defaultProps} onVerify={onVerify} />)

    await waitFor(() => {
      expect(mockTurnstile.render).toHaveBeenCalled()
    })

    // Get the callback function passed to turnstile.render
    const renderCall = mockTurnstile.render.mock.calls[0]
    const options = renderCall[1]
    const callback = options.callback

    // Simulate token verification
    act(() => {
      callback('test-token-123')
    })

    expect(onVerify).toHaveBeenCalledWith('test-token-123')
  })

  it('calls onError when error occurs', async () => {
    const onError = vi.fn()
    render(<TurnstileWidget {...defaultProps} onError={onError} />)

    await waitFor(() => {
      expect(mockTurnstile.render).toHaveBeenCalled()
    })

    // Get the error callback
    const renderCall = mockTurnstile.render.mock.calls[0]
    const options = renderCall[1]
    const errorCallback = options['error-callback']

    // Simulate error
    act(() => {
      errorCallback('Network error')
    })

    expect(onError).toHaveBeenCalledWith('Network error')
  })

  it('calls onExpire when token expires', async () => {
    const onExpire = vi.fn()
    render(<TurnstileWidget {...defaultProps} onExpire={onExpire} />)

    await waitFor(() => {
      expect(mockTurnstile.render).toHaveBeenCalled()
    })

    // Get the expired callback
    const renderCall = mockTurnstile.render.mock.calls[0]
    const options = renderCall[1]
    const expiredCallback = options['expired-callback']

    // Simulate expiration
    act(() => {
      expiredCallback()
    })

    expect(onExpire).toHaveBeenCalled()
  })

  it('supports different themes and sizes', async () => {
    render(<TurnstileWidget {...defaultProps} theme="dark" size="compact" />)

    await waitFor(() => {
      expect(mockTurnstile.render).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({
          theme: 'dark',
          size: 'compact',
        })
      )
    })
  })

  it('cleans up widget on unmount', async () => {
    const { unmount } = render(<TurnstileWidget {...defaultProps} />)

    await waitFor(() => {
      expect(mockTurnstile.render).toHaveBeenCalled()
    })

    unmount()

    expect(mockTurnstile.remove).toHaveBeenCalledWith('widget-id-123')
  })

  it('does not render when disabled', () => {
    render(<TurnstileWidget {...defaultProps} disabled={true} />)

    expect(mockTurnstile.render).not.toHaveBeenCalled()
  })

  it('does not render without siteKey', () => {
    render(<TurnstileWidget {...defaultProps} siteKey="" />)

    expect(screen.queryByTestId('turnstile-widget')).not.toBeInTheDocument()
  })

  it('handles script loading failure', async () => {
    const onError = vi.fn()

    // Clear the previous appendChild mock
    vi.restoreAllMocks()

    // Store original createElement
    const originalCreateElement = document.createElement.bind(document)

    // Re-mock document.createElement
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'script') {
        return mockScriptElement as any
      }
      return originalCreateElement(tag)
    })

    // Mock script loading failure
    vi.spyOn(document.head, 'appendChild').mockImplementation(
      (element: any) => {
        if (element === mockScriptElement) {
          setTimeout(() => {
            mockScriptElement.onerror?.()
          }, 0)
        }
        return element
      }
    )

    render(<TurnstileWidget {...defaultProps} onError={onError} />)

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Failed to load CAPTCHA')
    })
  })

  it('exposes reset and getResponse methods via ref', async () => {
    const ref = React.createRef<TurnstileWidgetRef>()
    mockTurnstile.getResponse.mockReturnValue('test-token')

    render(<TurnstileWidget {...defaultProps} ref={ref} />)

    await waitFor(() => {
      expect(mockTurnstile.render).toHaveBeenCalled()
    })

    // Test reset method
    act(() => {
      ref.current?.reset()
    })
    expect(mockTurnstile.reset).toHaveBeenCalledWith('widget-id-123')

    // Test getResponse method
    const response = ref.current?.getResponse()
    expect(mockTurnstile.getResponse).toHaveBeenCalledWith('widget-id-123')
    expect(response).toBe('test-token')
  })

  it('prevents multiple widget renders for same container', async () => {
    const { rerender } = render(<TurnstileWidget {...defaultProps} />)

    await waitFor(() => {
      expect(mockTurnstile.render).toHaveBeenCalledTimes(1)
    })

    // Re-render with same props
    rerender(<TurnstileWidget {...defaultProps} />)

    // Should not render again
    expect(mockTurnstile.render).toHaveBeenCalledTimes(1)
  })

  it('re-renders widget when theme changes', async () => {
    const { rerender } = render(
      <TurnstileWidget {...defaultProps} theme="light" />
    )

    await waitFor(() => {
      expect(mockTurnstile.render).toHaveBeenCalledTimes(1)
    })

    // Change theme
    rerender(<TurnstileWidget {...defaultProps} theme="dark" />)

    await waitFor(() => {
      expect(mockTurnstile.remove).toHaveBeenCalled()
      expect(mockTurnstile.render).toHaveBeenCalledTimes(2)
      expect(mockTurnstile.render).toHaveBeenLastCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({
          theme: 'dark',
        })
      )
    })
  })
})
