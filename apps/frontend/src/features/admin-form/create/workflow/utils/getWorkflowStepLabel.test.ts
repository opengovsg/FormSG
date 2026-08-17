import { describe, expect, it } from 'vitest'

import { getWorkflowStepLabel } from './getWorkflowStepLabel'

describe('getWorkflowStepLabel', () => {
  it('should use the name the admin gave the step', () => {
    expect(
      getWorkflowStepLabel({
        stepNumber: 2,
        stepName: 'Approval by manager',
        stepWord: 'Step',
      }),
    ).toEqual('Approval by manager')
  })

  // 'step' is the real value of features.common.entities.step: that block
  // holds lowercase nouns for composing sentences, so the label capitalises it.
  it('should fall back to the position, 1-indexed and sentence case', () => {
    expect(getWorkflowStepLabel({ stepNumber: 2, stepWord: 'step' })).toEqual(
      'Step 3',
    )
  })

  it('should use the translated word for step', () => {
    expect(
      getWorkflowStepLabel({ stepNumber: 0, stepWord: 'langkah' }),
    ).toEqual('Langkah 1')
  })

  it('should leave a name the admin gave alone, whatever its case', () => {
    expect(
      getWorkflowStepLabel({
        stepNumber: 1,
        stepName: 'approval by manager',
        stepWord: 'step',
      }),
    ).toEqual('approval by manager')
  })

  // An empty name is not a name. Falling through to the position keeps the
  // modal from listing a blank bullet.
  it('should fall back to the position when the name is an empty string', () => {
    expect(
      getWorkflowStepLabel({ stepNumber: 1, stepName: '', stepWord: 'step' }),
    ).toEqual('Step 2')
  })
})
