import { shouldLoadClerk } from '@/lib/auth/shouldLoadClerk'

describe('shouldLoadClerk', () => {
  it('keeps Clerk disabled when it is not configured', () => {
    expect(
      shouldLoadClerk({ enabled: false, pathname: '/dashboard', theme: 'hexo' })
    ).toBe(false)
  })

  it.each(['/sign-in/[[...index]]', '/sign-up', '/dashboard', '/admin/team'])(
    'loads Clerk for auth route %s',
    pathname => {
      expect(shouldLoadClerk({ enabled: true, pathname, theme: 'hexo' })).toBe(
        true
      )
    }
  )

  it.each(['starter', 'proxio', 'gitbook', 'magzine'])(
    'loads Clerk for public auth UI theme %s',
    theme => {
      expect(shouldLoadClerk({ enabled: true, pathname: '/', theme })).toBe(
        true
      )
    }
  )

  it('keeps Clerk out of an ordinary public Hexo page', () => {
    expect(
      shouldLoadClerk({ enabled: true, pathname: '/', theme: 'hexo' })
    ).toBe(false)
  })

  it('preserves authentication for TechGrow and compatibility mode', () => {
    expect(
      shouldLoadClerk({
        enabled: true,
        pathname: '/article',
        theme: 'hexo',
        techGrowBlogId: 'blog-id'
      })
    ).toBe(true)
    expect(
      shouldLoadClerk({
        enabled: true,
        pathname: '/',
        theme: 'hexo',
        loadOnPublicPages: true
      })
    ).toBe(true)
  })
})
