import { useCallback } from 'react'
import { useToast } from './use-toast'

export function useApiError() {
  const { showError } = useToast()

  const handleApiError = useCallback(
    (error: any, defaultMessage: string): string => {
      let errorMessage = defaultMessage

      if (error instanceof Error) {
        errorMessage = error.message
      } else if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error?.message) {
        errorMessage = error.message
      }

      showError(errorMessage)
      return errorMessage
    },
    [showError]
  )

  return { handleApiError }
}
