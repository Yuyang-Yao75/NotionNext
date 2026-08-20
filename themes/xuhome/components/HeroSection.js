import { siteConfig } from '@/lib/config'
import { resolveGreetingWords } from '@/lib/site/greetingWords'
import CONFIG from '../config'
import Typewriter from './Typewriter'

export default function HeroSection(props) {
  const heroBio = siteConfig('XUHOME_HERO_BIO', '', CONFIG) || siteConfig('BIO')
  const heroTitle =
    siteConfig('XUHOME_HERO_TITLE', '', CONFIG) || siteConfig('TITLE')
  const heroTexts = resolveGreetingWords({
    themeWords: siteConfig('XUHOME_HERO_TEXTS', '', CONFIG),
    sharedWords: siteConfig('GREETING_WORDS'),
    fallbackWords: [heroTitle]
  })
  const typeSpeed = siteConfig('XUHOME_HERO_TYPE_SPEED', 80, CONFIG)
  const deleteSpeed = siteConfig('XUHOME_HERO_DELETE_SPEED', 40, CONFIG)
  const typePause = siteConfig('XUHOME_HERO_TYPE_PAUSE', 2000, CONFIG)

  return (
    <div className='mb-8'>
      <div
        className='text-3xl font-black uppercase tracking-tight mb-2 min-h-[2.5rem]'
        style={{ color: 'var(--xuhome-hero-title-active)' }}
      >
        {heroTexts.length > 1 ? (
          <Typewriter
            texts={heroTexts}
            speed={typeSpeed}
            deleteSpeed={deleteSpeed}
            pause={typePause}
            loop={true}
          />
        ) : (
          <Typewriter texts={heroTexts} speed={typeSpeed} loop={false} />
        )}
      </div>

      {heroBio && (
        <p
          className='text-base font-semibold leading-relaxed max-w-2xl'
          style={{ color: 'var(--xuhome-hero-bio-active)' }}
        >
          {heroBio}
        </p>
      )}

      <div
        className='mt-6 border-b-[3px]'
        style={{ borderColor: 'var(--xuhome-hero-title-active)' }}
      />
    </div>
  )
}
