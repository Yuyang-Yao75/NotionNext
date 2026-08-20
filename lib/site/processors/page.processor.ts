import { cleanPages, cleanIds, shortenIds } from '@/lib/utils/clean.util'
import { applySchedulePublish } from '@/lib/site/processors/schedule.processor'
import type { SiteData } from '@/lib/site/site.types'
import { sanitizePublicNotionConfig } from '@/lib/config/publicNotionConfig'
import { normalizeSiteUrl } from '@/lib/sitemap-utils'

export function handleDataBeforeReturn(db: SiteData): SiteData {
  applySchedulePublish(db)

  db.NOTION_CONFIG = sanitizePublicNotionConfig(db.NOTION_CONFIG)
  if (db.NOTION_CONFIG.LINK) {
    db.NOTION_CONFIG.LINK = normalizeSiteUrl(String(db.NOTION_CONFIG.LINK))
  }
  if (db.siteInfo?.link) {
    db.siteInfo.link = normalizeSiteUrl(db.siteInfo.link)
  }

  db.categoryOptions = cleanIds(db.categoryOptions)
  db.customMenu = cleanIds(db.customMenu)

  db.allNavPages = cleanPages(db.allNavPages, db.tagOptions)
  db.allLinkPages = cleanPages(db.allLinkPages, db.tagOptions)
  db.allPages = cleanPages(db.allPages, db.tagOptions)
  db.latestPosts = cleanPages(db.latestPosts, db.tagOptions)

  delete db.block
  delete db.schema
  delete db.rawMetadata
  delete db.pageIds

  return db
}
