import type { ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

interface PageLayoutProps {
  children: ReactNode
  variant?: 'constrained' | 'full-width'
  className?: string
}

export function PageLayout({
  children,
  variant = 'constrained',
  className,
}: PageLayoutProps) {
  return (
    <div
      className={twMerge(
        'space-y-6 p-6',
        variant === 'constrained' && 'mx-auto max-w-7xl',
        className
      )}
    >
      {children}
    </div>
  )
}
