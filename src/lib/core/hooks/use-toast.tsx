'use client'

import { Toast, ToastToggle } from 'flowbite-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  HiCheckCircle,
  HiExclamation,
  HiInformationCircle,
} from 'react-icons/hi'

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

/**
 * A reusable toast notification hook built on Flowbite React components.
 *
 * Provides toast notifications with auto-dismiss functionality and consistent styling
 * across the RoboSystems ecosystem.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { showSuccess, showError, ToastContainer } = useToast()
 *
 *   const handleSuccess = () => {
 *     showSuccess('Operation completed successfully!')
 *   }
 *
 *   return (
 *     <>
 *       <ToastContainer />
 *       <button onClick={handleSuccess}>Show Success Toast</button>
 *     </>
 *   )
 * }
 * ```
 */
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const timeoutRefs = useRef<{ [key: string]: ReturnType<typeof setTimeout> }>(
    {}
  )

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 11)
    const newToast: ToastMessage = {
      id,
      duration: 5000,
      ...toast,
    }

    setToasts((prev) => [...prev, newToast])

    if (newToast.duration && newToast.duration > 0) {
      const timeoutId = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
        delete timeoutRefs.current[id]
      }, newToast.duration)
      timeoutRefs.current[id] = timeoutId
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    if (timeoutRefs.current[id]) {
      clearTimeout(timeoutRefs.current[id])
      delete timeoutRefs.current[id]
    }
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showSuccess = useCallback(
    (message: string, duration?: number) => {
      addToast({ type: 'success', message, duration })
    },
    [addToast]
  )

  const showError = useCallback(
    (message: string, duration?: number) => {
      addToast({ type: 'error', message, duration })
    },
    [addToast]
  )

  const showWarning = useCallback(
    (message: string, duration?: number) => {
      addToast({ type: 'warning', message, duration })
    },
    [addToast]
  )

  const showInfo = useCallback(
    (message: string, duration?: number) => {
      addToast({ type: 'info', message, duration })
    },
    [addToast]
  )

  // Cleanup all timeouts on unmount
  useEffect(() => {
    const timeouts = timeoutRefs.current
    return () => {
      Object.values(timeouts).forEach(clearTimeout)
    }
  }, [])

  const ToastContainer = useCallback(
    () => (
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => {
          const getIcon = () => {
            switch (toast.type) {
              case 'success':
                return HiCheckCircle
              case 'error':
                return HiExclamation
              case 'warning':
                return HiExclamation
              case 'info':
                return HiInformationCircle
              default:
                return HiInformationCircle
            }
          }

          const getColor = () => {
            switch (toast.type) {
              case 'success':
                return 'success'
              case 'error':
                return 'failure'
              case 'warning':
                return 'warning'
              case 'info':
                return 'info'
              default:
                return 'info'
            }
          }

          const Icon = getIcon()
          const color = getColor()

          return (
            <Toast key={toast.id} className="min-w-80" color={color}>
              <div
                className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  toast.type === 'success'
                    ? 'bg-green-100 text-green-500 dark:bg-green-800 dark:text-green-200'
                    : toast.type === 'error'
                      ? 'bg-red-100 text-red-500 dark:bg-red-800 dark:text-red-200'
                      : toast.type === 'warning'
                        ? 'bg-orange-100 text-orange-500 dark:bg-orange-700 dark:text-orange-200'
                        : 'bg-blue-100 text-blue-500 dark:bg-blue-800 dark:text-blue-200'
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="ml-3 text-sm font-normal">{toast.message}</div>
              <ToastToggle onClick={() => removeToast(toast.id)} />
            </Toast>
          )
        })}
      </div>
    ),
    [toasts, removeToast]
  )

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    ToastContainer,
  }
}
