jest.mock('@/lib/db/notion/getNotionAPI', () => ({
  getSignedFileUrls: jest.fn()
}))
jest.mock('@/lib/cache/cache_manager', () => ({
  delCacheData: jest.fn(),
  getDataFromCache: jest.fn(),
  getOrSetDataWithCache: jest.fn(),
  setDataToCache: jest.fn()
}))
jest.mock('p-limit', () => () => fn => fn())
jest.mock('notion-utils', () => ({
  getBlockValue: jest.fn(entry => entry?.value?.value || entry?.value || entry)
}))

import {
  fetchNotionPageBlocks,
  formatNotionBlock,
  getPageBlockCacheKey,
  hasExpiredSignedUrls,
  preferStablePdfSignedUrls
} from '@/lib/db/notion/getPostBlocks'
import notionAPI from '@/lib/db/notion/getNotionAPI'
import {
  getOrSetDataWithCache,
  setDataToCache
} from '@/lib/cache/cache_manager'
import {
  isExternalVideoEmbedUrl,
  isAppleMusicEmbedUrl,
  normalizeExternalMediaBlock
} from '@/lib/db/notion/normalizeExternalMediaBlock'

describe('formatNotionBlock', () => {
  it('detects Apple Music single-track embed URLs', () => {
    expect(
      isAppleMusicEmbedUrl(
        'https://embed.music.apple.com/us/song/neon-blue/324357768'
      )
    ).toBe(true)

    expect(
      isAppleMusicEmbedUrl(
        'https://embed.music.apple.com/us/album/girls-come-too/324357208'
      )
    ).toBe(false)
  })

  it('rewrites Apple Music song video blocks to embeds directly', () => {
    const blockValue = {
      type: 'video',
      properties: {
        source: [
          ['https://embed.music.apple.com/us/song/neon-blue/324357768']
        ]
      }
    }

    normalizeExternalMediaBlock(blockValue)

    expect(blockValue.type).toBe('embed')
  })

  it('rewrites external video player pages to embeds directly', () => {
    const url =
      'https://www.happinessrailway.com/dplayer.htm?n=https%3A%2F%2Fvip.lz-cdn16.com%2F20230312%2F12364_a86fbcc4%2Findex.m3u8'
    const blockValue = {
      type: 'video',
      properties: {
        source: [[url]]
      }
    }

    expect(isExternalVideoEmbedUrl(url)).toBe(true)
    normalizeExternalMediaBlock(blockValue)

    expect(blockValue.type).toBe('embed')
  })

  it('leaves non-matching video blocks unchanged during direct normalization', () => {
    const blockValue = {
      type: 'video',
      properties: {
        source: [['https://www.youtube.com/watch?v=dQw4w9WgXcQ']]
      }
    }

    normalizeExternalMediaBlock(blockValue)

    expect(blockValue.type).toBe('video')
  })

  it('normalizes Apple Music song embeds from video blocks to embed blocks', () => {
    const formatted = formatNotionBlock({
      'apple-music-song': {
        value: {
          id: 'apple-music-song',
          type: 'video',
          properties: {
            source: [[
              'https://embed.music.apple.com/us/song/never-gonna-give-you-up/1559523357?i=1559523359'
            ]]
          }
        }
      }
    })

    expect(formatted['apple-music-song'].value.type).toBe('embed')
  })

  it('normalizes external video player pages from video blocks to embed blocks', () => {
    const formatted = formatNotionBlock({
      'external-player': {
        value: {
          id: 'external-player',
          type: 'video',
          properties: {
            source: [[
              'https://www.happinessrailway.com/dplayer.htm?n=https%3A%2F%2Fvip.lz-cdn16.com%2F20230312%2F12364_a86fbcc4%2Findex.m3u8'
            ]]
          }
        }
      }
    })

    expect(formatted['external-player'].value.type).toBe('embed')
  })

  it('relinks synced block content children to the original parent', () => {
    const formatted = formatNotionBlock({
      page: {
        value: {
          id: 'page',
          type: 'page',
          content: ['sync']
        }
      },
      sync: {
        value: {
          id: 'sync',
          type: 'sync_block',
          parent_id: 'page',
          content: ['notice-line']
        }
      },
      'notice-line': {
        value: {
          id: 'notice-line',
          type: 'text',
          parent_id: 'sync',
          properties: {
            title: [['Notice']]
          }
        }
      }
    })

    expect(formatted.page.value.content).toEqual(['sync_child_0'])
    expect(formatted.sync).toBeUndefined()
    expect(formatted['notice-line']).toBeUndefined()
    expect(formatted.sync_child_0.value.id).toBe('sync_child_0')
    expect(formatted.sync_child_0.value.parent_id).toBe('page')
  })

  it('relinks synced block inline children to the original parent', () => {
    const formatted = formatNotionBlock({
      page: {
        value: {
          id: 'page',
          type: 'page',
          content: ['sync']
        }
      },
      sync: {
        value: {
          id: 'sync',
          type: 'sync_block',
          parent_id: 'page',
          children: [
            {
              value: {
                id: 'inline-child',
                type: 'text',
                parent_id: 'sync',
                properties: {
                  title: [['Inline notice']]
                }
              }
            }
          ]
        }
      }
    })

    expect(formatted.page.value.content).toEqual(['sync_child_0'])
    expect(formatted.sync).toBeUndefined()
    expect(formatted.sync_child_0.value.id).toBe('sync_child_0')
    expect(formatted.sync_child_0.value.parent_id).toBe('page')
  })

  it('keeps regular hosted videos as video blocks', () => {
    const formatted = formatNotionBlock({
      'hosted-video': {
        value: {
          id: 'hosted-video',
          type: 'video',
          properties: {
            source: [['https://cdn.example.com/videos/demo.mp4']]
          }
        }
      }
    })

    expect(formatted['hosted-video'].value.type).toBe('video')
  })

  it('marks newer Notion callouts with removed icons', () => {
    const formatted = formatNotionBlock({
      callout: {
        value: {
          id: 'callout',
          type: 'callout',
          format: {
            page_icon: '💡'
          },
          callout: {
            icon: null,
            color: 'gray_background',
            rich_text: [
              {
                plain_text: 'No icon',
                annotations: { bold: true }
              }
            ]
          }
        }
      }
    })

    expect(formatted.callout.value.format.page_icon).toBeUndefined()
    expect(formatted.callout.value.format.callout_no_icon).toBe(true)
    expect(formatted.callout.value.format.block_color).toBe('gray_background')
    expect(formatted.callout.value.properties.title).toEqual([
      ['No icon', [['b']]]
    ])
  })

  it('maps newer Notion callout emoji icons to legacy renderer fields', () => {
    const formatted = formatNotionBlock({
      callout: {
        value: {
          id: 'callout',
          type: 'callout',
          callout: {
            icon: {
              type: 'emoji',
              emoji: '✅'
            }
          }
        }
      }
    })

    expect(formatted.callout.value.format.page_icon).toBe('✅')
    expect(formatted.callout.value.format.callout_no_icon).toBeUndefined()
  })

  it('rewrites newer Notion pdf file URLs to signed URLs', () => {
    const formatted = formatNotionBlock({
      pdf: {
        value: {
          id: 'pdf-block',
          type: 'pdf',
          properties: {
            source: [[
              'https://prod-files-secure.s3.us-west-2.amazonaws.com/space/file.pdf'
            ]]
          }
        }
      }
    })

    expect(formatted.pdf.value.properties.source[0][0]).toBe(
      'https://notion.so/signed/https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2Fspace%2Ffile.pdf?table=block&id=pdf-block'
    )
  })

  it('does not rewrite lookalike Notion file URLs', () => {
    const url = 'https://evil.example/secure.notion-static.com/file.pdf'
    const formatted = formatNotionBlock({
      pdf: {
        value: {
          id: 'pdf-block',
          type: 'pdf',
          properties: {
            source: [[url]]
          }
        }
      }
    })

    expect(formatted.pdf.value.properties.source[0][0]).toBe(url)
  })

  it('detects expired cached Notion signed URLs', () => {
    expect(
      hasExpiredSignedUrls({
        signed_urls: {
          pdf: 'https://file.notion.so/f/file.pdf?expirationTimestamp=1'
        }
      })
    ).toBe(true)
  })

  it('uses stable Notion signed entry for pdf preview URLs', () => {
    const recordMap = {
      signed_urls: {
        pdf: 'https://file.notion.so/f/file.pdf?expirationTimestamp=1'
      },
      block: {
        pdf: {
          value: {
            id: 'pdf',
            type: 'pdf',
            properties: {
              source: [['https://prod-files-secure.s3.us-west-2.amazonaws.com/file.pdf']]
            }
          }
        }
      }
    }

    preferStablePdfSignedUrls(recordMap)

    expect(recordMap.signed_urls.pdf).toBe(
      'https://notion.so/signed/https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2Ffile.pdf?table=block&id=pdf'
    )
  })

  it.each(['tab', 'tabs'])(
    'maps Notion %s containers to internal tabs embeds',
    originalType => {
      const formatted = formatNotionBlock({
        tabs: {
          value: {
            id: 'tabs',
            type: originalType,
            format: {
              block_color: 'gray_background'
            },
            content: ['tab-a', 'tab-b']
          }
        },
        'tab-a': {
          value: {
            id: 'tab-a',
            type: 'text',
            parent_id: 'tabs',
            properties: {
              title: [['First']]
            }
          }
        }
      })

      expect(formatted.tabs.value.type).toBe('embed')
      expect(formatted.tabs.value.content).toEqual(['tab-a', 'tab-b'])
      expect(formatted.tabs.value.format).toMatchObject({
        block_color: 'gray_background',
        embed_variant: 'notion_tabs',
        notion_next_original_type: originalType
      })
      expect(formatted['tab-a'].value.type).toBe('text')
    }
  )
})

