/**
 * Shared chat interface types and utilities
 */

// Helper function to generate unique IDs
export const generateMessageId = () =>
  `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// Error types for better error handling
export enum ErrorType {
  AUTHENTICATION = 'AUTHENTICATION',
  NOT_FOUND = 'NOT_FOUND',
  COMPANY_SELECTION = 'COMPANY_SELECTION',
  NETWORK = 'NETWORK',
  UNKNOWN = 'UNKNOWN',
}

// Helper function to categorize errors
export const categorizeError = (error: Error): ErrorType => {
  const message = error.message.toLowerCase()

  if (
    message.includes('authentication') ||
    message.includes('unauthorized') ||
    message.includes('401')
  ) {
    return ErrorType.AUTHENTICATION
  }

  if (message.includes('not found') || message.includes('404')) {
    return ErrorType.NOT_FOUND
  }

  if (message.includes('graph_id') || message.includes('company')) {
    return ErrorType.COMPANY_SELECTION
  }

  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('timeout')
  ) {
    return ErrorType.NETWORK
  }

  return ErrorType.UNKNOWN
}

// Get user-friendly error message based on error type
export const getErrorMessage = (errorType: ErrorType): string => {
  switch (errorType) {
    case ErrorType.AUTHENTICATION:
      return 'Please log in to access your financial data.'
    case ErrorType.NOT_FOUND:
      return 'The requested data was not found. Please verify your company selection.'
    case ErrorType.COMPANY_SELECTION:
      return 'Please select a company first to access your financial data.'
    case ErrorType.NETWORK:
      return 'Network error occurred. Please check your connection and try again.'
    case ErrorType.UNKNOWN:
    default:
      return 'Sorry, there was an error processing your request. Please try again.'
  }
}

export interface Message {
  id: string
  text: string
  user: 'You' | 'Agent'
  isPartial?: boolean
  taskId?: string
  progress?: number
  currentStep?: string
}

// Agent type for the financial analysis agent
export type AgentType = 'default'
