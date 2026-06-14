import type { ComponentProps } from 'react'
import { twMerge } from 'tailwind-merge'
import { Spinner } from './Spinner'

interface LoadingStateProps {
  /** Optional message shown below the spinner, e.g. "Loading dashboard…". */
  message?: string
  /** Spinner size. Defaults to `lg`. */
  size?: ComponentProps<typeof Spinner>['size']
  /**
   * Override the container's spacing/height. The default is `py-12` (a compact
   * in-content load); pass e.g. `className="h-64"` for a taller reserved area
   * or `className="min-h-screen"` to fill the viewport.
   */
  className?: string
}

/**
 * The shared content-area loader: a spinner with an optional message below,
 * centered with vertical padding. Use for section / page-content loads. For a
 * full-page shell use `<Spinner fullScreen>` / `<BrandSpinner fullScreen>`; for
 * inline button loading use a bare `<Spinner size="sm">`.
 */
export function LoadingState({
  message,
  size = 'lg',
  className,
}: LoadingStateProps) {
  return (
    <div
      className={twMerge(
        'flex flex-col items-center justify-center gap-3 py-12',
        className
      )}
    >
      <Spinner size={size} />
      {message && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
      )}
    </div>
  )
}
