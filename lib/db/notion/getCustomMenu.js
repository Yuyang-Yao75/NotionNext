function normalizeSourceSlug(slug) {
  if (typeof slug !== 'string') {
    return ''
  }

  const normalized = slug.trim()
  if (
    !normalized ||
    normalized === '#' ||
    /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(normalized)
  ) {
    return ''
  }

  return normalized.replace(/^\/+|\/+$/g, '')
}

export function getSourcePageSlugs(collectionData) {
  return new Map(
    collectionData
      .filter(page => page?.type === 'Page' && page?.slug)
      .map(page => [page.id, page.slug])
  )
}

function getPageHrefBySourceSlug(collectionData, sourcePageSlugs) {
  const pageHrefBySourceSlug = new Map()
  const ambiguousSlugs = new Set()

  collectionData.forEach(page => {
    const isDirectlyRoutable =
      page?.status === 'Published' || page?.status === 'Invisible'
    if (page?.type !== 'Page' || !isDirectlyRoutable || !page?.href) {
      return
    }

    const sourceSlug = normalizeSourceSlug(sourcePageSlugs?.get(page.id))
    if (!sourceSlug || ambiguousSlugs.has(sourceSlug)) {
      return
    }

    const existingHref = pageHrefBySourceSlug.get(sourceSlug)
    if (existingHref && existingHref !== page.href) {
      pageHrefBySourceSlug.delete(sourceSlug)
      ambiguousSlugs.add(sourceSlug)
      return
    }

    pageHrefBySourceSlug.set(sourceSlug, page.href)
  })

  return pageHrefBySourceSlug
}

export function getCustomMenu({ collectionData, sourcePageSlugs }) {
  const pageHrefBySourceSlug = getPageHrefBySourceSlug(
    collectionData,
    sourcePageSlugs
  )
  const menuPages = collectionData.filter(
    post =>
      post.status === 'Published' &&
      (post?.type === 'Menu' || post?.type === 'SubMenu')
  )
  const menus = []
  if (menuPages && menuPages.length > 0) {
    menuPages.forEach(sourceItem => {
      // Menu data is derived from flat Notion rows. Never reuse a subMenus
      // property left on a cached/source object, and do not mutate collectionData.
      const { subMenus: _staleSubMenus, ...e } = sourceItem
      e.show = true
      const sourceSlug = normalizeSourceSlug(e.slug)
      if (sourceSlug && pageHrefBySourceSlug.has(sourceSlug)) {
        e.href = pageHrefBySourceSlug.get(sourceSlug)
      }
      if (e.type === 'Menu') {
        menus.push(e)
      } else if (e.type === 'SubMenu') {
        const parentMenu = menus[menus.length - 1]
        if (parentMenu) {
          parentMenu.subMenus = [...(parentMenu.subMenus || []), e]
        }
      }
    })
  }
  return menus
}
