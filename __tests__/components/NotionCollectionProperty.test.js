import fs from 'fs'
import path from 'path'

describe('Notion collection number properties', () => {
  it('keeps the percent precision fix in the installed renderer', () => {
    const renderer = fs.readFileSync(
      path.join(
        process.cwd(),
        'node_modules/react-notion-x/build/third-party/collection.js'
      ),
      'utf8'
    )

    expect(renderer).toContain(
      'Number.parseFloat((value * 100).toPrecision(15))'
    )
    expect(Number.parseFloat((0.07 * 100).toPrecision(15))).toBe(7)
  })
})
