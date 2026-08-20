const mockGetPage = jest.fn()
const mockSearch = jest.fn()
const mockGetDataFromCache = jest.fn()
const mockDelCacheData = jest.fn()

jest.mock('@/lib/db/notion/getNotionAPI', () => ({
  getPage: (...args) => mockGetPage(...args),
  search: (...args) => mockSearch(...args)
}))
jest.mock('@/lib/cache/cache_manager', () => ({
  delCacheData: (...args) => mockDelCacheData(...args),
  getDataFromCache: (...args) => mockGetDataFromCache(...args),
  getOrSetDataWithCache: jest.fn(),
  setDataToCache: jest.fn()
}))
jest.mock('p-limit', () => () => fn => fn())
jest.mock('notion-utils', () => ({
  getBlockValue: jest.fn(entry => entry?.value?.value || entry?.value || entry)
}))

import {
  getNotionRetryDelayMs,
  getPageWithRetry
} from '@/lib/db/notion/getPostBlocks'

describe('getPageWithRetry', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetDataFromCache.mockResolvedValue(null)
    mockDelCacheData.mockResolvedValue(undefined)
    mockSearch.mockResolvedValue({ recordMap: { block: {} } })
  })

  it('uses capped exponential backoff', () => {
    expect([1, 2, 3, 4, 5, 9].map(getNotionRetryDelayMs)).toEqual([
      1000, 2000, 4000, 8000, 8000, 8000
    ])
  })

  it('recovers after transient failures', async () => {
    const recordMap = { block: { root: { value: { id: 'root' } } } }
    const sleep = jest.fn().mockResolvedValue(undefined)
    mockGetPage
      .mockRejectedValueOnce(new Error('ECONNRESET'))
      .mockRejectedValueOnce(new Error('ECONNRESET'))
      .mockResolvedValueOnce(recordMap)

    await expect(
      getPageWithRetry('site', 'test', 5, 'cache-key', 1, undefined, sleep)
    ).resolves.toBe(recordMap)
    expect(mockGetPage).toHaveBeenCalledTimes(3)
    expect(sleep.mock.calls).toEqual([[1000], [2000]])
  })

  it('asks notion-client to throw collection query errors for validated pages', async () => {
    const recordMap = { block: { root: { value: { id: 'root' } } } }
    const validate = jest.fn()
    mockGetPage.mockResolvedValue(recordMap)

    await getPageWithRetry(
      'site',
      'test',
      1,
      'cache-key',
      1,
      validate,
      jest.fn()
    )

    expect(mockGetPage).toHaveBeenCalledWith('site', {
      throwOnCollectionErrors: true,
      concurrency: 1
    })
    expect(validate).toHaveBeenCalledWith(recordMap)
  })

  it('recovers an empty primary view from public search results', async () => {
    const recordMap = {
      block: {
        site: {
          value: {
            id: 'site',
            type: 'collection_view_page',
            collection_id: 'collection',
            view_ids: ['primary-view']
          }
        }
      },
      collection_query: {
        collection: {
          'primary-view': {
            collection_group_results: { blockIds: [] }
          }
        }
      }
    }
    mockGetPage.mockResolvedValue(recordMap)
    mockSearch.mockResolvedValue({
      recordMap: {
        block: {
          row: {
            value: {
              id: 'row',
              type: 'page',
              parent_table: 'collection',
              parent_id: 'collection'
            }
          },
          nested: {
            value: {
              id: 'nested',
              type: 'text',
              parent_id: 'row'
            }
          }
        }
      }
    })
    const validate = jest.fn(pageData => {
      const ids =
        pageData.collection_query.collection['primary-view']
          .collection_group_results.blockIds
      if (ids.length === 0) {
        const error = new Error('incomplete')
        error.code = 'NOTION_INCOMPLETE_DATABASE_RESPONSE'
        throw error
      }
    })

    await expect(
      getPageWithRetry(
        'site',
        'test',
        1,
        'cache-key',
        1,
        validate,
        jest.fn()
      )
    ).resolves.toBe(recordMap)

    expect(mockSearch).toHaveBeenCalledWith({
      ancestorId: 'collection',
      query: '',
      limit: 100
    })
    expect(
      recordMap.collection_query.collection['primary-view']
        .collection_group_results.blockIds
    ).toEqual(['row'])
  })

  it('preserves the primary view row order when public search is unordered', async () => {
    const recordMap = {
      block: {
        site: {
          value: {
            id: 'site',
            type: 'collection_view_page',
            collection_id: 'collection',
            view_ids: ['primary-view']
          }
        }
      },
      collection_view: {
        'primary-view': {
          value: {
            value: {
              id: 'primary-view',
              page_sort: ['about', 'archive', 'category', 'history']
            }
          }
        }
      },
      collection_query: {
        collection: {
          'primary-view': {
            collection_group_results: { blockIds: [] }
          }
        }
      }
    }
    mockGetPage.mockResolvedValue(recordMap)
    mockSearch.mockResolvedValue({
      recordMap: {
        block: {
          about: {
            value: {
              id: 'about',
              type: 'page',
              parent_table: 'collection',
              parent_id: 'collection'
            }
          },
          category: {
            value: {
              id: 'category',
              type: 'page',
              parent_table: 'collection',
              parent_id: 'collection'
            }
          },
          archive: {
            value: {
              id: 'archive',
              type: 'page',
              parent_table: 'collection',
              parent_id: 'collection'
            }
          },
          history: {
            value: {
              id: 'history',
              type: 'page',
              parent_table: 'collection',
              parent_id: 'collection'
            }
          }
        }
      }
    })
    const validate = jest.fn(pageData => {
      const ids =
        pageData.collection_query.collection['primary-view']
          .collection_group_results.blockIds
      if (ids.length === 0) {
        const error = new Error('incomplete')
        error.code = 'NOTION_INCOMPLETE_DATABASE_RESPONSE'
        throw error
      }
    })

    await getPageWithRetry(
      'site',
      'test',
      1,
      'cache-key',
      1,
      validate,
      jest.fn()
    )

    expect(
      recordMap.collection_query.collection['primary-view']
        .collection_group_results.blockIds
    ).toEqual(['about', 'archive', 'category', 'history'])
  })

  it('throws instead of returning an empty result after all attempts fail', async () => {
    const sleep = jest.fn().mockResolvedValue(undefined)
    mockGetPage.mockRejectedValue(new Error('ECONNRESET'))

    await expect(
      getPageWithRetry('site', 'test', 2, 'cache-key', 1, undefined, sleep)
    ).rejects.toThrow('ECONNRESET')
    expect(mockGetPage).toHaveBeenCalledTimes(2)
    expect(sleep).toHaveBeenCalledTimes(1)
  })
})
