import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
// import { getGlobalData } from '@/lib/db/getSiteData'
import { DynamicLayout } from '@/themes/theme'

/**
 * 登录
 * @param {*} props
 * @returns
 */
const SignIn = props => {
  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return <DynamicLayout theme={theme} layoutName='LayoutSignIn' {...props} />
}

export async function getStaticProps(req) {
  const { locale } = req

  const from = 'SignIn'
  const props = await fetchGlobalAllData({ from, locale })

  delete props.allPages
  return {
    // Authentication shell data changes only when the site is redeployed.
    // Avoid rebuilding this page from Notion every 60 seconds at request time.
    props
  }
}

/**
 * catch-all route for clerk
 * @returns
 */
export function getStaticPaths() {
  return {
    paths: [
      { params: { index: [] } }, // 使 /sign-in 路径可访问
      { params: { index: ['factor-one'] } } // 明确 sign-in 生成路径
    ],
    fallback: 'blocking' // 使用 'blocking' 模式让未生成的路径也能正确响应
  }
}

export default SignIn
