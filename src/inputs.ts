import * as core from '@actions/core'
import { createRegexFromPattern } from './regex'

export class Inputs {
    readonly currentBranch: string;
    readonly branchNamePattern: string;
    readonly branchPatternRegex: RegExp;
    readonly fallbackBranch: string;
    readonly enableAutoMerge: boolean;

    constructor(
        currentBranch: string,
        branchNamePattern: string,
        fallbackBranch: string,
        enableAutoMerge: boolean,
    ) {
        this.currentBranch = currentBranch;
        this.branchNamePattern = branchNamePattern;
        this.branchPatternRegex = createRegexFromPattern(this.branchNamePattern);
        this.fallbackBranch = fallbackBranch;
        this.enableAutoMerge = enableAutoMerge;
    }

    public static fromActionsInput(): Inputs {
        return new Inputs(
            core.getInput('ref'),
            core.getInput('branchNamePattern'),
            core.getInput('fallbackBranch'),
            core.getBooleanInput('enableAutoMerge'),
        )
    }
}
