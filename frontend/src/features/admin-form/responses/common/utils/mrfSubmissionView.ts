import { WorkflowStatus } from '~shared/types'

export enum MRF_STATUS {
  COMPLETED = 'Completed',
  PENDING = 'Pending',
}

interface CurrentWorkflowInfo {
  workflowStatus: WorkflowStatus
  workflowCurrentStepNumber: number // note that this is 1-indexed
  workflowNumTotalSteps: number
}

/** Gets the business friendly message for the current pending step of the workflow.  */
export const getPendingResponseAtString = ({
  workflowStatus,
  workflowCurrentStepNumber,
  workflowNumTotalSteps,
}: CurrentWorkflowInfo) => {
  const isPending =
    workflowStatus === WorkflowStatus.PENDING &&
    workflowCurrentStepNumber < workflowNumTotalSteps
  if (!isPending) {
    return ''
  }
  return getCurrentStepString({
    workflowCurrentStepNumber,
    workflowNumTotalSteps,
  })
}

/** Gets the business friendly string for current step of workflow. */
const getCurrentStepString = ({
  workflowCurrentStepNumber,
  workflowNumTotalSteps,
}: Pick<
  CurrentWorkflowInfo,
  'workflowNumTotalSteps' | 'workflowCurrentStepNumber'
>) => {
  return workflowCurrentStepNumber && workflowNumTotalSteps
    ? `Step ${workflowCurrentStepNumber} of ${workflowNumTotalSteps}`
    : ''
}

/** Gets the business friendly string for MRF submission status. */
export const getStatusFromWorkflowStatus = (
  workflowStatus: WorkflowStatus,
): MRF_STATUS => {
  switch (workflowStatus) {
    case WorkflowStatus.COMPLETED:
    case WorkflowStatus.APPROVED:
    case WorkflowStatus.REJECTED:
      return MRF_STATUS.COMPLETED
    case WorkflowStatus.PENDING:
      return MRF_STATUS.PENDING
    default: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _: never = workflowStatus
      throw new Error('Invalid WorkflowStatus encountered.')
    }
  }
}
