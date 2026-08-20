/**
 * Return database view ids whose query results are missing from a record map.
 *
 * notion-client can occasionally return a partial page after an internal
 * queryCollection request fails. Treating that partial response as a valid
 * site database produces a successful deployment with zero posts.
 */
function normalizeNotionId(id) {
  return String(id || '').replace(/-/g, '').toLowerCase()
}

function unwrapBlock(entry) {
  return entry?.value?.value || entry?.value || entry
}

function getRootDatabaseBlock(recordMap, pageId) {
  const normalizedPageId = normalizeNotionId(pageId)
  const matchingEntry = Object.entries(recordMap?.block || {}).find(
    ([blockId, entry]) =>
      normalizeNotionId(blockId) === normalizedPageId ||
      normalizeNotionId(unwrapBlock(entry)?.id) === normalizedPageId
  )
  return unwrapBlock(matchingEntry?.[1])
}

function getQueryBlockIds(recordMap, collectionId, viewIds) {
  const normalizedCollectionId = normalizeNotionId(collectionId)
  const queryByViewEntry = Object.entries(
    recordMap?.collection_query || {}
  ).find(
    ([queryCollectionId]) =>
      normalizeNotionId(queryCollectionId) === normalizedCollectionId
  )
  const queryByView = queryByViewEntry?.[1] || {}

  return [
    ...new Set(
      viewIds.flatMap(viewId => {
        const query = queryByView[viewId]
        return query?.collection_group_results?.blockIds || []
      })
    )
  ]
}

export function getMissingCollectionQueryViewIds(recordMap, viewIds) {
  viewIds = viewIds || Object.keys(recordMap?.collection_view || {})
  if (!viewIds.length) return []

  const queriedViewIds = new Set(
    Object.values(recordMap?.collection_query || {}).flatMap(queryByView =>
      Object.keys(queryByView || {})
    )
  )

  return viewIds.filter(viewId => !queriedViewIds.has(viewId))
}

/**
 * Fail fast when the root Notion database response is empty or incomplete.
 */
export function assertCompleteSiteRecordMap(recordMap, pageId) {
  if (!recordMap?.block || Object.keys(recordMap.block).length === 0) {
    const error = new Error(`Notion returned no blocks for site ${pageId}`)
    error.code = 'NOTION_INCOMPLETE_DATABASE_RESPONSE'
    throw error
  }

  const rootBlock = getRootDatabaseBlock(recordMap, pageId)
  const isDatabase =
    rootBlock?.type === 'collection_view_page' ||
    rootBlock?.type === 'collection_view'
  const viewIds = rootBlock?.view_ids || []

  if (!isDatabase || !rootBlock?.collection_id || !viewIds.length) {
    const error = new Error(
      `Notion site root ${pageId} is not a complete database`
    )
    error.code = 'NOTION_INCOMPLETE_DATABASE_RESPONSE'
    throw error
  }

  const missingViewIds = getMissingCollectionQueryViewIds(recordMap, viewIds)
  if (missingViewIds.length) {
    const error = new Error(
      `Notion returned incomplete collection queries for site ${pageId}: ${missingViewIds.join(', ')}`
    )
    error.code = 'NOTION_INCOMPLETE_DATABASE_RESPONSE'
    throw error
  }

  const queryBlockIds = getQueryBlockIds(
    recordMap,
    rootBlock.collection_id,
    [viewIds[0]]
  )
  if (!queryBlockIds.length) {
    const error = new Error(
      `Notion returned zero rows for the primary database view of site ${pageId}`
    )
    error.code = 'NOTION_INCOMPLETE_DATABASE_RESPONSE'
    throw error
  }

  const availableBlockIds = new Set(
    Object.keys(recordMap.block).map(normalizeNotionId)
  )
  const missingBlockIds = queryBlockIds.filter(
    blockId => !availableBlockIds.has(normalizeNotionId(blockId))
  )
  if (missingBlockIds.length) {
    const error = new Error(
      `Notion omitted ${missingBlockIds.length} queried database rows for site ${pageId}`
    )
    error.code = 'NOTION_INCOMPLETE_DATABASE_RESPONSE'
    throw error
  }

  return recordMap
}
