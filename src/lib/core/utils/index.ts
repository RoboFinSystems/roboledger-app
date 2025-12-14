/**
 * Generate a URI-safe identifier from a name
 * Converts to lowercase, replaces non-alphanumeric characters with hyphens,
 * and removes leading/trailing hyphens
 *
 * @param name - The name to convert to a URI
 * @returns URI-safe identifier
 *
 * @example
 * generateEntityUri('Apple Inc.') // 'apple-inc'
 * generateEntityUri('  Tesla Motors  ') // 'tesla-motors'
 */
export function generateEntityUri(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Regular expression for matching UUID v4 format
 * Matches the pattern: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 * where x is a hexadecimal character (0-9, a-f)
 */
export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Check if a string is a valid UUID
 *
 * @param value - The string to validate
 * @returns true if the string matches UUID format, false otherwise
 *
 * @example
 * isUUID('550e8400-e29b-41d4-a716-446655440000') // true
 * isUUID('sec') // false
 * isUUID('not-a-uuid') // false
 */
export function isUUID(value: string): boolean {
  return UUID_REGEX.test(value)
}
