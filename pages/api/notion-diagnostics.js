import BLOG from '@/blog.config'
import notionAPI from '@/lib/db/notion/getNotionAPI'

function normalizeId(id) {
  return String(id || '').replace(/-/g, '').toLowerCase()
}

function unwrapBlock(entry) {
  return entry?.value?.value || entry?.value || entry
}

function countQueryRows(recordMap, collectionId, viewIds) {
  const queryEntry = Object.entries(recordMap?.collection_query || {}).find(
    ([id]) => normalizeId(id) === normalizeId(collectionId)
  )
  const queryByView = queryEntry?.[1] || {}

  return (viewIds || []).map(viewId => {
    const query =
      queryByView[viewId] ||
      Object.entries(queryByView).find(
        ([id]) => normalizeId(id) === normalizeId(viewId)
      )?.[1]
    const ids =
      query?.collection_group_results?.blockIds ||
      query?.reducerResults?.collection_group_results?.blockIds ||
      query?.results?.blockIds ||
      query?.blockIds ||
      []
    return { viewId, rowCount: ids.length }
  })
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0')
  const pageId = String(BLOG.NOTION_PAGE_ID || '').split(',')[0]

  try {
    const recordMap = await notionAPI.getPage(pageId, {
      throwOnCollectionErrors: true
    })
    const rootEntry = Object.entries(recordMap?.block || {}).find(
      ([id, entry]) =>
        normalizeId(id) === normalizeId(pageId) ||
        normalizeId(unwrapBlock(entry)?.id) === normalizeId(pageId)
    )
    const root = unwrapBlock(rootEntry?.[1])
    const viewIds = root?.view_ids || []

    return res.status(200).json({
      runtime: {
        region: process.env.VERCEL_REGION || null,
        apiBaseUrl: BLOG.API_BASE_URL,
        pageId,
        notionIndex: BLOG.NOTION_INDEX,
        authConfigured: Boolean(BLOG.NOTION_ACTIVE_USER || BLOG.NOTION_TOKEN_V2)
      },
      data: {
        blockCount: Object.keys(recordMap?.block || {}).length,
        collectionCount: Object.keys(recordMap?.collection || {}).length,
        collectionQueryCount: Object.keys(recordMap?.collection_query || {}).length,
        rootType: root?.type || null,
        collectionId: root?.collection_id || null,
        viewIds,
        queryRows: countQueryRows(recordMap, root?.collection_id, viewIds)
      }
    })
  } catch (error) {
    return res.status(500).json({
      runtime: {
        region: process.env.VERCEL_REGION || null,
        apiBaseUrl: BLOG.API_BASE_URL,
        pageId,
        notionIndex: BLOG.NOTION_INDEX,
        authConfigured: Boolean(BLOG.NOTION_ACTIVE_USER || BLOG.NOTION_TOKEN_V2)
      },
      error: {
        name: error?.name || null,
        code: error?.code || null,
        status: error?.status || error?.statusCode || null,
        message: error?.message || String(error)
      }
    })
  }
}
