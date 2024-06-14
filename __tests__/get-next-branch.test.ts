/**
 * Unit tests for the action's entrypoint, src/get-next-branch.ts
 */

import * as main from '../src/main'

// Mock the action's entrypoint
const runMock = jest.spyOn(main, 'getNextBranch').mockImplementation()

describe('create-pr', () => {
  it('calls run when imported', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../src/get-next-branch')

    expect(runMock).toHaveBeenCalled()
  })
})
