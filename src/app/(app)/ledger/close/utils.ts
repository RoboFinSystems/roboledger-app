/**
 * Format a number as currency using accounting notation.
 * Negative values are displayed in parentheses: (1,234.56)
 * Positive values are displayed as-is: 1,234.56
 */
export const formatCurrency = (value: number): string => {
  const abs = Math.abs(value)
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return value < 0 ? `(${formatted})` : formatted
}

/**
 * Format a number as USD currency with $ prefix.
 * Uses accounting notation: ($1,234.56) for negatives.
 */
export const formatCurrencyDollars = (value: number): string => {
  const abs = Math.abs(value)
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return value < 0 ? `($${formatted})` : `$${formatted}`
}

/**
 * Format a date string as a readable date.
 */
export const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format a date string as month + year.
 */
export const formatMonth = (dateString: string): string => {
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
  })
}