describe('fetchNotionPageBlocks signed URL refresh', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.each([
    'https://notion.so/signed/attachment%3Afile-id%3Areport.pdf?table=block&id=file-block',
    'https://cdn.example.com/files/report.pdf'
  ])('does not refresh a URL without an expiration timestamp: %s', async url => {
    const recordMap = {
      signed_urls: { 'file-block': url },
      block: {
        'file-block': {
          value: {
            id: 'file-block',
            type: 'file',
            properties: { source: [[url]] }
          }
        }
      }
    }
    getOrSetDataWithCache.mockResolvedValueOnce(recordMap)

    expect(hasExpiredSignedUrls(recordMap)).toBe(false)
    await expect(fetchNotionPageBlocks('page-id', 'test')).resolves.toBe(recordMap)
    expect(notionAPI.getSignedFileUrls).not.toHaveBeenCalled()
    expect(setDataToCache).not.toHaveBeenCalled()
  })

  it.each([
    ['file.notion.com', 'source'],
    ['file.notion.so', 'source'],
    ['file.notion.com', 'page_cover'],
    ['file.notion.so', 'page_cover']
  ])('refreshes an expired %s URL stored in %s', async (hostname, location) => {
    const attachmentId = '89da7f2e-0215-4515-8cc8-204d6646257f'
    const baseUrl = `https://${hostname}/f/f/427487c8-7fd8-81dc-a5ee-00034e84d0b0/${attachmentId}/report.pdf`
    const expiredUrl = `${baseUrl}?expirationTimestamp=1&signature=expired`
    const freshUrl = `${baseUrl}?expirationTimestamp=${Date.now() + 60 * 60 * 1000}&signature=fresh`
    const block = {
      id: 'file-block',
      type: location === 'page_cover' ? 'page' : 'file',
      ...(location === 'page_cover'
        ? { format: { page_cover: expiredUrl } }
        : { properties: { source: [[expiredUrl]] } })
    }
    const recordMap = {
      block: { 'file-block': { value: { value: block } } }
    }
    getOrSetDataWithCache.mockResolvedValueOnce(recordMap)
    notionAPI.getSignedFileUrls.mockResolvedValueOnce({ signedUrls: [freshUrl] })

    expect(hasExpiredSignedUrls(recordMap)).toBe(true)
    await expect(fetchNotionPageBlocks('page-id', 'test')).resolves.toBe(recordMap)
    expect(notionAPI.getSignedFileUrls).toHaveBeenCalledTimes(1)
    expect(notionAPI.getSignedFileUrls).toHaveBeenCalledWith([
      {
        permissionRecord: { table: 'block', id: 'file-block' },
        url: `attachment:${attachmentId}:report.pdf`
      }
    ])
    expect(recordMap.signed_urls['file-block']).toBe(freshUrl)
    expect(
      location === 'page_cover'
        ? block.format.page_cover
        : block.properties.source[0][0]
    ).toBe(freshUrl)
    expect(setDataToCache).toHaveBeenCalledWith(
      getPageBlockCacheKey('page-id'),
      recordMap,
      null
    )
    expect(hasExpiredSignedUrls(recordMap)).toBe(false)
  })
})
