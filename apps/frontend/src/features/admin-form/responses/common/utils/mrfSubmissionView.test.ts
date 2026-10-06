import { FormResponseMode, WorkflowStatus } from 'formsg-shared/types'

import {
  getPendingResponseAtString,
  hasWorkflowSteps,
  hasWorkflowSubmission,
} from './mrfSubmissionView'

const noneString = '-'

describe('getPendingResponseAtString', () => {
  test('should return empty string when workflow status is approved', () => {
    const result = getPendingResponseAtString({
      workflowStatus: WorkflowStatus.APPROVED,
      workflowCurrentStepNumber: 1,
      workflowNumTotalSteps: 2,
    })
    expect(result).toBe(noneString)
  })

  test('should return empty string when workflow status is rejected', () => {
    const result = getPendingResponseAtString({
      workflowStatus: WorkflowStatus.REJECTED,
      workflowCurrentStepNumber: 1,
      workflowNumTotalSteps: 2,
    })
    expect(result).toBe(noneString)
  })

  test('should return empty string when workflow status is completed', () => {
    const result = getPendingResponseAtString({
      workflowStatus: WorkflowStatus.COMPLETED,
      workflowCurrentStepNumber: 1,
      workflowNumTotalSteps: 2,
    })
    expect(result).toBe(noneString)
  })

  test('should return empty string when workflowCurrentStepNumber === workflowNumTotalSteps', () => {
    const result = getPendingResponseAtString({
      workflowStatus: WorkflowStatus.PENDING,
      workflowCurrentStepNumber: 2,
      workflowNumTotalSteps: 2,
    })
    expect(result).toBe(noneString)
  })

  test('should return empty string when workflowCurrentStepNumber > workflowNumTotalSteps', () => {
    const result = getPendingResponseAtString({
      workflowStatus: WorkflowStatus.PENDING,
      workflowCurrentStepNumber: 3,
      workflowNumTotalSteps: 2,
    })
    expect(result).toBe(noneString)
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

describe('hasWorkflowSteps', () => {
  const form = (partial: object) =>
    partial as Parameters<typeof hasWorkflowSteps>[0]

  it('is true only for a multi-respondent form with steps', () => {
    expect(
      hasWorkflowSteps(
        form({
          responseMode: FormResponseMode.Multirespondent,
          workflow: [{}],
        }),
      ),
    ).toBe(true)
  })

  it('is false for a multi-respondent form with no steps', () => {
    expect(
      hasWorkflowSteps(
        form({ responseMode: FormResponseMode.Multirespondent, workflow: [] }),
      ),
    ).toBe(false)
  })

  it('is false for a multi-respondent form with no workflow', () => {
    expect(
      hasWorkflowSteps(
        form({ responseMode: FormResponseMode.Multirespondent }),
      ),
    ).toBe(false)
  })

  it('is false for a storage form and for no form at all', () => {
    expect(
      hasWorkflowSteps(form({ responseMode: FormResponseMode.Encrypt })),
    ).toBe(false)
    expect(hasWorkflowSteps(undefined)).toBe(false)
  })
})

describe('hasWorkflowSubmission', () => {
  const withSteps = (workflowNumTotalSteps: number) => ({
    mrf: {
      workflowCurrentStepNumber: 1,
      workflowNumTotalSteps,
      workflowStatus: undefined,
      lastSubmittedAt: undefined,
      hasNextStepRecipientEmails: false,
    },
  })

  it('is true once any submission was made under a workflow', () => {
    expect(hasWorkflowSubmission([withSteps(0), withSteps(2)])).toBe(true)
  })

  it('is false when every submission predates the workflow', () => {
    expect(hasWorkflowSubmission([withSteps(0), withSteps(0)])).toBe(false)
  })

  it('is false with no submissions, or none carrying workflow metadata', () => {
    expect(hasWorkflowSubmission([])).toBe(false)
    expect(hasWorkflowSubmission([{ mrf: undefined }])).toBe(false)
  })
})
