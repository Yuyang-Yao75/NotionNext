import axios from 'axios'

/**
 * Legacy Notion OAuth callback. Exchange the code server-side and redirect
 * with a human-readable result only; credentials must never enter the URL.
 */
export const getServerSideProps = async ctx => {
  const code = Array.isArray(ctx.query.code)
    ? ctx.query.code[0]
    : ctx.query.code
  const params = code ? await fetchToken(code) : null

  const msg =
    params?.status === 200
      ? `授权成功${params.data?.workspace_name ? `：${params.data.workspace_name}` : ''}`
      : params?.statusText || '无效请求'

  return {
    redirect: {
      destination: `/auth/result?${new URLSearchParams({ msg }).toString()}`,
      permanent: false
    }
  }
}

const fetchToken = async code => {
  const clientId = process.env.OAUTH_CLIENT_ID
  const clientSecret = process.env.OAUTH_CLIENT_SECRET
  const redirectUri = process.env.OAUTH_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    return { status: 500, statusText: 'OAuth 配置不完整', data: null }
  }

  const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  try {
    const response = await axios.post(
      'https://api.notion.com/v1/oauth/token',
      {
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      },
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Basic ${encoded}`
        }
      }
    )

    return {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    }
  } catch (error) {
    console.error('Notion OAuth token exchange failed', {
      status: error?.response?.status,
      message: error?.message
    })
    return {
      status: error?.response?.status || 500,
      statusText: 'OAuth 授权失败',
      data: null
    }
  }
}

const AuthRedirect = () => null

export default AuthRedirect
