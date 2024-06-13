import * as core from '@actions/core'

export class Inputs {
  readonly currentBranch: string
  readonly branchNamePattern: string
  readonly fallbackBranch: string
  readonly enableAutoMerge: boolean

  constructor(
    currentBranch: string,
    branchNamePattern: string,
    fallbackBranch: string,
    enableAutoMerge: boolean
  ) {
    this.currentBranch = currentBranch
    this.branchNamePattern = branchNamePattern
    this.fallbackBranch = fallbackBranch
    this.enableAutoMerge = enableAutoMerge
  }

  static fromActionsInput(includeAutoMergeOption = true): Inputs {
    return new Inputs(
      core.getInput('ref'),
      core.getInput('branchNamePattern'),
      core.getInput('fallbackBranch'),
      includeAutoMergeOption ? core.getBooleanInput('enableAutoMerge') : false
    )
  }
}
