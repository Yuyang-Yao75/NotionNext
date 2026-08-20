import {
  parseGreetingWords,
  resolveGreetingWords
} from '@/lib/site/greetingWords'

describe('greetingWords', () => {
  describe('parseGreetingWords', () => {
    it('keeps the legacy comma-separated format', () => {
      expect(parseGreetingWords('第一句, 第二句,第三句')).toEqual([
        '第一句',
        '第二句',
        '第三句'
      ])
    })

    it('supports pipes and newlines without splitting commas inside copy', () => {
      expect(parseGreetingWords('Hello, world|欢迎回来\n继续阅读')).toEqual([
        'Hello, world',
        '欢迎回来',
        '继续阅读'
      ])
    })

    it('supports arrays and JSON arrays for copy containing commas', () => {
      expect(parseGreetingWords(['Hello, world', ' 欢迎回来 '])).toEqual([
        'Hello, world',
        '欢迎回来'
      ])
      expect(parseGreetingWords('["Hello, world", "欢迎回来"]')).toEqual([
        'Hello, world',
        '欢迎回来'
      ])
    })

    it('drops empty and non-string values safely', () => {
      expect(parseGreetingWords(['第一句', '', null, 42, '  '])).toEqual([
        '第一句'
      ])
      expect(parseGreetingWords(undefined)).toEqual([])
    })
  })

  describe('resolveGreetingWords', () => {
    it('prefers an explicit theme override', () => {
      expect(
        resolveGreetingWords({
          themeWords: 'XuHome A|XuHome B',
          sharedWords: '共享 A,共享 B',
          fallbackWords: ['回退']
        })
      ).toEqual(['XuHome A', 'XuHome B'])
    })

    it('uses the shared copy when the theme override is empty', () => {
      expect(
        resolveGreetingWords({
          themeWords: '',
          sharedWords: '共享 A, 共享 B',
          fallbackWords: ['回退']
        })
      ).toEqual(['共享 A', '共享 B'])
    })

    it('retains a legacy fallback when no shared copy is available', () => {
      expect(
        resolveGreetingWords({
          themeWords: null,
          sharedWords: '',
          fallbackWords: ['旧主题 A', '旧主题 B']
        })
      ).toEqual(['旧主题 A', '旧主题 B'])
    })
  })
})
