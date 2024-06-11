/**
 * Unit tests for branch logic
 */

import { Branch } from '../src/branch'
import * as git from '../src/git'

let branchExistsMock: jest.SpiedFunction<typeof git.branchExists>

describe('Branch', () => {
  const dataSet = [
    {
      name: 'v1.19',
      branchNamePattern: 'v<major>.<minor>',
      majorVersion: 1,
      minorVersion: 19,
      nextMajorBranch: 'v2.0',
      nextMinorBranch: 'v1.20'
    },
    {
      name: '1.18',
      branchNamePattern: '<major>.<minor>',
      majorVersion: 1,
      minorVersion: 18,
      nextMajorBranch: '2.0',
      nextMinorBranch: '1.19'
    },
    {
      name: '1.17.x',
      branchNamePattern: '<major>.<minor>.x',
      majorVersion: 1,
      minorVersion: 17,
      nextMajorBranch: '2.0.x',
      nextMinorBranch: '1.18.x'
    }
  ]

  describe('constructor', () => {
    it.each(dataSet)(
      'parses branch name into major and minor version',
      async ({ name, branchNamePattern, majorVersion, minorVersion }) => {
        const branch = new Branch(name, branchNamePattern)

        expect(branch.name).toStrictEqual(name)
        expect(branch.branchNamePattern).toStrictEqual(branchNamePattern)
        expect(branch.majorVersion).toStrictEqual(majorVersion)
        expect(branch.minorVersion).toStrictEqual(minorVersion)
      }
    )

    it("rejects branches that don't match", () => {
      expect(() => new Branch('1.19', 'v<major>.<minor>')).toThrow(
        new Error(
          `Ref name "1.19" does not match branch name pattern "v<major>.<minor>".`
        )
      )
    })
  })

  describe('getNextMajorVersion', () => {
    it.each(dataSet)(
      'Returns the correct next major version branch',
      async ({ name, branchNamePattern, nextMajorBranch }) => {
        const branch = new Branch(name, branchNamePattern)

        expect(branch.getNextMajorBranch()).toStrictEqual(nextMajorBranch)
      }
    )
  })

  describe('getNextMinorVersion', () => {
    it.each(dataSet)(
      'Returns the correct next minor version branch',
      async ({ name, branchNamePattern, nextMinorBranch }) => {
        const branch = new Branch(name, branchNamePattern)

        expect(branch.getNextMinorBranch()).toStrictEqual(nextMinorBranch)
      }
    )
  })

  describe('getNextBranchName', () => {
    it.each(dataSet)(
      'Throws if no branch exists and no fallback branch given',
      async ({ name, branchNamePattern }) => {
        branchExistsMock = jest.spyOn(git, 'branchExists').mockImplementation()
        branchExistsMock.mockImplementation(async () => {
          return false
        })

        const branch = new Branch(name, branchNamePattern)

        await expect(branch.getNextBranchName('')).rejects.toThrow(
          new Error(
            `Ref name "${name}" does not have a next branch or fallback branch`
          )
        )
      }
    )

    it.each(dataSet)(
      'Returns fallback branch if no branches exist',
      async ({ name, branchNamePattern }) => {
        branchExistsMock = jest.spyOn(git, 'branchExists').mockImplementation()
        branchExistsMock.mockImplementation(async () => {
          return false
        })

        const branch = new Branch(name, branchNamePattern)

        expect(await branch.getNextBranchName('fallback')).toStrictEqual(
          'fallback'
        )
      }
    )

    it.each(dataSet)(
      'Returns next minor version branch if only it exists',
      async ({ name, branchNamePattern, nextMinorBranch }) => {
        branchExistsMock = jest.spyOn(git, 'branchExists').mockImplementation()
        branchExistsMock.mockImplementation(async branchName => {
          return branchName === nextMinorBranch
        })

        const branch = new Branch(name, branchNamePattern)

        expect(await branch.getNextBranchName('fallback')).toStrictEqual(
          nextMinorBranch
        )
      }
    )

    it.each(dataSet)(
      'Returns next major version branch if only it exists',
      async ({ name, branchNamePattern, nextMajorBranch }) => {
        branchExistsMock = jest.spyOn(git, 'branchExists').mockImplementation()
        branchExistsMock.mockImplementation(async branchName => {
          return branchName === nextMajorBranch
        })

        const branch = new Branch(name, branchNamePattern)

        expect(await branch.getNextBranchName('fallback')).toStrictEqual(
          nextMajorBranch
        )
      }
    )

    it.each(dataSet)(
      'Returns next minor version branch if both branches exist',
      async ({ name, branchNamePattern, nextMajorBranch, nextMinorBranch }) => {
        branchExistsMock = jest.spyOn(git, 'branchExists').mockImplementation()
        branchExistsMock.mockImplementation(async branchName => {
          return (
            branchName === nextMajorBranch || branchName === nextMinorBranch
          )
        })

        const branch = new Branch(name, branchNamePattern)

        expect(await branch.getNextBranchName('fallback')).toStrictEqual(
          nextMinorBranch
        )
      }
    )
  })
})
