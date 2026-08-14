import axios from 'axios'
import { getServerSideProps } from '@/pages/auth'

jest.mock('axios', () => ({
  post: jest.fn()
}))

describe('legacy Notion OAuth callback', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = {
      ...originalEnv,
      OAUTH_CLIENT_ID: 'client-id',
      OAUTH_CLIENT_SECRET: 'client-secret',
      OAUTH_REDIRECT_URI: 'https://example.com/auth'
    }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('redirects with a safe message instead of OAuth credentials', async () => {
    axios.post.mockResolvedValue({
      status: 200,
      statusText: 'OK',
      data: {
        access_token: 'secret-access-token',
        workspace_id: 'workspace-id',
        workspace_name: 'My workspace'
      }
    })

    const result = await getServerSideProps({ query: { code: 'oauth-code' } })
    const destination = result.redirect.destination

    expect(destination).toContain('%E6%8E%88%E6%9D%83%E6%88%90%E5%8A%9F')
    expect(destination).toContain('My+workspace')
    expect(destination).not.toContain('secret-access-token')
    expect(destination).not.toContain('workspace-id')
    expect(destination).not.toContain('oauth-code')
    expect(result.redirect.permanent).toBe(false)
  })

  it('does not call Notion without an authorization code', async () => {
    const result = await getServerSideProps({ query: {} })

    expect(axios.post.mock.calls).toHaveLength(0)
    expect(result.redirect.destination).toContain(
      '%E6%97%A0%E6%95%88%E8%AF%B7%E6%B1%82'
    )
  })
})
