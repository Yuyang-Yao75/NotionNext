const AUTH_ROUTE_PREFIXES = ['/sign-in', '/sign-up', '/dashboard', '/admin']

// These themes render Clerk controls in their public navigation.
const THEMES_WITH_PUBLIC_AUTH_UI = new Set([
  'gitbook',
  'magzine',
  'proxio',
  'starter'
])

/**
 * Keep Clerk off public pages that do not consume authentication state.
 * An explicit compatibility switch is available for custom themes/plugins.
 */
export function shouldLoadClerk({
  enabled,
  pathname = '',
  theme,
  techGrowBlogId,
  loadOnPublicPages = false
}) {
  if (!enabled) return false
  if (loadOnPublicPages) return true
  if (techGrowBlogId) return true
  if (THEMES_WITH_PUBLIC_AUTH_UI.has(theme)) return true

  return AUTH_ROUTE_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}
