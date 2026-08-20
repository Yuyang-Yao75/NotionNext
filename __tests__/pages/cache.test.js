import { cleanCache } from '@/lib/cache/local_file_cache'
import handler from '@/pages/api/cache'

jest.mock('@/lib/cache/local_file_cache', () => ({
  cleanCache: jest.fn()
}))

const createResponse = () => {
  const response = {
    headers: {},
    statusCode: null,
    payload: null,
    setHeader: jest.fn((key, value) => {
      response.headers[key] = value
    }),
    status: jest.fn(code => {
      response.statusCode = code
      return response
    }),
    json: jest.fn(payload => {
      response.payload = payload
      return response
    })
  }
  return response
}

describe('/api/cache', () => {
  const originalToken = process.env.CACHE_REVALIDATION_TOKEN

  afterEach(() => {
    if (originalToken === undefined) {
      delete process.env.CACHE_REVALIDATION_TOKEN
    } else {
      process.env.CACHE_REVALIDATION_TOKEN = originalToken
    }
  })

  it('does not expose cache mutation when no token is configured', () => {
    delete process.env.CACHE_REVALIDATION_TOKEN
    const res = createResponse()

    handler({ method: 'POST', headers: {} }, res)

    expect(res.statusCode).toBe(503)
    expect(cleanCache).not.toHaveBeenCalled()
    expect(res.headers['Cache-Control']).toBe('no-store, max-age=0')
  })

  it('rejects a request without the configured bearer token', () => {
    process.env.CACHE_REVALIDATION_TOKEN = 'expected-token'
    const res = createResponse()

    handler({ method: 'POST', headers: {} }, res)

    expect(res.statusCode).toBe(401)
    expect(cleanCache).not.toHaveBeenCalled()
  })

  it('clears the cache only for an authenticated POST request', () => {
    process.env.CACHE_REVALIDATION_TOKEN = 'expected-token'
    const res = createResponse()

    handler(
      {
        method: 'POST',
        headers: { authorization: 'Bearer expected-token' }
      },
      res
    )

    expect(cleanCache).toHaveBeenCalledTimes(1)
    expect(res.statusCode).toBe(200)
    expect(res.payload.status).toBe('success')
  })

  it('returns an Allow header for unsupported methods', () => {
    const res = createResponse()

    handler({ method: 'GET', headers: {} }, res)

    expect(res.statusCode).toBe(405)
    expect(res.headers.Allow).toBe('POST')
    expect(cleanCache).not.toHaveBeenCalled()
  })
})
