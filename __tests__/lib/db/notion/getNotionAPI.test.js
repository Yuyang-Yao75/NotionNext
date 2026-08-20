describe('getNotionAPI', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
    delete process.env.API_BASE_URL
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('sets the current Notion API host and User-Agent for notion-client', async () => {
    const NotionAPI = jest.fn().mockImplementation(() => ({
      getPage: jest.fn().mockResolvedValue({})
    }))
    jest.doMock('notion-client', () => ({ NotionAPI }))

    const notionAPI = require('@/lib/db/notion/getNotionAPI').default
    await notionAPI.getPage('page-id')

    expect(NotionAPI).toHaveBeenCalledWith(
      expect.objectContaining({
        apiBaseUrl: 'https://yyyao.notion.site/api/v3',
        ofetchOptions: {
          headers: {
            'User-Agent': 'NotionNext (+https://github.com/NotionNext/NotionNext)'
          }
        }
      })
    )
  })

  it('replaces a shared Notion API environment value with the dedicated site host', async () => {
    process.env.API_BASE_URL = 'https://app.notion.com/api/v3'
    const NotionAPI = jest.fn().mockImplementation(() => ({
      getPage: jest.fn().mockResolvedValue({})
    }))
    jest.doMock('notion-client', () => ({ NotionAPI }))

    const notionAPI = require('@/lib/db/notion/getNotionAPI').default
    await notionAPI.getPage('page-id')

    expect(NotionAPI).toHaveBeenCalledWith(
      expect.objectContaining({
        apiBaseUrl: 'https://yyyao.notion.site/api/v3'
      })
    )
  })

  it('ignores a custom environment API host for this dedicated site', async () => {
    process.env.API_BASE_URL = 'https://notion-proxy.example.com/api/v3/'
    const NotionAPI = jest.fn().mockImplementation(() => ({
      getPage: jest.fn().mockResolvedValue({})
    }))
    jest.doMock('notion-client', () => ({ NotionAPI }))

    const notionAPI = require('@/lib/db/notion/getNotionAPI').default
    await notionAPI.getPage('page-id')

    expect(NotionAPI).toHaveBeenCalledWith(
      expect.objectContaining({
        apiBaseUrl: 'https://yyyao.notion.site/api/v3'
      })
    )
  })

  it('ignores stale Vercel database view and property mappings', () => {
    process.env.NEXT_PUBLIC_NOTION_INDEX = '3'
    process.env.NEXT_PUBLIC_NOTION_PROPERTY_TYPE = 'legacy_type'
    process.env.NEXT_PUBLIC_NOTION_PROPERTY_STATUS = 'legacy_status'
    process.env.NEXT_PUBLIC_NOTION_PROPERTY_STATUS_PUBLISH = 'legacy_published'
    process.env.NEXT_PUBLIC_NOTION_PROPERTY_SLUG = 'legacy_slug'
    process.env.NEXT_PUBLIC_NOTION_PROPERTY_ICON = 'legacy_icon'

    const BLOG = require('@/blog.config')

    expect(BLOG.NOTION_INDEX).toBe(0)
    expect(BLOG.NOTION_PROPERTY_NAME).toEqual(
      expect.objectContaining({
        type: 'type',
        status: 'status',
        status_publish: 'Published',
        slug: 'slug',
        icon: 'icon'
      })
    )
  })
})
