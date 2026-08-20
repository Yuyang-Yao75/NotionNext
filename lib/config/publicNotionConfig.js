const SERVER_ONLY_CONFIG_KEYS = new Set([
  'AI_SUMMARY_KEY',
  'CACHE_REVALIDATION_TOKEN',
  'CLAUDE_CONTRIBUTION_TRIGGER_TOKEN',
  'DATABASE_URL',
  'NOTION_API_TOKEN',
  'NOTION_TOKEN',
  'NOTION_TOKEN_V2',
  'OAUTH_CLIENT_SECRET',
  'REDIS_URL',
  'REVALIDATION_TOKEN',
  'SUPABASE_SECRET_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
])

const SERVER_ONLY_KEY_PATTERN =
  /(?:^|_)(?:CLIENT_SECRET|PASSWORD|PRIVATE_KEY|SERVICE_ROLE_KEY)$/

export const isServerOnlyConfigKey = key => {
  const normalizedKey = String(key || '')
    .trim()
    .toUpperCase()
  return (
    SERVER_ONLY_CONFIG_KEYS.has(normalizedKey) ||
    SERVER_ONLY_KEY_PATTERN.test(normalizedKey)
  )
}

/**
 * Notion's config table is serialized into Next.js page data. Keep known
 * server-only credentials out of that public payload while leaving public
 * plugin IDs/tokens (which require a browser-side SDK) untouched.
 */
export const sanitizePublicNotionConfig = config => {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(config).filter(([key]) => !isServerOnlyConfigKey(key))
  )
}
