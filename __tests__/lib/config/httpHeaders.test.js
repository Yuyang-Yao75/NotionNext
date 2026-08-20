const {
  GLOBAL_SECURITY_HEADERS,
  PUBLIC_ASSET_CACHE_CONTROL,
  getHttpHeaderRules
} = require('@/lib/config/httpHeaders')

const asMap = headers => new Map(headers.map(({ key, value }) => [key, value]))

describe('HTTP header rules', () => {
  it('applies non-breaking browser protections to every page', () => {
    const rules = getHttpHeaderRules()
    const globalRule = rules.find(rule => rule.source === '/:path*{/}?')
    const headers = asMap(globalRule.headers)

    expect(globalRule).toBeDefined()
    expect(headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(headers.get('Referrer-Policy')).toBe(
      'strict-origin-when-cross-origin'
    )
    expect(headers.get('X-Frame-Options')).toBe('SAMEORIGIN')
    expect(headers.get('Permissions-Policy')).toContain('camera=()')
    expect(headers.get('X-Permitted-Cross-Domain-Policies')).toBe('none')
    expect(globalRule.headers).toEqual(GLOBAL_SECURITY_HEADERS)
  })

  it.each(['/css/:path*', '/js/:path*'])(
    'caches version-controlled public assets at %s',
    source => {
      const rule = getHttpHeaderRules().find(rule => rule.source === source)
      expect(asMap(rule.headers).get('Cache-Control')).toBe(
        PUBLIC_ASSET_CACHE_CONTROL
      )
    }
  )

  it.each([
    '/api/cache',
    '/api/revalidate',
    '/api/claude/contribution-refresh',
    '/auth/:path*'
  ])('prevents sensitive responses from being cached at %s', source => {
    const rule = getHttpHeaderRules().find(rule => rule.source === source)
    expect(asMap(rule.headers).get('Cache-Control')).toBe(
      'no-store, max-age=0'
    )
  })

  it('does not add a site-wide CSP that would block configured plugins', () => {
    const keys = getHttpHeaderRules().flatMap(rule =>
      rule.headers.map(header => header.key)
    )
    expect(keys).not.toContain('Content-Security-Policy')
  })
})
