'use client'

import { Button } from 'flowbite-react'
import type { ErrorInfo, ReactNode } from 'react'
import { Component } from 'react'
import { HiExclamationCircle, HiRefresh } from 'react-icons/hi'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-[400px] items-center justify-center p-8">
          <div className="max-w-md text-center">
            <HiExclamationCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
            <h2 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-white">
              Something went wrong
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <Button
              color="gray"
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
            >
              <HiRefresh className="mr-2 h-4 w-4" />
              Reload page
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
