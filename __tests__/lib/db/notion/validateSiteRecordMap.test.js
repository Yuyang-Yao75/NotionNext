import {
  assertCompleteSiteRecordMap,
  getMissingCollectionQueryViewIds
} from '@/lib/db/notion/validateSiteRecordMap'

describe('validateSiteRecordMap', () => {
  const completeRecordMap = {
    block: {
      site: {
        value: {
          value: {
            id: 'site',
            type: 'collection_view_page',
            collection_id: 'collection',
            view_ids: ['view-a', 'view-b']
          }
        }
      }
    },
    collection_view: {
      'view-a': { value: { id: 'view-a' } },
      'view-b': { value: { id: 'view-b' } }
    },
    collection_query: {
      collection: {
        'view-a': { collection_group_results: {} },
        'view-b': { collection_group_results: {} }
      }
    }
  }

  it('accepts a complete database response', () => {
    expect(assertCompleteSiteRecordMap(completeRecordMap, 'site')).toBe(
      completeRecordMap
    )
    expect(getMissingCollectionQueryViewIds(completeRecordMap)).toEqual([])
  })

  it('rejects a response with a missing database view query', () => {
    const partialRecordMap = {
      ...completeRecordMap,
      collection_query: {
        collection: {
          'view-a': { collection_group_results: {} }
        }
      }
    }

    expect(getMissingCollectionQueryViewIds(partialRecordMap)).toEqual([
      'view-b'
    ])
    expect(() => assertCompleteSiteRecordMap(partialRecordMap, 'site')).toThrow(
      'incomplete collection queries'
    )
  })

  it('rejects an empty page response', () => {
    expect(() => assertCompleteSiteRecordMap({}, 'site')).toThrow(
      'returned no blocks'
    )
  })

  it('rejects a root page that is not a database', () => {
    expect(() =>
      assertCompleteSiteRecordMap(
        { block: { site: { value: { id: 'site', type: 'page' } } } },
        'site'
      )
    ).toThrow('is not a complete database')
  })
})
