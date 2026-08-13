import * as core from '@actions/core'

export class Inputs {
  readonly currentBranch: string
  readonly stableBranchNamePattern: string
  readonly devBranchNamePattern: string
  readonly fallbackBranch: string
  readonly enableAutoMerge: boolean
  readonly ignoredBranches: string[]
  readonly labels: string[]
  readonly assignApprover: boolean

  constructor(
    currentBranch: string,
    stableBranchNamePattern: string,
    devBranchNamePattern: string,
    fallbackBranch: string,
    enableAutoMerge: boolean,
    ignoredBranches: string[],
    labels: string[] = [],
    assignApprover = false
  ) {
    this.currentBranch = currentBranch
    this.stableBranchNamePattern = stableBranchNamePattern
    this.devBranchNamePattern = devBranchNamePattern
    this.fallbackBranch = fallbackBranch
    this.enableAutoMerge = enableAutoMerge
    this.ignoredBranches = ignoredBranches
    this.labels = labels
    this.assignApprover = assignApprover
  }

  static fromActionsInput(includePullRequestOptions = true): Inputs {
    const ignoredBranches = core.getInput('ignoredBranches')
    const labels = core.getInput('labels')

    return new Inputs(
      core.getInput('ref'),
      core.getInput('branchNamePattern'),
      core.getInput('devBranchNamePattern'),
      core.getInput('fallbackBranch'),
      includePullRequestOptions
        ? core.getBooleanInput('enableAutoMerge')
        : false,
      ignoredBranches ? JSON.parse(ignoredBranches) : [],
      labels
        ? labels
            .split(',')
            .map(label => label.trim())
            .filter(label => label.length > 0)
        : [],
      includePullRequestOptions ? core.getBooleanInput('assignApprover') : false
    )
  }
}
