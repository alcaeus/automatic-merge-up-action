import * as core from '@actions/core'
import { createRegexFromPattern } from './regex'
import * as git from './git'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const currentBranch: string = core.getInput('ref')
    const branchNamePattern: string = core.getInput('branchNamePattern')
    const branchPatternRegex: RegExp = createRegexFromPattern(branchNamePattern)

    const branches: RegExpMatchArray | null =
      currentBranch.match(branchPatternRegex)
    if (!branches) {
      const message = `Ref name "${currentBranch}" does not match branch name pattern "${branchNamePattern}".`
      core.info(message)
      core.summary.addRaw(`:no-entry: ${message}`, true)
      return
    }

    const majorVersion = Number(branches[1])
    const minorVersion = Number(branches[2])

    core.debug(
      `Matched the following versions in branch name "${currentBranch}" with pattern "${branchPatternRegex}":`
    )
    core.debug(`Major version: ${majorVersion}`)
    core.debug(`Minor version: ${minorVersion}`)

    // Determine the next branch to merge up to
    const nextGitBranchName: string | null = await core.group(
      'Determine next branch',
      async () =>
        await git.getNextBranch(
          branchNamePattern,
          Number(majorVersion),
          Number(minorVersion)
        )
    )

    let nextBranchName: string
    if (nextGitBranchName === null) {
      const fallbackBranch = core.getInput('fallbackBranch')

      if (!fallbackBranch) {
        const message = `Ref name "${currentBranch}" does not have a next branch or fallback branch`
        core.info(message)
        core.summary.addRaw(`:no-entry: ${message}`, true)
        return
      }

      nextBranchName = fallbackBranch
    } else {
      nextBranchName = nextGitBranchName
    }

    if (
      !(await core.group(
        'Check whether branch requires merge up',
        async () => await git.hasNewCommits(currentBranch, nextBranchName)
      ))
    ) {
      const message = `No new commits in "${currentBranch}" to merge up`
      core.info(message)
      core.summary.addRaw(`:no-entry: ${message}`, true)
      return
    }

    // Generate a new branch-name upmerge-branch: "merge-<current-branch>-into-<next-branch>-<unique-token>:
    const newBranchName = `merge-${currentBranch}-into-${nextBranchName}-${Date.now()}`
    try {
      await core.group(
        'Create new branch',
        async () => await git.createBranch(newBranchName)
      )
    } catch (error) {
      let message = `Could not create new branch "${newBranchName}"`
      if (error instanceof Error) {
        message += `: error.message`
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
        message += `: error.message`
      }

      core.setFailed(message)
      core.summary.addRaw(`:x: ${message}`, true)
      return
    }

    const pullRequest = await core.group('Create pull request', async () =>
      git.createPullRequest(currentBranch, nextBranchName)
    )
    if (!pullRequest) {
      const message = 'Could not create new pull request'
      core.setFailed(message)
      core.summary.addRaw(`:x: ${message}`, true)
      return
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
      core.summary.clear()
      core.setFailed(error.message)
    }
  }

  try {
    await core.summary.write()
  } catch (error) {
    // Ignore errors when writing summary
  }
}
