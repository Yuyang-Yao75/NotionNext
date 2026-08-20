/**
 * Normalize greeting copy from env, Notion config, or a theme config.
 *
 * Arrays are preferred when a greeting contains an ASCII comma. String values
 * remain backwards compatible with the historical comma-separated format and
 * also accept pipes/newlines for easier environment-variable configuration.
 */
export function parseGreetingWords(value) {
  if (Array.isArray(value)) {
    return value
      .filter(item => typeof item === 'string')
      .map(item => item.trim())
      .filter(Boolean)
  }

  if (typeof value !== 'string') {
    return []
  }

  const normalized = value.trim()
  if (!normalized) {
    return []
  }

  if (normalized.startsWith('[')) {
    try {
      const parsed = JSON.parse(normalized)
      if (Array.isArray(parsed)) {
        return parseGreetingWords(parsed)
      }
    } catch {
      // Fall through to the delimiter-based legacy format.
    }
  }

  const separator = /[|\r\n]/.test(normalized) ? /(?:\r?\n|\|)+/ : ','
  return normalized
    .split(separator)
    .map(item => item.trim())
    .filter(Boolean)
}

/**
 * Resolve greeting copy with a stable priority shared by all animated heroes.
 * A theme may explicitly override the global copy; otherwise GREETING_WORDS is
 * the single source of truth, followed by a layout-specific legacy fallback.
 */
export function resolveGreetingWords({
  themeWords,
  sharedWords,
  fallbackWords = []
} = {}) {
  for (const candidate of [themeWords, sharedWords, fallbackWords]) {
    const words = parseGreetingWords(candidate)
    if (words.length > 0) {
      return words
    }
  }

  return []
}
