/**
 * Return database view ids whose query results are missing from a record map.
 *
 * notion-client can occasionally return a partial page after an internal
 * queryCollection request fails. Treating that partial response as a valid
 * site database produces a successful deployment with zero posts.
 */
export function getMissingCollectionQueryViewIds(recordMap) {
  const viewIds = Object.keys(recordMap?.collection_view || {})
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

  const missingViewIds = getMissingCollectionQueryViewIds(recordMap)
  if (missingViewIds.length) {
    const error = new Error(
      `Notion returned incomplete collection queries for site ${pageId}: ${missingViewIds.join(', ')}`
    )
    error.code = 'NOTION_INCOMPLETE_DATABASE_RESPONSE'
    throw error
  }

  return recordMap
}
