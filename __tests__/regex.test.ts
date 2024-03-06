/**
 * Unit tests for the action's entrypoint, src/index.ts
 */

import { createRegexFromPattern } from '../src/regex'

describe('createRegexFromPattern', () => {
  it('escapes special characters', async () => {
    expect(createRegexFromPattern('foo.bar')).toStrictEqual(
      new RegExp('^foo\\.bar$')
    )
  })

  it('replaces the major version placeholder', async () => {
    expect(createRegexFromPattern('v<major>')).toStrictEqual(
      new RegExp('^v([0-9]+)$')
    )
  })

  it('replaces the minor version placeholder', async () => {
    expect(createRegexFromPattern('v<minor>')).toStrictEqual(
      new RegExp('^v([0-9]+)$')
    )
  })

  it('generates the correct pattern', async () => {
    expect(createRegexFromPattern('v<major>.<minor>')).toStrictEqual(
      new RegExp('^v([0-9]+)\\.([0-9]+)$')
    )
  })
})
