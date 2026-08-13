import * as core from '@actions/core'
import * as git from './git'
import { Inputs } from './inputs'
import { Branch } from './branch'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function createMergeUpPullRequest(): Promise<void> {
  try {
    const inputs = Inputs.fromActionsInput()
    let nextBranchName: string

    // Determine the next branch to merge up to
    try {
      nextBranchName = await getNextBranchName(inputs)
    } catch (error) {
      const message = (error as Error).message
      core.info(message)
      core.summary.addRaw(`:no-entry: ${message}`, true)

      return
    }

    if (
      !(await core.group(
        'Check whether branch requires merge up',
        async () =>
          await git.hasNewCommits(inputs.currentBranch, nextBranchName)
      ))
    ) {
      const message = `No new commits in "${inputs.currentBranch}" to merge up`
      core.info(message)
      core.summary.addRaw(`:no-entry: ${message}`, true)
      return
    }

    // Generate a new branch-name upmerge-branch: "merge-<current-branch>-into-<next-branch>-<unique-token>:
    const newBranchName = `merge-${inputs.currentBranch}-into-${nextBranchName}-${Date.now()}`
    try {
      await core.group(
        'Create new branch',
        async () => await git.createBranch(newBranchName)
      )
    } catch (error) {
      let message = `Could not create new branch "${newBranchName}"`
      if (error instanceof Error) {
        message += `: ${error.message}`
      }

      core.setFailed(message)
      core.summary.addRaw(`:x: ${message}`, true)
      return
    }

    try {
      await core.group('Push branch', async () => git.pushBranch(newBranchName))
    } catch (error) {
      let message = `Could not push new branch "${newBranchName}"`
      if (error instanceof Error) {
        message += `: ${error.message}`
      }

      core.setFailed(message)
      core.summary.addRaw(`:x: ${message}`, true)
      return
    }

    // Determine the assignee (the approver of the merged pull request) if requested
    let assignee: string | undefined
    if (inputs.assignApprover) {
      assignee = await core.group('Determine approver', async () => {
        try {
          return await git.getMergedPullRequestApprover(
            process.env.GITHUB_SHA ?? ''
          )
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          core.info(`Could not determine the approver: ${message}`)
          return undefined
        }
      })
      if (!assignee) {
        core.info(
          'No approver found for the merged pull request; creating the pull request without an assignee'
        )
      }
    }

    const pullRequest = await core.group('Create pull request', async () =>
      git.createPullRequest(
        inputs.currentBranch,
        nextBranchName,
        inputs.labels,
        assignee
      )
    )
    if (!pullRequest) {
      const message = 'Could not create new pull request'
      core.setFailed(message)
      core.summary.addRaw(`:x: ${message}`, true)
      return
    }

    // Enable auto-merge if requested
    if (inputs.enableAutoMerge) {
      await core.group('Enable auto-merge', async () =>
        git.enableAutoMerge(
          pullRequest.id,
          inputs.currentBranch,
          nextBranchName
        )
      )
    }

    core.setOutput('pullRequestUrl', pullRequest.url)
    core.setOutput('branchName', newBranchName)

    // Set summary
    core.summary
      .addRaw(':rocket: Created new merge-up pull request: ')
      .addLink(`#${pullRequest.id}`, pullRequest.url)
      .addEOL()
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) {
      await core.summary.clear()
      core.setFailed(error.message)
    }
  }

  try {
    await core.summary.write()
  } catch (_) {
    // Ignore errors when writing summary
  }
}

export async function getNextBranch(): Promise<void> {
  const inputs = Inputs.fromActionsInput(false)
  let nextBranchName: string

  // Determine the next branch to merge up to
  try {
    nextBranchName = await getNextBranchName(inputs)
  } catch (_) {
    core.setOutput('hasNextBranch', false)
    core.setOutput('branchName', null)

    return
  }

  core.setOutput('hasNextBranch', true)
  core.setOutput('branchName', nextBranchName)
}

async function getNextBranchName(inputs: Inputs): Promise<string> {
  const branch = new Branch(
    inputs.currentBranch,
    inputs.stableBranchNamePattern,
    inputs.devBranchNamePattern,
    inputs.ignoredBranches
  )

  core.debug(
    `Matched the following versions in branch name "${branch.name}" with patterns "${branch.stableBranchNamePattern}", "${branch.devBranchNamePattern}":`
  )
  core.debug(`Major version: ${branch.majorVersion}`)
  core.debug(`Minor version: ${branch.minorVersion}`)
  core.debug(`Stable: ${branch.isStable}`)

  return branch.getNextBranchName(inputs.fallbackBranch)
}
