/**
 * Error handling for operation-based monitoring
 */

export enum OperationErrorCode {
  // Network errors
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  CONNECTION_LOST = 'CONNECTION_LOST',
  TIMEOUT = 'TIMEOUT',

  // Operation errors
  OPERATION_NOT_FOUND = 'OPERATION_NOT_FOUND',
  OPERATION_CANCELLED = 'OPERATION_CANCELLED',
  OPERATION_FAILED = 'OPERATION_FAILED',

  // Permission errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',

  // Resource errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_LOCKED = 'RESOURCE_LOCKED',
  RESOURCE_LIMIT_EXCEEDED = 'RESOURCE_LIMIT_EXCEEDED',

  // Validation errors
  INVALID_INPUT = 'INVALID_INPUT',
  INVALID_QUERY = 'INVALID_QUERY',
  SCHEMA_VIOLATION = 'SCHEMA_VIOLATION',

  // System errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMITED = 'RATE_LIMITED',
}

export class OperationError extends Error {
  constructor(
    public code: OperationErrorCode,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'OperationError'
  }

  /**
   * Check if error is recoverable
   */
  isRecoverable(): boolean {
    return [
      OperationErrorCode.CONNECTION_LOST,
      OperationErrorCode.TIMEOUT,
      OperationErrorCode.SERVICE_UNAVAILABLE,
      OperationErrorCode.RATE_LIMITED,
    ].includes(this.code)
  }

  /**
   * Check if error requires user action
   */
  requiresUserAction(): boolean {
    return [
      OperationErrorCode.UNAUTHORIZED,
      OperationErrorCode.FORBIDDEN,
      OperationErrorCode.INSUFFICIENT_CREDITS,
      OperationErrorCode.INVALID_INPUT,
      OperationErrorCode.INVALID_QUERY,
    ].includes(this.code)
  }

  /**
   * Get user-friendly message
   */
  getUserMessage(): string {
    switch (this.code) {
      case OperationErrorCode.CONNECTION_FAILED:
        return 'Unable to connect to the server. Please check your internet connection.'
      case OperationErrorCode.CONNECTION_LOST:
        return 'Connection to the server was lost. Attempting to reconnect...'
      case OperationErrorCode.TIMEOUT:
        return 'The operation took too long to complete. Please try again.'
      case OperationErrorCode.OPERATION_NOT_FOUND:
        return 'The operation could not be found. It may have expired.'
      case OperationErrorCode.OPERATION_CANCELLED:
        return 'The operation was cancelled.'
      case OperationErrorCode.OPERATION_FAILED:
        return 'The operation failed. Please check the details and try again.'
      case OperationErrorCode.UNAUTHORIZED:
        return 'You are not authorized. Please log in and try again.'
      case OperationErrorCode.FORBIDDEN:
        return 'You do not have permission to perform this action.'
      case OperationErrorCode.INSUFFICIENT_CREDITS:
        return 'You have insufficient credits. Please upgrade your plan.'
      case OperationErrorCode.RESOURCE_NOT_FOUND:
        return 'The requested resource could not be found.'
      case OperationErrorCode.RESOURCE_LOCKED:
        return 'The resource is currently locked. Please try again later.'
      case OperationErrorCode.RESOURCE_LIMIT_EXCEEDED:
        return 'You have exceeded the resource limit for your plan.'
      case OperationErrorCode.INVALID_INPUT:
        return 'The provided input is invalid. Please check and try again.'
      case OperationErrorCode.INVALID_QUERY:
        return 'The query syntax is invalid. Please check your query.'
      case OperationErrorCode.SCHEMA_VIOLATION:
        return 'The operation violates the schema constraints.'
      case OperationErrorCode.INTERNAL_ERROR:
        return 'An internal error occurred. Please try again later.'
      case OperationErrorCode.SERVICE_UNAVAILABLE:
        return 'The service is temporarily unavailable. Please try again later.'
      case OperationErrorCode.RATE_LIMITED:
        return 'Too many requests. Please slow down and try again.'
      default:
        return this.message || 'An unexpected error occurred.'
    }
  }

  /**
   * Get recommended action for the user
   */
  getRecommendedAction(): string | null {
    switch (this.code) {
      case OperationErrorCode.CONNECTION_FAILED:
      case OperationErrorCode.CONNECTION_LOST:
        return 'Check your internet connection and refresh the page.'
      case OperationErrorCode.TIMEOUT:
        return 'Try running the operation with smaller data or during off-peak hours.'
      case OperationErrorCode.UNAUTHORIZED:
        return 'Please log in again to continue.'
      case OperationErrorCode.FORBIDDEN:
        return 'Contact your administrator for access.'
      case OperationErrorCode.INSUFFICIENT_CREDITS:
        return 'Upgrade your plan or purchase additional credits.'
      case OperationErrorCode.INVALID_QUERY:
        return 'Review the query syntax documentation.'
      case OperationErrorCode.RATE_LIMITED:
        return 'Wait a few moments before trying again.'
      default:
        return null
    }
  }
}

