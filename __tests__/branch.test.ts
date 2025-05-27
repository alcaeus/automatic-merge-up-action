import { Branch } from '../src/branch'
import * as git from '../src/git'

let branchExistsMock: jest.SpiedFunction<typeof git.branchExists>

describe('Branch', () => {
  const dataSet = [
    {
      description: 'v<major>.<minor> with no dev branch',
      name: 'v1.19',
      stableBranchNamePattern: 'v<major>.<minor>',
      devBranchNamePattern: '',
      ignoredBranches: [],
      majorVersion: 1,
      minorVersion: 19,
      nextMajorStableBranch: 'v2.0',
      nextMinorStableBranch: 'v1.20',
      nextMajorDevBranch: '',
      nextMinorDevBranch: '',
      isStable: true
    },
    {
      description: '<major>.<minor> with no dev branch',
      name: '1.18',
      stableBranchNamePattern: '<major>.<minor>',
      devBranchNamePattern: '',
      ignoredBranches: [],
      majorVersion: 1,
      minorVersion: 18,
      nextMajorStableBranch: '2.0',
      nextMinorStableBranch: '1.19',
      nextMajorDevBranch: '',
      nextMinorDevBranch: '',
      isStable: true
    },
    {
      description: '<major>.<minor>.x with no dev branch',
      name: '1.17.x',
      stableBranchNamePattern: '<major>.<minor>.x',
      devBranchNamePattern: '',
      ignoredBranches: [],
      majorVersion: 1,
      minorVersion: 17,
      nextMajorStableBranch: '2.0.x',
      nextMinorStableBranch: '1.18.x',
      nextMajorDevBranch: '',
      nextMinorDevBranch: '',
      isStable: true
    },
    {
      description: 'v<major>.<minor> with a dev branch',
      name: 'v1.19',
      stableBranchNamePattern: 'v<major>.<minor>',
      devBranchNamePattern: 'v<major>.x',
      ignoredBranches: [],
      majorVersion: 1,
      minorVersion: 19,
      nextMajorStableBranch: 'v2.0',
      nextMinorStableBranch: 'v1.20',
      nextMajorDevBranch: 'v2.x',
      nextMinorDevBranch: 'v1.x',
      isStable: true
    },
    {
      description: 'dev branch for v<major>.<minor>',
      name: 'v1.x',
      stableBranchNamePattern: 'v<major>.<minor>',
      devBranchNamePattern: 'v<major>.x',
      ignoredBranches: [],
      majorVersion: 1,
      minorVersion: null,
      nextMajorStableBranch: 'v2.0',
      nextMinorStableBranch: '',
      nextMajorDevBranch: 'v2.x',
      nextMinorDevBranch: '',
      isStable: false
    },
    {
      description: 'v<major>.<minor> with no dev branch and ignored branches',
      name: 'v1.19',
      stableBranchNamePattern: 'v<major>.<minor>',
      devBranchNamePattern: '',
      ignoredBranches: ['v1.20', 'v1.21', 'v2.0'],
      majorVersion: 1,
      minorVersion: 19,
      nextMajorStableBranch: 'v2.1',
      nextMinorStableBranch: 'v1.22',
      nextMajorDevBranch: '',
      nextMinorDevBranch: '',
      isStable: true
    },
    {
      description: 'v<major>.<minor> with a dev branch and ignored branches',
      name: 'v1.19',
      stableBranchNamePattern: 'v<major>.<minor>',
      devBranchNamePattern: 'v<major>.x',
      ignoredBranches: ['v1.20', 'v1.21', 'v2.0'],
      majorVersion: 1,
      minorVersion: 19,
      nextMajorStableBranch: 'v2.1',
      nextMinorStableBranch: 'v1.22',
      nextMajorDevBranch: 'v2.x',
      nextMinorDevBranch: 'v1.x',
      isStable: true
    },
    {
      description:
        'dev branch for v<major>.<minor> and ignored next major dev branch',
      name: 'v1.x',
      stableBranchNamePattern: 'v<major>.<minor>',
      devBranchNamePattern: 'v<major>.x',
      ignoredBranches: ['v2.x'],
      majorVersion: 1,
      minorVersion: null,
      nextMajorStableBranch: 'v2.0',
      nextMinorStableBranch: '',
      nextMajorDevBranch: 'v3.x',
      nextMinorDevBranch: '',
      isStable: false
    }
  ]

  const getNextBranchDataSet = [
    {
      description: 'No other branches exist',
      name: 'v1.19',
      stableBranchNamePattern: 'v<major>.<minor>',
      devBranchNamePattern: 'v<major>.x',
      ignoredBranches: [],
      existingBranches: [],
      nextBranchName: 'fallback'
    },
    {
      description: 'Only branch for next minor stable branch exists',
      name: 'v1.19',
      stableBranchNamePattern: 'v<major>.<minor>',
      devBranchNamePattern: 'v<major>.x',
      ignoredBranches: [],
      existingBranches: ['v1.20'],
      nextBranchName: 'v1.20'
    },
    {
      description: 'Only branch for next minor dev branch exists',
      name: 'v1.19',
      stableBranchNamePattern: 'v<major>.<minor>',
      devBranchNamePattern: 'v<major>.x',
      ignoredBranches: [],
      existingBranches: ['v1.x'],
      nextBranchName: 'v1.x'
    },
    {
      description: 'Only branch for next major stable branch exists',
      name: 'v1.19',
      stableBranchNamePattern: 'v<major>.<minor>',
      devBranchNamePattern: 'v<major>.x',
      ignoredBranches: [],
      existingBranches: ['v2.0'],
      nextBranchName: 'v2.0'
    },
    {
      description: 'Only branch for next major dev branch exists',
      name: 'v1.19',
      stableBranchNamePattern: 'v<major>.<minor>',
      devBranchNamePattern: 'v<major>.x',
      ignoredBranches: [],
      existingBranches: ['v2.x'],
      nextBranchName: 'v2.x'
    },
    {
      description: 'Next stable and dev minor branches exist',
      name: 'v1.19',
      stableBranchNamePattern: 'v<major>.<minor>',
      devBranchNamePattern: 'v<major>.x',
      ignoredBranches: [],
      existingBranches: ['v1.20', 'v1.x'],
      nextBranchName: 'v1.20'
    },
    {
      description: 'Next stable and dev minor/major branches exist',
      name: 'v1.19',
      stableBranchNamePattern: 'v<major>.<minor>',
      devBranchNamePattern: 'v<major>.x',
      ignoredBranches: [],
      existingBranches: ['v1.20', 'v1.x', 'v2.0', 'v2.x'],
      nextBranchName: 'v1.20'
    },
    {
      description: 'Next stable and dev major branches exist',
      name: 'v1.19',
      stableBranchNamePattern: 'v<major>.<minor>',
      devBranchNamePattern: 'v<major>.x',
      ignoredBranches: [],
      existingBranches: ['v2.0', 'v2.x'],
      nextBranchName: 'v2.0'
    },
    {
      description: 'Dev branches exist, but no pattern',
      name: 'v1.19',
      stableBranchNamePattern: 'v<major>.<minor>',
      devBranchNamePattern: '',
      ignoredBranches: [],
      existingBranches: ['v1.x', 'v2.x'],
      nextBranchName: 'fallback'
    },
    {
      description: 'Dev version, next major branches exist',
      name: 'v1.x',
      stableBranchNamePattern: 'v<major>.<minor>',
      devBranchNamePattern: 'v<major>.x',
      ignoredBranches: [],
      existingBranches: ['v1.x', 'v2.0', 'v2.x'],
      nextBranchName: 'v2.0'
    },
    {
      description: 'Dev version, only dev branches exist',
      name: 'v1.x',
      stableBranchNamePattern: 'v<major>.<minor>',
      devBranchNamePattern: 'v<major>.x',
      ignoredBranches: [],
      existingBranches: ['v1.x', 'v2.x'],
      nextBranchName: 'v2.x'
    },
    {
      description: 'Next minor version branch exists, but is ignored',
      name: 'v1.19',
      stableBranchNamePattern: 'v<major>.<minor>',
      devBranchNamePattern: 'v<major>.x',
      ignoredBranches: ['v1.20'],
      existingBranches: ['v1.20', 'v1.x', 'v2.0', 'v2.x'],
      nextBranchName: 'v1.x'
    },
    {
      description: 'Next minor version branches exists, but is ignored',
      name: 'v1.19',
      stableBranchNamePattern: 'v<major>.<minor>',
      devBranchNamePattern: 'v<major>.x',
      ignoredBranches: ['v1.20'],
      existingBranches: ['v1.20', 'v1.21', 'v1.x', 'v2.0', 'v2.x'],
      nextBranchName: 'v1.21'
    },
    {
      description: 'Next dev version branch exists, but is ignored',
      name: 'v1.19',
      stableBranchNamePattern: 'v<major>.<minor>',
      devBranchNamePattern: 'v<major>.x',
      ignoredBranches: ['v1.x'],
      existingBranches: ['v1.x', 'v2.0', 'v2.x'],
      nextBranchName: 'v2.0'
    },
    {
      description: 'Next major stable version branch exists, but is ignored',
      name: 'v1.19',
      stableBranchNamePattern: 'v<major>.<minor>',
      devBranchNamePattern: 'v<major>.x',
      ignoredBranches: ['v2.0'],
      existingBranches: ['v2.0', 'v2.x'],
      nextBranchName: 'v2.x'
    },
    {
      description: 'Next major stable version branches exists, but is ignored',
      name: 'v1.19',
      stableBranchNamePattern: 'v<major>.<minor>',
      devBranchNamePattern: 'v<major>.x',
      ignoredBranches: ['v2.0'],
      existingBranches: ['v2.0', 'v2.1', 'v2.x'],
      nextBranchName: 'v2.1'
    },
    {
      description: 'Next major dev version branch exists, but is ignored',
      name: 'v1.19',
      stableBranchNamePattern: 'v<major>.<minor>',
      devBranchNamePattern: 'v<major>.x',
      ignoredBranches: ['v2.x'],
      existingBranches: ['v2.x'],
      nextBranchName: 'fallback'
    },
    {
      description: 'Next major dev version branches exists, but is ignored',
      name: 'v1.19',
      stableBranchNamePattern: 'v<major>.<minor>',
      devBranchNamePattern: 'v<major>.x',
      ignoredBranches: ['v2.x'],
      existingBranches: ['v2.x', 'v3.x'],
      nextBranchName: 'v3.x'
    }
    // TODO: The following test fails as we don't try stable branches for future major versions
    // {
    //   description: 'All existing branches for next major version are ignored',
    //   name: 'v1.19',
    //   stableBranchNamePattern: 'v<major>.<minor>',
    //   devBranchNamePattern: 'v<major>.x',
    //   ignoredBranches: ['v2.x', 'v2.0'],
    //   existingBranches: ['v2.0', 'v2.x', 'v3.0', 'v3.x'],
    //   nextBranchName: 'v3.0'
    // }
  ]

  describe('constructor', () => {
    it.each(dataSet)(
      'parses branch name into major and minor version ($description)',
      async ({
        name,
        stableBranchNamePattern,
        devBranchNamePattern,
        ignoredBranches,
        majorVersion,
        minorVersion,
        isStable
      }) => {
        const branch = new Branch(
          name,
          stableBranchNamePattern,
          devBranchNamePattern,
          ignoredBranches
        )

        expect(branch.name).toStrictEqual(name)
        expect(branch.stableBranchNamePattern).toStrictEqual(
          stableBranchNamePattern
        )
        expect(branch.majorVersion).toStrictEqual(majorVersion)
        expect(branch.minorVersion).toStrictEqual(minorVersion)
        expect(branch.isStable).toStrictEqual(isStable)
      }
    )

    it("rejects branches that don't match ($description)", () => {
      expect(() => new Branch('1.19', 'v<major>.<minor>', '', [])).toThrow(
        new Error(
          `Ref name "1.19" does not match branch name patterns "v<major>.<minor>" or "".`
        )
      )
    })
  })

  describe('getNextMajorStableVersion', () => {
    it.each(dataSet)(
      'Returns the correct next major stable version branch ($description)',
      async ({
        name,
        stableBranchNamePattern,
        devBranchNamePattern,
        ignoredBranches,
        nextMajorStableBranch
      }) => {
        const branch = new Branch(
          name,
          stableBranchNamePattern,
          devBranchNamePattern,
          ignoredBranches
        )

        expect(branch.getNextMajorStableBranch()).toStrictEqual(
          nextMajorStableBranch
        )
      }
    )
  })

  describe('getNextMinorStableVersion', () => {
    it.each(dataSet)(
      'Returns the correct next minor stable version branch ($description)',
      async ({
        name,
        stableBranchNamePattern,
        devBranchNamePattern,
        ignoredBranches,
        nextMinorStableBranch
      }) => {
        const branch = new Branch(
          name,
          stableBranchNamePattern,
          devBranchNamePattern,
          ignoredBranches
        )

        expect(branch.getNextMinorStableBranch()).toStrictEqual(
          nextMinorStableBranch
        )
      }
    )
  })

  describe('getNextMajorDevVersion', () => {
    it.each(dataSet)(
      'Returns the correct next major dev version branch ($description)',
      async ({
        name,
        stableBranchNamePattern,
        devBranchNamePattern,
        ignoredBranches,
        nextMajorDevBranch
      }) => {
        const branch = new Branch(
          name,
          stableBranchNamePattern,
          devBranchNamePattern,
          ignoredBranches
        )

        expect(branch.getNextMajorDevBranch()).toStrictEqual(nextMajorDevBranch)
      }
    )
  })

  describe('getNextMinorDevVersion', () => {
    it.each(dataSet)(
      'Returns the correct next minor dev version branch ($description)',
      async ({
        name,
        stableBranchNamePattern,
        devBranchNamePattern,
        ignoredBranches,
        nextMinorDevBranch
      }) => {
        const branch = new Branch(
          name,
          stableBranchNamePattern,
          devBranchNamePattern,
          ignoredBranches
        )

        expect(branch.getNextMinorDevBranch()).toStrictEqual(nextMinorDevBranch)
      }
    )
  })

  describe('getNextBranchName', () => {
    it('Throws if no branch exists and no fallback branch given ($description)', async () => {
      branchExistsMock = jest.spyOn(git, 'branchExists').mockImplementation()
      branchExistsMock.mockImplementation(async () => {
        return false
      })

      const branch = new Branch('v1.20', 'v<major>.<minor>', '', [])

      await expect(branch.getNextBranchName('')).rejects.toThrow(
        new Error(
          'Ref name "v1.20" does not have a next branch or fallback branch'
        )
      )
    })

    it.each(getNextBranchDataSet)(
      'Returns the correct next branch name ($description)',
      async ({
        name,
        stableBranchNamePattern,
        devBranchNamePattern,
        ignoredBranches,
        existingBranches,
        nextBranchName
      }) => {
        branchExistsMock = jest.spyOn(git, 'branchExists').mockImplementation()
        branchExistsMock.mockImplementation(async branchName => {
          return existingBranches.includes(branchName)
        })

        const branch = new Branch(
          name,
          stableBranchNamePattern,
          devBranchNamePattern,
          ignoredBranches
        )

        expect(await branch.getNextBranchName('fallback')).toStrictEqual(
          nextBranchName
        )
      }
    )
  })
})
