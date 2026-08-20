// import Image from 'next/image'
import LazyImage from '@/components/LazyImage'
import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { resolveGreetingWords } from '@/lib/site/greetingWords'
import { loadExternalResource } from '@/lib/utils'
import { useEffect, useRef } from 'react'
import CONFIG from '../config'

/**
 * 首页英雄区
 * 是一张大图，带个居中按钮
 * @returns 头图
 */
const Hero = props => {
  const typedElementRef = useRef(null)
  const typedInstanceRef = useRef(null)
  const typedOptionsRef = useRef(null)
  const wrapperTopRef = useRef(0)
  const { siteInfo } = props
  const { locale } = useGlobal()

  if (!typedOptionsRef.current) {
    typedOptionsRef.current = {
      strings: resolveGreetingWords({
        sharedWords: siteConfig('GREETING_WORDS'),
        fallbackWords: siteConfig('MATERY_HOME_BANNER_GREETINGS', [], CONFIG)
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
      className=' w-full h-screen relative bg-black'>
      <div className='text-white absolute flex flex-col h-full items-center justify-center w-full '>
        {/* 站点标题 */}
        <div className='text-4xl md:text-5xl shadow-text'>
          {siteInfo?.title || siteConfig('TITLE')}
        </div>
        {/* 站点欢迎语 */}
        <div className='mt-2 h-12 items-center text-center shadow-text text-white text-lg'>
          <span id='typed' ref={typedElementRef} />
        </div>
        {/* 滚动按钮 */}
        <div
          onClick={() => {
            window.scrollTo({ top: wrapperTopRef.current, behavior: 'smooth' })
          }}
          className='glassmorphism mt-12 border cursor-pointer w-40 text-center pt-4 pb-3 text-md text-white hover:bg-orange-600 duration-300 rounded-3xl z-40'>
          <i className='animate-bounce fas fa-angle-double-down' />{' '}
          <span>
            {siteConfig('MATERY_SHOW_START_READING', null, CONFIG) &&
              locale.COMMON.START_READING}
          </span>
        </div>
      </div>

      <LazyImage
        priority={true}
        id='header-cover'
        src={siteInfo?.pageCover}
        className={`header-cover object-center w-full h-screen object-cover ${siteConfig('MATERY_HOME_NAV_BACKGROUND_IMG_FIXED', null, CONFIG) ? 'fixed' : ''}`}
      />
    </header>
  )
}

export default Hero
