import busuanzi from '@/lib/plugins/busuanzi'
import { useRouter } from 'next/router'
import { useGlobal } from '@/lib/global'
import { useEffect, useRef } from 'react'

export default function Busuanzi() {
  const { theme } = useGlobal()
  const router = useRouter()
  const lastPathRef = useRef(router.asPath)

  useEffect(() => {
    const handleRouteChange = url => {
      if (url !== lastPathRef.current) {
        lastPathRef.current = url
        busuanzi.fetch()
      }
    }

    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])

  // 更换主题时更新
  useEffect(() => {
    if (theme) {
      busuanzi.fetch()
    }
  }, [theme])

  return null
}
