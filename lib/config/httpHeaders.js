const PUBLIC_ASSET_CACHE_CONTROL =
  'public, max-age=86400, s-maxage=31536000, stale-while-revalidate=604800'

const GLOBAL_SECURITY_HEADERS = Object.freeze([
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  },
  { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' }
])

const PRIVATE_RESPONSE_HEADERS = Object.freeze([
  { key: 'Cache-Control', value: 'no-store, max-age=0' },
  { key: 'Pragma', value: 'no-cache' }
])

const CACHEABLE_PUBLIC_ASSET_PATHS = Object.freeze([
  '/css/:path*',
  '/js/:path*'
])

const PRIVATE_RESPONSE_PATHS = Object.freeze([
  '/api/cache',
  '/api/revalidate',
  '/api/claude/contribution-refresh',
  '/auth/:path*'
])

function getHttpHeaderRules() {
  return [
    {
      source: '/vendor/fontawesome/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable'
        }
      ]
    },
    ...CACHEABLE_PUBLIC_ASSET_PATHS.map(source => ({
      source,
      headers: [
        {
          key: 'Cache-Control',
          value: PUBLIC_ASSET_CACHE_CONTROL
        }
      ]
    })),
    {
      source: '/bg_image.jpg',
      headers: [
        {
          key: 'Cache-Control',
          value: PUBLIC_ASSET_CACHE_CONTROL
        }
      ]
    },
    ...PRIVATE_RESPONSE_PATHS.map(source => ({
      source,
      headers: [...PRIVATE_RESPONSE_HEADERS]
    })),
    {
      source: '/:path*{/}?',
      headers: [...GLOBAL_SECURITY_HEADERS]
    }
  ]
}

module.exports = {
  CACHEABLE_PUBLIC_ASSET_PATHS,
  GLOBAL_SECURITY_HEADERS,
  PRIVATE_RESPONSE_HEADERS,
  PRIVATE_RESPONSE_PATHS,
  PUBLIC_ASSET_CACHE_CONTROL,
  getHttpHeaderRules
}
