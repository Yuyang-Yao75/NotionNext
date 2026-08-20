const mockGetPage = jest.fn()
const mockGetDataFromCache = jest.fn()
const mockDelCacheData = jest.fn()

jest.mock('@/lib/db/notion/getNotionAPI', () => ({
  getPage: (...args) => mockGetPage(...args)
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
      throwOnCollectionErrors: true
    })
    expect(validate).toHaveBeenCalledWith(recordMap)
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
