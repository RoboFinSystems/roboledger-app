import { CURRENT_APP } from '../auth-core/config'
import type { AppName } from '../auth-core/types'
import { AnimatedLogo } from './Logo'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  fullScreen?: boolean
  app?: AppName
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
  xl: 'h-32 w-32',
}

export function Spinner({
  size = 'md',
  className = '',
  fullScreen = false,
  app = CURRENT_APP,
}: SpinnerProps) {
  const spinner = (
    <AnimatedLogo
      animate="loop"
      app={app}
      className={`text-black dark:text-white ${sizeClasses[size]} ${className}`}
    />
  )

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        {spinner}
      </div>
    )
  }

  return spinner
}
