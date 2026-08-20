import { render, waitFor } from '@testing-library/react'
import HexoHero from '@/themes/hexo/components/Hero'
import MateryHero from '@/themes/matery/components/Hero'

const mockLoadExternalResource = jest.fn()
const mockSiteConfig = jest.fn()

jest.mock(
  '@/components/LazyImage',
  () =>
    function MockLazyImage({ priority, alt = '', ...props }) {
      // eslint-disable-next-line @next/next/no-img-element
      return <img alt={alt} {...props} />
    }
)

jest.mock('@/lib/config', () => ({
  siteConfig: (...args) => mockSiteConfig(...args)
}))

jest.mock('@/lib/global', () => ({
  useGlobal: () => ({ locale: { COMMON: { START_READING: 'Start' } } })
}))

jest.mock('@/lib/utils', () => ({
  loadExternalResource: (...args) => mockLoadExternalResource(...args)
}))

jest.mock(
  '@/themes/hexo/components/NavButtonGroup',
  () =>
    function MockNavButtonGroup() {
      return null
    }
)

describe.each([
  ['Hexo', HexoHero],
  ['Matery', MateryHero]
])('%s Hero Typed lifecycle', (themeName, Hero) => {
  let cancelAnimationFrameMock
  let destroyMock
  let requestAnimationFrameMock
  let typedConstructorMock

  beforeEach(() => {
    mockSiteConfig.mockImplementation((key, fallback) => {
      const values = {
        GREETING_WORDS: '共享第一句|共享第二句',
        GREETING_WORDS_TYPE_SPEED: 120,
        GREETING_WORDS_BACK_SPEED: 60,
        HEXO_HOME_NAV_BUTTONS: false,
        HEXO_SHOW_START_READING: false,
        MATERY_SHOW_START_READING: false
      }
      return Object.prototype.hasOwnProperty.call(values, key)
        ? values[key]
        : fallback
    })
    mockLoadExternalResource.mockResolvedValue(undefined)

    destroyMock = jest.fn()
    typedConstructorMock = jest.fn(function TypedMock() {
      return { destroy: destroyMock }
    })
    window.Typed = typedConstructorMock

    requestAnimationFrameMock = jest.fn(() => 17)
    cancelAnimationFrameMock = jest.fn()
    global.requestAnimationFrame = requestAnimationFrameMock
    global.cancelAnimationFrame = cancelAnimationFrameMock
  })

  afterEach(() => {
    delete window.Typed
    delete global.requestAnimationFrame
    delete global.cancelAnimationFrame
  })

  it('initializes once and destroys the instance on unmount', async () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
    const siteInfo = { title: 'Test Site', pageCover: '/cover.jpg' }
    const { rerender, unmount } = render(<Hero siteInfo={siteInfo} />)

    await waitFor(() => expect(typedConstructorMock).toHaveBeenCalledTimes(1))

    expect(mockLoadExternalResource).toHaveBeenCalledTimes(1)
    expect(mockLoadExternalResource).toHaveBeenCalledWith(
      '/js/typed.min.js',
      'js'
    )
    expect(typedConstructorMock).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({
        strings: ['共享第一句', '共享第二句'],
        typeSpeed: 120,
        backSpeed: 60
      })
    )

    rerender(<Hero siteInfo={{ ...siteInfo, title: 'Updated title' }} />)
    expect(mockLoadExternalResource).toHaveBeenCalledTimes(1)
    expect(typedConstructorMock).toHaveBeenCalledTimes(1)

    const resizeRegistration = addEventListenerSpy.mock.calls.find(
      ([eventName]) => eventName === 'resize'
    )
    expect(resizeRegistration).toBeDefined()

    unmount()

    expect(destroyMock).toHaveBeenCalledTimes(1)
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'resize',
      resizeRegistration[1]
    )
    expect(cancelAnimationFrameMock).toHaveBeenCalledWith(17)
  })
})
