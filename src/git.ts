import * as exec from '@actions/exec'
import { ExecOptions, ExecOutput } from '@actions/exec'
import { escapeRegex } from './regex'

export type Commit = {
  hash: string
  subject: string
}

export type CommitList = Commit[]

export type PullRequestResult = {
  id: number
  url: string
}

async function branchExists(branchName: string): Promise<boolean> {
  const output: ExecOutput = await exec.getExecOutput('git', [
    'branch',
    '--list',
    '-r',
    `origin/${branchName}`
  ])

  return output.stdout.includes(branchName)
}

export async function getNextBranch(
  branchNamePattern: string,
  major: number,
  minor: number
): Promise<string | null> {
  const nextMinorBranch: string = branchNamePattern
    .replace('<major>', major.toString())
    .replace('<minor>', (minor + 1).toString())
  const nextMajorBranch: string = branchNamePattern
    .replace('<major>', (major + 1).toString())
    .replace('<minor>', '0')

  await exec.exec('git', ['branch', '--list', '-r'])

  return (await branchExists(nextMinorBranch))
    ? nextMinorBranch
    : (await branchExists(nextMajorBranch))
      ? nextMajorBranch
      : null
}

export async function createBranch(branchName: string): Promise<void> {
  await exec.getExecOutput('git', ['checkout', '-b', branchName])
}

export async function pushBranch(branchName: string): Promise<void> {
  await exec.getExecOutput('git', ['push', 'origin', branchName])
}

export async function createPullRequest(
  branchName: string,
  baseName: string
): Promise<PullRequestResult> {
  const title = `Merge ${branchName} into ${baseName}`
  const formattedCommitList: string = formatCommits(
    await getCommitList(branchName, baseName)
  )

  const bodyText = `
Merge new changes from ${branchName} into ${baseName}.

<h2>Commits</h2>
${formattedCommitList}

<details>
  <summary><h2>Resolving conflicts</h2></summary>
  To resolve any conflicts, check out the temporary branch and run the following command:

    git merge ${baseName}
</details>

<details>
  <summary><h2>Ignoring changes</h2></summary>
  To ignore from the remote branch, first reset the temporary branch to ${baseName} and manually merge using the \`ours\` merge strategy:

    git reset --hard ${baseName}
    git merge --strategy=ours ${branchName}

  Then, push the temporary branch to upate the pull request.
</details>`

  const options: ExecOptions = {
    input: Buffer.from(bodyText)
  }

  const output: ExecOutput = await exec.getExecOutput(
    'gh',
    ['pr', 'create', '--base', baseName, '--title', title, '--body-file', '-'],
    options
  )

  const matches = output.stdout.match(
    /(https:\/\/github\.com\/.+\/pull\/(\d+))$/m
  )
  if (!matches) {
    throw new Error(
      'Pull request created, but could not match pull request URL'
    )
  }

  return {
    id: Number(matches[2]),
    url: matches[1]
  }
}

export async function hasNewCommits(
  branchName: string,
  baseName: string
): Promise<boolean> {
  const output: ExecOutput = await exec.getExecOutput('git', [
    'branch',
    '-r',
    '--merged',
    `origin/${baseName}`
  ])

  const escapedRegex = escapeRegex(`origin/${branchName}`)
  const regex = new RegExp(`${escapedRegex}$`, 'm')

  return !regex.test(output.stdout)
}

export async function enableAutoMerge(pullRequestId: number): Promise<void> {
  await exec.exec('gh', [
    'merge',
    pullRequestId.toString(),
    '--auto', // Enable auto-merge
    '-m' // Use merge commit strategy
  ])
}

async function getCommitList(
  branchName: string,
  baseName: string
): Promise<CommitList> {
  const output: ExecOutput = await exec.getExecOutput('git', [
    'log',
    '--format="%h %s"',
    `origin/${baseName}..origin/${branchName}`
  ])

  const outputLines = output.stdout.split('\n')

  const results: CommitList = []
  for (const outputLine of outputLines) {
    const matches = outputLine.match(/^"?([^ ]+) (.*?)"?$/)
    if (!matches) {
      continue
    }

    results.push({
      hash: matches[1],
      subject: matches[2]
    })
  }

  return results
}

function formatCommits(commits: CommitList): string {
  if (!commits.length) {
    return ''
  }

  const commitList = commits
    .map((commit: Commit) => `<li>${commit.subject}: ${commit.hash}</li>`)
    .join('\n')

  return `<ul>${commitList}</ul>`
}
