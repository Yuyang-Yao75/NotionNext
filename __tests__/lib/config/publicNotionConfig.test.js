import {
  isServerOnlyConfigKey,
  sanitizePublicNotionConfig
} from '@/lib/config/publicNotionConfig'

describe('public Notion config sanitization', () => {
  it.each([
    'NOTION_TOKEN_V2',
    'AI_SUMMARY_KEY',
    'REVALIDATION_TOKEN',
    'OAUTH_CLIENT_SECRET',
    'DATABASE_PASSWORD',
    'SSH_PRIVATE_KEY'
  ])('identifies %s as server-only', key => {
    expect(isServerOnlyConfigKey(key)).toBe(true)
  })

  it('removes server credentials without mutating the source config', () => {
    const source = {
      TITLE: 'Public title',
      LINK: 'https://example.com',
      NOTION_TOKEN_V2: 'secret-notion-token',
      AI_SUMMARY_KEY: 'secret-ai-token',
      REVALIDATION_TOKEN: 'secret-revalidation-token',
      TianliGPT_KEY: 'browser-sdk-key'
    }

    expect(sanitizePublicNotionConfig(source)).toEqual({
      TITLE: 'Public title',
      LINK: 'https://example.com',
      TianliGPT_KEY: 'browser-sdk-key'
    })
    expect(source.NOTION_TOKEN_V2).toBe('secret-notion-token')
  })

  it.each([null, undefined, [], 'not-an-object'])(
    'returns an empty object for invalid input %#',
    value => {
      expect(sanitizePublicNotionConfig(value)).toEqual({})
    }
  )
})
