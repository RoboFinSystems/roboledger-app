interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  fullScreen?: boolean
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-16 w-16',
  xl: 'h-32 w-32',
}

export function Spinner({
  size = 'md',
  className = '',
  fullScreen = false,
}: SpinnerProps) {
  const spinner = (
    <div
      className={`border-primary-600 animate-spin rounded-full border-b-2 ${sizeClasses[size]} ${className}`}
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
