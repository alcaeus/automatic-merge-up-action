import { createRegexFromPattern } from './regex'
import { branchExists } from './git'

export class Branch {
  readonly name: string
  readonly majorVersion: number
  readonly minorVersion: number
  readonly branchNamePattern: string

  constructor(name: string, branchNamePattern: string) {
    this.name = name
    this.branchNamePattern = branchNamePattern

    const branchPatternRegex = createRegexFromPattern(branchNamePattern)

    const versions = name.match(branchPatternRegex)
    if (!versions) {
      throw new Error(
        `Ref name "${name}" does not match branch name pattern "${branchNamePattern}".`
      )
    }

    this.majorVersion = Number(versions[1])
    this.minorVersion = Number(versions[2])
  }

  getNextMajorBranch(): string {
    return this.branchNamePattern
      .replace('<major>', (this.majorVersion + 1).toString())
      .replace('<minor>', '0')
  }

  getNextMinorBranch(): string {
    return this.branchNamePattern
      .replace('<major>', this.majorVersion.toString())
      .replace('<minor>', (this.minorVersion + 1).toString())
  }

  async getNextBranchName(fallbackBranch: string): Promise<string> {
    const nextMajorBranch = this.getNextMajorBranch()
    const nextMinorBranch = this.getNextMinorBranch()

    if (await branchExists(nextMinorBranch)) {
      return nextMinorBranch
    }

    if (await branchExists(nextMajorBranch)) {
      return nextMajorBranch
    }

    if (fallbackBranch) {
      return fallbackBranch
    }

    throw new Error(
      `Ref name "${this.name}" does not have a next branch or fallback branch`
    )
  }
}
