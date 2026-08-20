import { render, screen } from '@testing-library/react'
import HeroSection from '@/themes/xuhome/components/HeroSection'

const mockSiteConfig = jest.fn()

jest.mock('@/lib/config', () => ({
  siteConfig: (...args) => mockSiteConfig(...args)
}))

jest.mock(
  '@/themes/xuhome/components/Typewriter',
  () =>
    function MockTypewriter({ texts }) {
      return <span data-testid='typewriter'>{texts.join('|')}</span>
    }
)

describe('XuHome HeroSection greeting copy', () => {
  const baseConfig = {
    XUHOME_HERO_BIO: '',
    XUHOME_HERO_TITLE: '',
    XUHOME_HERO_TEXTS: '',
    XUHOME_HERO_TYPE_SPEED: 80,
    XUHOME_HERO_DELETE_SPEED: 40,
    XUHOME_HERO_TYPE_PAUSE: 2000,
    GREETING_WORDS: '共享第一句|共享第二句',
    TITLE: '站点标题',
    BIO: ''
  }

  beforeEach(() => {
    mockSiteConfig.mockImplementation((key, fallback) =>
      Object.prototype.hasOwnProperty.call(baseConfig, key)
        ? baseConfig[key]
        : fallback
    )
  })

  afterEach(() => {
    mockSiteConfig.mockReset()
  })

  it('uses the global greeting copy when no XuHome override exists', () => {
    render(<HeroSection />)

    expect(screen.getByTestId('typewriter')).toHaveTextContent(
      '共享第一句|共享第二句'
    )
  })

  it('keeps an explicit XuHome greeting override', () => {
    mockSiteConfig.mockImplementation((key, fallback) => {
      if (key === 'XUHOME_HERO_TEXTS') return '主题第一句|主题第二句'
      return Object.prototype.hasOwnProperty.call(baseConfig, key)
        ? baseConfig[key]
        : fallback
    })

    render(<HeroSection />)

    expect(screen.getByTestId('typewriter')).toHaveTextContent(
      '主题第一句|主题第二句'
    )
  })
})
