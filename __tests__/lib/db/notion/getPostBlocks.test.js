jest.mock('@/lib/db/notion/getNotionAPI', () => ({
  __esModule: true,
  default: {
    getSignedFileUrls: jest.fn()
  }
}))
jest.mock('p-limit', () => () => fn => fn())
jest.mock('notion-utils', () => ({
  getBlockValue: jest.fn(entry => entry?.value?.value || entry?.value || entry)
}))

import {
  formatNotionBlock,
  hasExpiredSignedUrls,
  preferStablePdfSignedUrls,
  refreshPageIconUrls
} from '@/lib/db/notion/getPostBlocks'
import notionAPI from '@/lib/db/notion/getNotionAPI'
import {
  isExternalVideoEmbedUrl,
  isAppleMusicEmbedUrl,
  normalizeExternalMediaBlock
} from '@/lib/db/notion/normalizeExternalMediaBlock'

describe('formatNotionBlock', () => {
  beforeEach(() => {
    notionAPI.getSignedFileUrls.mockReset()
  })

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
        source: [['https://embed.music.apple.com/us/song/neon-blue/324357768']]
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
            source: [
              [
                'https://embed.music.apple.com/us/song/never-gonna-give-you-up/1559523357?i=1559523359'
              ]
            ]
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
            source: [
              [
                'https://www.happinessrailway.com/dplayer.htm?n=https%3A%2F%2Fvip.lz-cdn16.com%2F20230312%2F12364_a86fbcc4%2Findex.m3u8'
              ]
            ]
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

  it('rewrites newer Notion pdf file URLs to signed URLs', () => {
    const formatted = formatNotionBlock({
      pdf: {
        value: {
          id: 'pdf-block',
          type: 'pdf',
          properties: {
            source: [
              [
                'https://prod-files-secure.s3.us-west-2.amazonaws.com/space/file.pdf'
              ]
            ]
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
              source: [
                [
                  'https://prod-files-secure.s3.us-west-2.amazonaws.com/file.pdf'
                ]
              ]
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

  it('signs uploaded page icons in inline database rows', async () => {
    const signedUrl =
      'https://file.notion.so/f/icon.png?expirationTimestamp=4102444800000'
    notionAPI.getSignedFileUrls.mockResolvedValue({ signedUrls: [signedUrl] })
    const recordMap = {
      block: {
        row: {
          value: {
            id: 'row',
            type: 'page',
            format: {
              page_icon: 'attachment:icon-id:icon.png'
            }
          }
        }
      }
    }

    await expect(refreshPageIconUrls(recordMap)).resolves.toBe(true)

    expect(notionAPI.getSignedFileUrls).toHaveBeenCalledWith([
      {
        permissionRecord: { table: 'block', id: 'row' },
        url: 'attachment:icon-id:icon.png'
      }
    ])
    expect(recordMap.block.row.value.format).toMatchObject({
      page_icon: signedUrl,
      page_icon_source: 'attachment:icon-id:icon.png'
    })
  })

  it('keeps a non-expiring page icon without requesting a new signature', async () => {
    const recordMap = {
      block: {
        row: {
          value: {
            id: 'row',
            type: 'page',
            format: {
              page_icon: 'https://img.notionusercontent.com/icon.png'
            }
          }
        }
      }
    }

    await expect(refreshPageIconUrls(recordMap)).resolves.toBe(false)
    expect(notionAPI.getSignedFileUrls).not.toHaveBeenCalled()
  })

  it('renews an expired cached page icon from its original source', async () => {
    const refreshedUrl =
      'https://file.notion.so/f/icon.png?expirationTimestamp=4102444800000'
    notionAPI.getSignedFileUrls.mockResolvedValue({
      signedUrls: [refreshedUrl]
    })
    const recordMap = {
      block: {
        row: {
          value: {
            id: 'row',
            type: 'page',
            format: {
              page_icon:
                'https://file.notion.so/f/icon.png?expirationTimestamp=1',
              page_icon_source: 'attachment:icon-id:icon.png'
            }
          }
        }
      }
    }

    await expect(refreshPageIconUrls(recordMap)).resolves.toBe(true)
    expect(notionAPI.getSignedFileUrls).toHaveBeenCalledWith([
      {
        permissionRecord: { table: 'block', id: 'row' },
        url: 'attachment:icon-id:icon.png'
      }
    ])
    expect(recordMap.block.row.value.format.page_icon).toBe(refreshedUrl)
  })
})
