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

  it('keeps a non-shared custom Notion API host', async () => {
    process.env.API_BASE_URL = 'https://notion-proxy.example.com/api/v3/'
    const NotionAPI = jest.fn().mockImplementation(() => ({
      getPage: jest.fn().mockResolvedValue({})
    }))
    jest.doMock('notion-client', () => ({ NotionAPI }))

    const notionAPI = require('@/lib/db/notion/getNotionAPI').default
    await notionAPI.getPage('page-id')

    expect(NotionAPI).toHaveBeenCalledWith(
      expect.objectContaining({
        apiBaseUrl: 'https://notion-proxy.example.com/api/v3'
      })
    )
  })
})
