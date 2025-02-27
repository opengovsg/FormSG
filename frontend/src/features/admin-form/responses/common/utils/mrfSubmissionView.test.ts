import { WorkflowStatus } from '~shared/types'

import { getPendingResponseAtString } from './mrfSubmissionView'

describe('getPendingResponseAtString', () => {
  test('should return empty string when workflow status is approved', () => {
    const result = getPendingResponseAtString({
      workflowStatus: WorkflowStatus.APPROVED,
      workflowCurrentStepNumber: 1,
      workflowNumTotalSteps: 2,
    })
    expect(result).toBe('')
  })

  test('should return empty string when workflow status is rejected', () => {
    const result = getPendingResponseAtString({
      workflowStatus: WorkflowStatus.REJECTED,
      workflowCurrentStepNumber: 1,
      workflowNumTotalSteps: 2,
    })
    expect(result).toBe('')
  })

  test('should return empty string when workflow status is completed', () => {
    const result = getPendingResponseAtString({
      workflowStatus: WorkflowStatus.COMPLETED,
      workflowCurrentStepNumber: 1,
      workflowNumTotalSteps: 2,
    })
    expect(result).toBe('')
  })

  test('should return empty string when workflowCurrentStepNumber === workflowNumTotalSteps', () => {
    const result = getPendingResponseAtString({
      workflowStatus: WorkflowStatus.PENDING,
      workflowCurrentStepNumber: 2,
      workflowNumTotalSteps: 2,
    })
    expect(result).toBe('')
  })

  test('should return empty string when workflowCurrentStepNumber > workflowNumTotalSteps', () => {
    const result = getPendingResponseAtString({
      workflowStatus: WorkflowStatus.PENDING,
      workflowCurrentStepNumber: 3,
      workflowNumTotalSteps: 2,
    })
    expect(result).toBe('')
  })

  test('should return correct workflowCurrentStepNumber of workflowNumTotalSteps string when workflow status is pending and workflowCurrentStepNumber < workflowNumTotalSteps', () => {
    const result = getPendingResponseAtString({
      workflowStatus: WorkflowStatus.PENDING,
      workflowCurrentStepNumber: 1,
      workflowNumTotalSteps: 2,
    })
    expect(result).toBe('Step 2 of 2')
  })
})
