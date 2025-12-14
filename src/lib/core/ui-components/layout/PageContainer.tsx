'use client'

import type { PropsWithChildren } from 'react'

interface PageContainerProps extends PropsWithChildren {
  spacing?: 'tight' | 'normal' | 'loose'
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  className?: string
}

export function PageContainer({
  children,
  spacing = 'normal',
  maxWidth = 'xl',
  className = '',
}: PageContainerProps) {
  const spacingClasses = {
    tight: 'gap-4',
    normal: 'gap-6',
    loose: 'gap-8',
  }

  const maxWidthClasses = {
    sm: 'max-w-sm mx-auto',
    md: 'max-w-md mx-auto',
    lg: 'max-w-lg mx-auto',
    xl: 'max-w-7xl mx-auto',
    full: 'max-w-none',
  }

  return (
    <div
      className={`grid grid-cols-1 px-4 pb-1 ${spacingClasses[spacing]} ${maxWidthClasses[maxWidth]} ${className}`}
    >
      {children}
    </div>
  )
}
