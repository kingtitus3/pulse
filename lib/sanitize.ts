/**
 * Escape HTML special characters
 */
export function escapeHtml(input: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return input.replace(/[&<>"']/g, (m) => map[m])
}

/**
 * Strip control characters (except newlines and tabs)
 */
function stripControlChars(input: string): string {
  return input.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
}

/**
 * Sanitize message content
 */
export function sanitizeMessage(raw: string): string {
  const MAX_LENGTH = 2000

  let sanitized = raw.trim()

  // Enforce max length
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH)
  }

  // Strip control characters
  sanitized = stripControlChars(sanitized)

  // Escape HTML
  sanitized = escapeHtml(sanitized)

  return sanitized
}

/**
 * Sanitize display name
 */
export function sanitizeDisplayName(raw: string): string {
  const MAX_LENGTH = 24
  const MIN_LENGTH = 3

  let sanitized = raw.trim()

  if (sanitized.length < MIN_LENGTH) {
    throw new Error(`Display name must be at least ${MIN_LENGTH} characters`)
  }

  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH)
  }

  // Basic validation: alphanumeric, underscore, hyphen, spaces
  if (!/^[a-zA-Z0-9_\-\s]+$/.test(sanitized)) {
    throw new Error('Display name contains invalid characters')
  }

  // TODO: Profanity check

  return sanitized
}

/**
 * Sanitize bio
 */
export function sanitizeBio(raw: string): string {
  const MAX_LENGTH = 280

  let sanitized = raw.trim()

  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH)
  }

  sanitized = stripControlChars(sanitized)
  sanitized = escapeHtml(sanitized)

  return sanitized
}

