import { WorkflowStatus } from '~shared/types'

export enum MRF_STATUS {
  COMPLETED = 'Completed',
  PENDING = 'Pending',
}

/** Gets the business friendly string for current step of workflow. */
export const getCurrentStepString = (
  workflowCurrentStepNumber: number | undefined,
  workflowNumTotalSteps: number | undefined,
) =>
  workflowCurrentStepNumber && workflowNumTotalSteps
    ? `Step ${workflowCurrentStepNumber} of ${workflowNumTotalSteps}`
    : ''

/** Gets the business friendly string for MRF submission status. */
export const getStatusFromWorkflowStatus = (
  workflowStatus: WorkflowStatus | undefined,
) => {
  switch (workflowStatus) {
    case WorkflowStatus.COMPLETED:
    case WorkflowStatus.APPROVED:
    case WorkflowStatus.REJECTED:
      return MRF_STATUS.COMPLETED
    case WorkflowStatus.PENDING:
      return MRF_STATUS.PENDING
    default:
      return ''
  }
}
