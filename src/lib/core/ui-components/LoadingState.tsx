import type { ComponentProps } from 'react'
import { twMerge } from 'tailwind-merge'
import { Spinner } from './Spinner'

interface LoadingStateProps {
  /** Optional message shown below the spinner, e.g. "Loading dashboard…". */
  message?: string
  /** Spinner size. Defaults to `xl` for content-area loads. */
  size?: ComponentProps<typeof Spinner>['size']
  /** Override the centering container (e.g. `h-screen`, `py-24`, `min-h-96`). */
  className?: string
}

/**
 * Centered content-area loading block: a spinner with an optional message
 * below, centered in a min-height container. Use for a section / page-content
 * load. For a full-page shell use `<Spinner fullScreen>` / `<BrandSpinner
 * fullScreen>`; for inline button loading use a bare `<Spinner size="sm">`.
 */
export function LoadingState({
  message,
  size = 'xl',
  className,
}: LoadingStateProps) {
  return (
    <div
      className={twMerge('flex h-64 items-center justify-center', className)}
    >
      <div className="text-center">
        <Spinner size={size} />
        {message && (
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            {message}
          </p>
        )}
      </div>
    </div>
  )
}
