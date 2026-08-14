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

  it('should fall back to the position, 1-indexed', () => {
    expect(getWorkflowStepLabel({ stepNumber: 2, stepWord: 'Step' })).toEqual(
      'Step 3',
    )
  })

  it('should use the translated word for step', () => {
    expect(
      getWorkflowStepLabel({ stepNumber: 0, stepWord: 'Langkah' }),
    ).toEqual('Langkah 1')
  })

  // An empty name is not a name. Falling through to the position keeps the
  // modal from listing a blank bullet.
  it('should fall back to the position when the name is an empty string', () => {
    expect(
      getWorkflowStepLabel({ stepNumber: 1, stepName: '', stepWord: 'Step' }),
    ).toEqual('Step 2')
  })
})
