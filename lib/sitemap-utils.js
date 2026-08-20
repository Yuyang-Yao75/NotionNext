const isAbsoluteHttpUrl = value =>
  typeof value === 'string' && /^(https?:)?\/\//i.test(value.trim())

export const normalizeSitemapBaseUrl = link => {
  if (typeof link !== 'string') return ''
  return link.trim().replace(/\/+$/, '')
}

const isPrivateNetworkHostname = hostname => {
  const normalizedHostname = String(hostname || '')
    .replace(/^\[|\]$/g, '')
    .toLowerCase()

  if (
    normalizedHostname === 'localhost' ||
    normalizedHostname === '::1' ||
    normalizedHostname.endsWith('.local')
  ) {
    return true
  }

  if (/^(?:127|10|169\.254|192\.168)\./.test(normalizedHostname)) {
    return true
  }

  const match = normalizedHostname.match(/^172\.(\d{1,2})\./)
  return Boolean(match && Number(match[1]) >= 16 && Number(match[1]) <= 31)
}

/**
 * Normalize the public/canonical site URL. Public sites should not advertise
 * an insecure HTTP canonical URL, but local and private-network development
 * addresses must remain usable over HTTP.
 */
export const normalizeSiteUrl = link => {
  const normalizedLink = normalizeSitemapBaseUrl(link)
  if (!normalizedLink) return ''
  if (normalizedLink.startsWith('//')) return `https:${normalizedLink}`

  try {
    const url = new URL(normalizedLink)
    if (url.protocol === 'http:' && !isPrivateNetworkHostname(url.hostname)) {
      url.protocol = 'https:'
    }
    return url.toString().replace(/\/+$/, '')
  } catch {
    return normalizedLink
  }
}

export const normalizeSitemapLocale = locale => {
  if (!locale) return ''
  const value = String(locale).trim()
  if (!value) return ''
  return value.startsWith('/') ? value : `/${value}`
}

export const toSitemapDateString = (
  dateInput,
  fallbackDate = new Date().toISOString().split('T')[0]
) => {
  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) {
    return fallbackDate
  }
  return date.toISOString().split('T')[0]
}

export const buildSitemapLoc = ({
  baseUrl,
  locale = '',
  slug
} = {}) => {
  const normalizedBaseUrl = normalizeSitemapBaseUrl(baseUrl)
  if (!normalizedBaseUrl) return null

  const normalizedLocale = normalizeSitemapLocale(locale)

  if (slug === undefined || slug === null || slug === '') {
    return `${normalizedBaseUrl}${normalizedLocale}`
  }

  const rawSlug = String(slug).trim()
  if (!rawSlug || rawSlug === '#') {
    return null
  }

  if (isAbsoluteHttpUrl(rawSlug)) {
    try {
      const targetUrl = new URL(rawSlug, normalizedBaseUrl)
      const siteUrl = new URL(normalizedBaseUrl)

      // sitemap 仅收录本站链接，避免外链混入
      if (targetUrl.hostname !== siteUrl.hostname) {
        return null
      }

      return targetUrl.toString().replace(/\/+$/, '')
    } catch (error) {
      return null
    }
  }

  const normalizedSlug = rawSlug.replace(/^\/+/, '')
  if (!normalizedSlug) {
    return `${normalizedBaseUrl}${normalizedLocale}`
  }

  return `${normalizedBaseUrl}${normalizedLocale}/${normalizedSlug}`
}

export const createSiteUrl = (baseUrl, slug) =>
  buildSitemapLoc({ baseUrl, slug })
