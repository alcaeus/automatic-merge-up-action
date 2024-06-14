# Automated Merge Up Action

[![GitHub Super-Linter](https://github.com/actions/typescript-action/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/actions/typescript-action/actions/workflows/ci.yml/badge.svg)
[![Check dist/](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

This action creates a pull request to merge commits from one branch into
another. It is designed to run on every push to keep branches for newer versions
up-to-date.

## Usage

A sample workflow is included in the examples directory. The workflow acts on
every push to matching branches and uses this action to create a pull request up
to the next branch.

The branch selection algorithm will target the branch for the next SemVer
release with its pull request. For example, assuming a commit was pushed to
`v1.3`, the branch selection will consider the following branches in order:

- `v1.4`
- `v2.0`
- The configured fallback branch (if set)

If no matching branch is found, the action exits without creating a pull
request. The same applies when no mergeable commits are found. Once the merge-up
pull request has been merged, the action will repeat the process until no
matching branch has been found. It can thus be used to efficiently merge changes
up through several releases, ensuring branch protection rules and CI
requirements are met.

### Default token

If you have no GitHub Actions workflows that are run when a new pull request is
pushed, you can rely on the default token as long as you specify additional
permissions for it:

```yml
permissions:
  contents: write
  pull-requests: write
```

If you need to run actions on newly created pull request, create a custom token
with the `repo` scope and use it instead of the default `github.token`. Note
that you also need to pass a token to the checkout action to ensure credentials
are set in the git repository to allow you to push a new branch.

## Resolving Conflicts

The action creates an intermediate branch as head reference for the pull
request. For example, when merging `v1.3` into `v1.4`, the action will create a
branch named `merge-v1.3-into-v1.4-<token>`. If there are conflicts in this
merge, you can resolve these conflicts in this branch. There are two approaches
for this:

### Merge Base Branch

In the example above, you can merge `v1.4` into this intermediate branch and
resolve conflicts:

```shell
git merge --no-ff v1.4
```

After resolving conflicts, conclude the merge and push commits.

### Starting fresh

If you would instead like to perform the merge manually, you can start out
fresh. In the example above, this would look something like this:

```shell
git reset --hard v1.4
git merge --no-ff v1.3
```

After resolving commits, conclude the merge and push commits. This will require
force-pushing since the commit history of the branches will diverge.

## Configuration

The action supports the following input parameters:

### ref (required)

The `ref` input identifies the reference being pushed. Typically, this will be
`${{ github.ref_name }}`

### branchNamePattern (optional)

The `branchNamePattern` input can be used to configure the naming strategy for
versioned branches. It defaults to `<major>.<minor>`. `<major>` and `<minor>`
inside this pattern are used as placeholders and replaced accordingly. Note that
the pattern needs to contain both placeholders for the action to function
correctly. The branch name pattern is used for the following purposes:

- To check if the source ref name matches a versioned branch. For this purpose,
  the `<major>` and `<minor>` are replaced with `[0-9]+` to perform a `RegExp`
  match
- To generate new branch names. When checking for branches, the placeholders are
  replaced with the computed values according to the SemVer release.

### fallbackBranch (optional)

If your branch naming pattern involves a non-versioned branch for the upcoming
version (e.g. `main`), the `fallbackBranch` option can be used to specify this
branch name. If no versioned branch was found, the pull request will target this
fallback branch instead. The "Branch Selection" chapter above explains the order
of operations.

### enableAutoMerge (optional)

When this option is enabled (using a truish value), the resulting PR will have
auto-merge enabled. Note that in order for this to work, the auto-merge
functionality has to be enabled on the repository, and the "merge" merge
strategy has to be available. Automatic merges are always done using the "merge"
strategy.

## Determine next branch

There is a separate action named `get-next-branch` that can be used to run the
branch detection logic and return the determined information. This is useful if
you want to run your own logic for handling merges.

```yaml
- name: "Determine branch to merge up to"
  id: get-next-branch
  uses: alcaeus/automatic-merge-up-action/get-next-branch@main
  with:
    ref: ${{ github.ref_name }}
    branchNamePattern: 'v<major>.<minor>'
    fallbackBranch: 'master'
```

The action takes the same inputs as the default create-pr action, except for the
`enableAutoMerge` input which doesn't exist. The action sets two outputs:

- `hasNextBranch`: this bool output is `true` if the branch detection logic
  found a branch to merge up to, `false` otherwise.
- `branchName`: this is the name of the next branch in the merge chain. If no
  next branch was found (i.e. `hasNextBranch` is `false`), this value is `null`.
