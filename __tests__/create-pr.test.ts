/**
 * Unit tests for the action's entrypoint, src/create-pr.ts
 */

import * as main from '../src/main'

// Mock the action's entrypoint
const runMock = jest
  .spyOn(main, 'createMergeUpPullRequest')
  .mockImplementation()

describe('create-pr', () => {
  it('calls run when imported', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('../src/create-pr')

    expect(runMock).toHaveBeenCalled()
  })
})
