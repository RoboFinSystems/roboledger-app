import { twMerge } from 'tailwind-merge'
import { CURRENT_APP } from '../auth-core/config'
import type { AppName } from '../auth-core/types'
import { AnimatedLogo } from './Logo'

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface SpinnerProps {
  size?: SpinnerSize
  className?: string
  fullScreen?: boolean
}

// Border width scales with diameter so the ring stays visually proportional.
const ringSizeClasses: Record<SpinnerSize, string> = {
  xs: 'h-3.5 w-3.5 border-2',
  sm: 'h-5 w-5 border-2',
  md: 'h-8 w-8 border-[3px]',
  lg: 'h-12 w-12 border-4',
  xl: 'h-16 w-16 border-4',
}

/**
 * The default app-wide loading indicator: a clean, brand-colored spinning ring.
 *
 * The ring color follows `currentColor` (defaults to the brand `primary`), so
 * on a brand-filled surface like a `Button` you override it with the text
 * color, e.g. `className="text-white"`. For high-impact, brand-centric loads
 * (full-page shells, auth, major transitions) use `BrandSpinner` instead.
 */
export function Spinner({
  size = 'md',
  className = '',
  fullScreen = false,
}: SpinnerProps) {
  const ring = (
    <span
      role="status"
      aria-label="Loading"
      className={twMerge(
        'text-primary-600 dark:text-primary-500 inline-block animate-spin rounded-full border-current border-t-transparent',
        ringSizeClasses[size],
        className
      )}
    />
  )

  if (!fullScreen) return ring

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      {ring}
    </div>
  )
}

interface BrandSpinnerProps {
  size?: SpinnerSize
  className?: string
  fullScreen?: boolean
  app?: AppName
}

const logoSizeClasses: Record<SpinnerSize, string> = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-20 w-20',
  xl: 'h-32 w-32',
}

/**
 * High-impact, brand-centric loader: the app's animated logo, looping. Use
 * sparingly — full-page initial loads, auth screens, major transitions — where
 * the brand moment earns its keep. For routine button / inline / page loading,
 * use the plain `Spinner`.
 */
export function BrandSpinner({
  size = 'lg',
  className = '',
  fullScreen = false,
  app = CURRENT_APP,
}: BrandSpinnerProps) {
  const logo = (
    <AnimatedLogo
      animate="loop"
      app={app}
      className={twMerge(
        'text-black dark:text-white',
        logoSizeClasses[size],
        className
      )}
    />
  )

  if (!fullScreen) return logo

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      {logo}
    </div>
  )
}
