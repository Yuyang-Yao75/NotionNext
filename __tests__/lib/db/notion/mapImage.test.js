import {
  getNotionImageTable,
  isSignedNotionFileUrl,
  mapImgUrl
} from '@/lib/db/notion/mapImage'

describe('Notion image URL mapping', () => {
  it('preserves signed S3 URLs without adding cache-busting parameters', () => {
    const signedUrl =
      'https://s3-us-west-2.amazonaws.com/secure.notion-static.com/icon.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=test&X-Amz-Signature=signature'

    expect(isSignedNotionFileUrl(signedUrl)).toBe(true)
    expect(mapImgUrl(signedUrl, { id: 'page', type: 'page' })).toBe(signedUrl)
  })

  it('preserves Notion user-content CDN URLs', () => {
    const iconUrl = 'https://img.notionusercontent.com/s3/prod-files/icon.png'

    expect(mapImgUrl(iconUrl, { id: 'page', type: 'page' })).toBe(iconUrl)
  })

  it('uses the block table for collection row icons', () => {
    const mapped = mapImgUrl(
      'https://prod-files-secure.s3.us-west-2.amazonaws.com/space/icon.png',
      { id: 'page', type: 'page', parent_table: 'collection' },
      'collection',
      false
    )
    const url = new URL(mapped)

    expect(url.pathname).toContain('/image/')
    expect(url.searchParams.get('table')).toBe('block')
    expect(url.searchParams.get('id')).toBe('page')
  })

  it('normalizes Notion parent tables', () => {
    expect(getNotionImageTable({ parent_table: 'space' })).toBe('block')
    expect(getNotionImageTable({ parent_table: 'collection' })).toBe('block')
    expect(getNotionImageTable({ parent_table: 'block' })).toBe('block')
  })
})
