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
      },
      row: { value: { id: 'row', type: 'page' } }
    },
    collection_view: {
      'view-a': { value: { id: 'view-a' } },
      'view-b': { value: { id: 'view-b' } }
    },
    collection_query: {
      collection: {
        'view-a': { collection_group_results: { blockIds: ['row'] } },
        'view-b': { collection_group_results: { blockIds: ['row'] } }
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
          'view-a': { collection_group_results: { blockIds: ['row'] } }
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

  it('rejects collection queries that silently return zero rows', () => {
    const emptyQueries = {
      ...completeRecordMap,
      collection_query: {
        collection: {
          'view-a': { collection_group_results: { blockIds: [] } },
          'view-b': { collection_group_results: { blockIds: [] } }
        }
      }
    }

    expect(() => assertCompleteSiteRecordMap(emptyQueries, 'site')).toThrow(
      'returned zero rows for the primary database view'
    )
  })

  it('rejects a partial response when only an auxiliary view has rows', () => {
    const partialPrimaryView = {
      ...completeRecordMap,
      collection_query: {
        collection: {
          'view-a': { collection_group_results: { blockIds: [] } },
          'view-b': { collection_group_results: { blockIds: ['row'] } }
        }
      }
    }

    expect(() =>
      assertCompleteSiteRecordMap(partialPrimaryView, 'site')
    ).toThrow('returned zero rows for the primary database view')
  })

  it('rejects query rows that are missing from the block map', () => {
    const missingRow = {
      ...completeRecordMap,
      block: { site: completeRecordMap.block.site }
    }

    expect(() => assertCompleteSiteRecordMap(missingRow, 'site')).toThrow(
      'omitted 1 queried database rows'
    )
  })
})
