/**
 * The entrypoint for the create-pr action.
 */
import { createMergeUpPullRequest } from './main'

// eslint-disable-next-line @typescript-eslint/no-floating-promises
createMergeUpPullRequest()
