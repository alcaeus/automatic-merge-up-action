import * as core from '@actions/core'

export class Inputs {
  readonly currentBranch: string
  readonly stableBranchNamePattern: string
  readonly devBranchNamePattern: string
  readonly fallbackBranch: string
  readonly enableAutoMerge: boolean

  constructor(
    currentBranch: string,
    stableBranchNamePattern: string,
    devBranchNamePattern: string,
    fallbackBranch: string,
    enableAutoMerge: boolean
  ) {
    this.currentBranch = currentBranch
    this.stableBranchNamePattern = stableBranchNamePattern
    this.devBranchNamePattern = devBranchNamePattern
    this.fallbackBranch = fallbackBranch
    this.enableAutoMerge = enableAutoMerge
  }

  static fromActionsInput(includeAutoMergeOption = true): Inputs {
    return new Inputs(
      core.getInput('ref'),
      core.getInput('branchNamePattern'),
      core.getInput('devBranchNamePattern'),
      core.getInput('fallbackBranch'),
      includeAutoMergeOption ? core.getBooleanInput('enableAutoMerge') : false
    )
  }
}
