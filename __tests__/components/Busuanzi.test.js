import { act, render } from '@testing-library/react'
import Busuanzi from '@/components/Busuanzi'
import busuanzi from '@/lib/plugins/busuanzi'

const on = jest.fn()
const off = jest.fn()
const events = { on, off }

jest.mock('next/router', () => ({
  useRouter: () => ({
    asPath: '/',
    events
  })
}))

jest.mock('@/lib/global', () => ({
  useGlobal: () => ({ theme: 'hexo' })
}))

jest.mock('@/lib/plugins/busuanzi', () => ({
  __esModule: true,
  default: { fetch: jest.fn() }
}))

describe('Busuanzi', () => {
  it('subscribes once, refreshes on a new route, and cleans up', () => {
    const { rerender, unmount } = render(<Busuanzi />)
    expect(on).toHaveBeenCalledTimes(1)
    expect(on).toHaveBeenCalledWith('routeChangeComplete', expect.any(Function))
    expect(busuanzi.fetch).toHaveBeenCalledTimes(1)

    rerender(<Busuanzi />)
    expect(on).toHaveBeenCalledTimes(1)

    const handleRouteChange = on.mock.calls[0][1]
    act(() => handleRouteChange('/article/one'))
    expect(busuanzi.fetch).toHaveBeenCalledTimes(2)

    act(() => handleRouteChange('/article/one'))
    expect(busuanzi.fetch).toHaveBeenCalledTimes(2)

    unmount()
    expect(off).toHaveBeenCalledWith('routeChangeComplete', handleRouteChange)
  })
})
