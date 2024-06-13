import * as core from '@actions/core'
import * as git from '../src/git'
import * as main from '../src/main'

describe('main', () => {
  describe('getNextBranch', () => {
    const dataSet = [
      {
        currentBranch: 'main',
        branchNamePattern: 'v<major>.<minor>',
        fallbackBranch: '',
        existingBranches: ['main'],
        hasNextBranchOutput: false,
        branchNameOutput: null
      },
      {
        currentBranch: 'v1.19',
        branchNamePattern: 'v<major>.<minor>',
        fallbackBranch: '',
        existingBranches: ['main', 'v1.19'],
        hasNextBranchOutput: false,
        branchNameOutput: null
      },
      {
        currentBranch: 'v1.19',
        branchNamePattern: 'v<major>.<minor>',
        fallbackBranch: 'main',
        existingBranches: ['main', 'v1.19'],
        hasNextBranchOutput: true,
        branchNameOutput: 'main'
      },
      {
        currentBranch: 'v1.19',
        branchNamePattern: 'v<major>.<minor>',
        fallbackBranch: 'main',
        existingBranches: ['main', 'v1.19', 'v1.20'],
        hasNextBranchOutput: true,
        branchNameOutput: 'v1.20'
      },
      {
        currentBranch: 'v1.19',
        branchNamePattern: 'v<major>.<minor>',
        fallbackBranch: 'main',
        existingBranches: ['main', 'v1.19', 'v2.0'],
        hasNextBranchOutput: true,
        branchNameOutput: 'v2.0'
      }
    ]

    beforeEach(() => {
      jest.clearAllMocks()

      jest.spyOn(core, 'debug').mockImplementation()
    })

    it.each(dataSet)(
      'sets the correct outputs',
      async ({
        currentBranch,
        branchNamePattern,
        fallbackBranch,
        existingBranches,
        hasNextBranchOutput,
        branchNameOutput
      }) => {
        jest.spyOn(core, 'getInput').mockImplementation(name => {
          switch (name) {
            case 'ref':
              return currentBranch
            case 'branchNamePattern':
              return branchNamePattern
            case 'fallbackBranch':
              return fallbackBranch
            default:
              return ''
          }
        })

        jest.spyOn(core, 'getBooleanInput').mockImplementation(name => {
          switch (name) {
            case 'enableAutoMerge':
              return true
            default:
              return false
          }
        })

        jest
          .spyOn(git, 'branchExists')
          .mockImplementation(async branchName =>
            existingBranches.includes(branchName)
          )

        const setOutputMock = jest.spyOn(core, 'setOutput').mockImplementation()

        await main.getNextBranch()

        expect(setOutputMock).toHaveBeenNthCalledWith(
          1,
          'hasNextBranch',
          hasNextBranchOutput
        )

        expect(setOutputMock).toHaveBeenNthCalledWith(
          2,
          'branchName',
          branchNameOutput
        )
      }
    )
  })
})
