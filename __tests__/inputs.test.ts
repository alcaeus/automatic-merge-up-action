/**
 * Unit tests for input handling
 */

import { Inputs } from '../src/inputs'
import * as core from '@actions/core'

let getInputMock: jest.SpiedFunction<typeof core.getInput>
let getBooleanInputMock: jest.SpiedFunction<typeof core.getBooleanInput>

describe('Inputs', () => {
  it('stores values provided in the constructor', async () => {
    const inputs = new Inputs('v1.19', 'v<major>.<minor>', 'main', true)

    expect(inputs.currentBranch).toStrictEqual('v1.19')
    expect(inputs.branchNamePattern).toStrictEqual('v<major>.<minor>')
    expect(inputs.fallbackBranch).toStrictEqual('main')
    expect(inputs.enableAutoMerge).toStrictEqual(true)
  })

  it('retrieves values from input', async () => {
    getInputMock = jest.spyOn(core, 'getInput').mockImplementation()
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'ref':
          return 'v1.19'
        case 'branchNamePattern':
          return 'v<major>.<minor>'
        case 'fallbackBranch':
          return 'main'
        default:
          return ''
      }
    })

    getBooleanInputMock = jest
      .spyOn(core, 'getBooleanInput')
      .mockImplementation()
    getBooleanInputMock.mockImplementation(name => {
      switch (name) {
        case 'enableAutoMerge':
          return true
        default:
          return false
      }
    })

    const inputs = Inputs.fromActionsInput()

    expect(inputs.currentBranch).toStrictEqual('v1.19')
    expect(inputs.branchNamePattern).toStrictEqual('v<major>.<minor>')
    expect(inputs.enableAutoMerge).toStrictEqual(true)
    expect(inputs.fallbackBranch).toStrictEqual('main')

    expect(getInputMock).toHaveBeenCalledTimes(3)
    expect(getBooleanInputMock).toHaveBeenCalledTimes(1)
  })

  it('allows disabling automerge', async () => {
    getInputMock = jest.spyOn(core, 'getInput').mockImplementation()
    getInputMock.mockImplementation(name => {
      switch (name) {
        case 'ref':
          return 'main'
        case 'branchNamePattern':
          return 'v<major>.<minor>'
        case 'fallbackBranch':
          return ''
        default:
          return ''
      }
    })

    getBooleanInputMock = jest
      .spyOn(core, 'getBooleanInput')
      .mockImplementation()
    getBooleanInputMock.mockImplementation(name => {
      switch (name) {
        case 'enableAutoMerge':
          return false
        default:
          return false
      }
    })

    const inputs = Inputs.fromActionsInput()

    expect(inputs.enableAutoMerge).toStrictEqual(false)

    expect(getInputMock).toHaveBeenCalledTimes(3)
    expect(getBooleanInputMock).toHaveBeenCalledTimes(1)
  })
})