/**
 * Parse SSE error events into OperationError
 */
export function parseOperationError(event: any): OperationError {
  // Check for specific error codes in the event
  if (event.code) {
    const code = event.code as OperationErrorCode
    return new OperationError(
      code,
      event.message || 'Unknown error',
      event.details
    )
  }

  // Map error messages to codes
  const message = event.message || event.error || ''

  if (message.includes('unauthorized') || message.includes('401')) {
    return new OperationError(OperationErrorCode.UNAUTHORIZED, message)
  }

  if (message.includes('forbidden') || message.includes('403')) {
    return new OperationError(OperationErrorCode.FORBIDDEN, message)
  }

  if (message.includes('credits') || message.includes('quota')) {
    return new OperationError(OperationErrorCode.INSUFFICIENT_CREDITS, message)
  }

  if (message.includes('not found') || message.includes('404')) {
    return new OperationError(OperationErrorCode.RESOURCE_NOT_FOUND, message)
  }

  if (message.includes('timeout')) {
    return new OperationError(OperationErrorCode.TIMEOUT, message)
  }

  if (message.includes('rate limit') || message.includes('429')) {
    return new OperationError(OperationErrorCode.RATE_LIMITED, message)
  }

  if (message.includes('invalid') || message.includes('validation')) {
    return new OperationError(OperationErrorCode.INVALID_INPUT, message)
  }

  if (message.includes('syntax') || message.includes('query')) {
    return new OperationError(OperationErrorCode.INVALID_QUERY, message)
  }

  if (message.includes('connection')) {
    return new OperationError(OperationErrorCode.CONNECTION_FAILED, message)
  }

  if (message.includes('cancelled')) {
    return new OperationError(OperationErrorCode.OPERATION_CANCELLED, message)
  }

  // Default to internal error
  return new OperationError(OperationErrorCode.INTERNAL_ERROR, message)
}

/**
 * Error recovery strategies
 */
export class ErrorRecovery {
  private retryCount = new Map<string, number>()
  private readonly maxRetries = 3
  private readonly baseDelay = 1000

  /**
   * Determine if we should retry
   */
  shouldRetry(operationId: string, error: OperationError): boolean {
    if (!error.isRecoverable()) {
      return false
    }

    const count = this.retryCount.get(operationId) || 0
    if (count >= this.maxRetries) {
      return false
    }

    this.retryCount.set(operationId, count + 1)
    return true
  }

  /**
   * Get retry delay with exponential backoff
   */
  getRetryDelay(operationId: string): number {
    const count = this.retryCount.get(operationId) || 0
    return this.baseDelay * Math.pow(2, count)
  }

  /**
   * Reset retry count for an operation
   */
  reset(operationId: string): void {
    this.retryCount.delete(operationId)
  }

  /**
   * Clear all retry counts
   */
  clear(): void {
    this.retryCount.clear()
  }
}

/**
 * Error notification helper
 */
export interface ErrorNotification {
  title: string
  message: string
  action?: string
  severity: 'info' | 'warning' | 'error'
}

export function createErrorNotification(
  error: OperationError
): ErrorNotification {
  const severity = error.requiresUserAction()
    ? 'error'
    : error.isRecoverable()
      ? 'warning'
      : 'error'

  return {
    title: getErrorTitle(error.code),
    message: error.getUserMessage(),
    action: error.getRecommendedAction() || undefined,
    severity,
  }
}

function getErrorTitle(code: OperationErrorCode): string {
  switch (code) {
    case OperationErrorCode.CONNECTION_FAILED:
    case OperationErrorCode.CONNECTION_LOST:
      return 'Connection Error'
    case OperationErrorCode.UNAUTHORIZED:
    case OperationErrorCode.FORBIDDEN:
      return 'Access Denied'
    case OperationErrorCode.INSUFFICIENT_CREDITS:
      return 'Insufficient Credits'
    case OperationErrorCode.INVALID_INPUT:
    case OperationErrorCode.INVALID_QUERY:
      return 'Validation Error'
    case OperationErrorCode.RATE_LIMITED:
      return 'Rate Limited'
    case OperationErrorCode.TIMEOUT:
      return 'Timeout'
    default:
      return 'Operation Error'
  }
}
