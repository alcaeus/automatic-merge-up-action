import { createRegexFromPattern } from './regex'
import { branchExists } from './git'

export class Branch {
  readonly name: string
  readonly majorVersion: number
  readonly minorVersion: number | null
  readonly stableBranchNamePattern: string
  readonly devBranchNamePattern: string
  readonly ignoredBranches: string[]
  readonly isStable: boolean = true

  constructor(
    name: string,
    stableBranchNamePattern: string,
    devBranchNamePattern: string,
    ignoredBranches: string[]
  ) {
    this.name = name
    this.stableBranchNamePattern = stableBranchNamePattern
    this.devBranchNamePattern = devBranchNamePattern
    this.ignoredBranches = ignoredBranches

    const stableBranchPatternRegex = createRegexFromPattern(
      stableBranchNamePattern
    )
    const devBranchPatternRegex = createRegexFromPattern(devBranchNamePattern)

    let versions = name.match(stableBranchPatternRegex)
    if (!versions) {
      this.isStable = false

      if (this.devBranchNamePattern) {
        versions = name.match(devBranchPatternRegex)
      }

      if (!versions) {
        throw new Error(
          `Ref name "${name}" does not match branch name patterns "${stableBranchNamePattern}" or "${devBranchNamePattern}".`
        )
      }
    }

    this.majorVersion = Number(versions[1])
    this.minorVersion = versions[2] ? Number(versions[2]) : null
  }

  getNextMajorStableBranch(): string {
    return this.getNextNotIgnoredStableBranch(this.majorVersion + 1, 0)
  }

  getNextMajorDevBranch(): string {
    return this.getNextNotIgnoredDevBranch(this.majorVersion + 1)
  }

  getNextMinorStableBranch(): string {
    return this.isStable && this.minorVersion != null
      ? this.getNextNotIgnoredStableBranch(
          this.majorVersion,
          this.minorVersion + 1
        )
      : ''
  }

  getNextMinorDevBranch(): string {
    if (!this.isStable) {
      return ''
    }

    const nextBranchName = this.devBranchNamePattern.replace(
      '<major>',
      this.majorVersion.toString()
    )

    // If the next minor dev branch is ignored, return an empty string to skip this branch
    return this.ignoredBranches.includes(nextBranchName) ? '' : nextBranchName
  }

  getNextNotIgnoredStableBranch(
    majorVersion: number,
    minorVersion: number
  ): string {
    let nextMinorVersion = minorVersion
    let nextBranchName: string

    do {
      nextBranchName = this.stableBranchNamePattern
        .replace('<major>', majorVersion.toString())
        .replace('<minor>', nextMinorVersion.toString())
      nextMinorVersion++
    } while (this.ignoredBranches.includes(nextBranchName))

    return nextBranchName
  }

  getNextNotIgnoredDevBranch(majorVersion: number): string {
    let nextMajorVersion = majorVersion
    let nextBranchName: string

    do {
      nextBranchName = this.devBranchNamePattern.replace(
        '<major>',
        nextMajorVersion.toString()
      )
      nextMajorVersion++
    } while (this.ignoredBranches.includes(nextBranchName))

    return nextBranchName
  }

  async getNextBranchName(fallbackBranch: string): Promise<string> {
    // Assemble candidate branches, skipping empty branch names
    const branches = [
      this.getNextMinorStableBranch(),
      this.getNextMinorDevBranch(),
      this.getNextMajorStableBranch(),
      this.getNextMajorDevBranch()
    ].filter(branchName => branchName !== '')

    for (const branchName of branches) {
      if (await branchExists(branchName)) {
        return branchName
      }
    }

    if (fallbackBranch) {
      return fallbackBranch
    }

    throw new Error(
      `Ref name "${this.name}" does not have a next branch or fallback branch`
    )
  }
}
