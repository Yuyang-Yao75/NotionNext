// import Image from 'next/image'
import LazyImage from '@/components/LazyImage'
import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { resolveGreetingWords } from '@/lib/site/greetingWords'
import { loadExternalResource } from '@/lib/utils'
import { useEffect, useRef } from 'react'
import CONFIG from '../config'
import NavButtonGroup from './NavButtonGroup'

/**
 * 顶部全屏大图
 * @returns
 */
const Hero = props => {
  const typedElementRef = useRef(null)
  const typedInstanceRef = useRef(null)
  const typedOptionsRef = useRef(null)
  const wrapperTopRef = useRef(0)
  const { siteInfo } = props
  const { locale } = useGlobal()
  const scrollToWrapper = () => {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize)
    window.scrollTo({ top: wrapperTopRef.current - 2 * rem, behavior: 'smooth' })
  }

  if (!typedOptionsRef.current) {
    typedOptionsRef.current = {
      strings: resolveGreetingWords({
        sharedWords: siteConfig('GREETING_WORDS'),
        fallbackWords: siteConfig('HEXO_HOME_BANNER_GREETINGS', [], CONFIG)
      }),
      typeSpeed: Number(siteConfig('GREETING_WORDS_TYPE_SPEED')) || 200,
      backSpeed: Number(siteConfig('GREETING_WORDS_BACK_SPEED')) || 100,
      backDelay: 400,
      showCursor: true,
      smartBackspace: true
    }
  }

  useEffect(() => {
    let cancelled = false
    let animationFrameId = null

    const updateHeaderHeight = () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId)
      }
      animationFrameId = requestAnimationFrame(() => {
        const wrapperElement = document.getElementById('wrapper')
        wrapperTopRef.current = wrapperElement?.offsetTop || 0
      })
    }

    updateHeaderHeight()

    if (typedElementRef.current) {
      loadExternalResource('/js/typed.min.js', 'js').then(() => {
        if (
          !cancelled &&
          window.Typed &&
          typedElementRef.current &&
          !typedInstanceRef.current
        ) {
          typedInstanceRef.current = new window.Typed(
            typedElementRef.current,
            typedOptionsRef.current
          )
        }
      })
    }

    window.addEventListener('resize', updateHeaderHeight)
    return () => {
      cancelled = true
      window.removeEventListener('resize', updateHeaderHeight)
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId)
      }
      typedInstanceRef.current?.destroy?.()
      typedInstanceRef.current = null
    }
  }, [])

  return (
    <header
      id='header'
      style={{ zIndex: 1 }}
      className='w-full h-screen relative bg-black'>
      <div className='text-white absolute bottom-0 flex flex-col h-full items-center justify-center w-full '>
        {/* 站点标题 */}
        <div className='font-bold text-4xl md:text-5xl shadow-text'>
          {siteInfo?.title || siteConfig('TITLE')}
        </div>
        {/* 站点欢迎语 */}
        <div className='mt-2 h-12 items-center text-center font-light shadow-text text-lg'>
          <span id='typed' ref={typedElementRef} />
        </div>

        {/* 首页导航大按钮 */}
        {siteConfig('HEXO_HOME_NAV_BUTTONS', null, CONFIG) && (
          <NavButtonGroup {...props} />
        )}

        {/* 滚动按钮 */}
        <div
          onClick={scrollToWrapper}
          className='z-10 cursor-pointer w-full text-center py-4 text-3xl absolute bottom-10 text-white [text-shadow:0_0_0.1em_black,0_0_0.2em_black]'>
          <div className='opacity-70 animate-bounce text-xs'>
            {siteConfig('HEXO_SHOW_START_READING', null, CONFIG) &&
              locale.COMMON.START_READING}
          </div>
          <i className='opacity-70 animate-bounce fas fa-angle-down' />
        </div>
      </div>

      <LazyImage
        priority
        id='header-cover'
        alt={siteInfo?.title}
        src={siteInfo?.pageCover}
        width={1920}
        height={1080}
        className={`header-cover w-full h-screen object-cover object-center ${siteConfig('HEXO_HOME_NAV_BACKGROUND_IMG_FIXED', null, CONFIG) ? 'fixed' : ''}`}
      />
    </header>
  )
}

export default Hero
