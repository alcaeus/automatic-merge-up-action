import { createRegexFromPattern } from './regex'
import { branchExists } from './git'

export class Branch {
  readonly name: string
  readonly majorVersion: number
  readonly minorVersion: number | null
  readonly stableBranchNamePattern: string
  readonly devBranchNamePattern: string
  readonly isStable: boolean = true

  constructor(
    name: string,
    stableBranchNamePattern: string,
    devBranchNamePattern: string
  ) {
    this.name = name
    this.stableBranchNamePattern = stableBranchNamePattern
    this.devBranchNamePattern = devBranchNamePattern

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
    return this.stableBranchNamePattern
      .replace('<major>', (this.majorVersion + 1).toString())
      .replace('<minor>', '0')
  }

  getNextMajorDevBranch(): string {
    return this.devBranchNamePattern.replace(
      '<major>',
      (this.majorVersion + 1).toString()
    )
  }

  getNextMinorStableBranch(): string {
    return this.isStable && this.minorVersion != null
      ? this.stableBranchNamePattern
          .replace('<major>', this.majorVersion.toString())
          .replace('<minor>', (this.minorVersion + 1).toString())
      : ''
  }

  getNextMinorDevBranch(): string {
    return this.isStable
      ? this.devBranchNamePattern.replace(
          '<major>',
          this.majorVersion.toString()
        )
      : ''
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
