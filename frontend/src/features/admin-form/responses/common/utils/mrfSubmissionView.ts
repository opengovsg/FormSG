import { TFunction } from 'i18next'

import {
  StrippedFormWorkflowDto,
  SubmittedStep,
  WorkflowStatus,
} from '~shared/types'

export enum MRF_STATUS {
  COMPLETED = 'Completed',
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Not approved',
}

interface CurrentWorkflowInfo {
  workflowStatus: WorkflowStatus
  workflowCurrentStepNumber: number // note that this is 1-indexed
  workflowNumTotalSteps: number
}

/** Gets the business friendly message for the current pending step of the workflow.  */
export const getPendingResponseAtString = (
  {
    workflowStatus,
    workflowCurrentStepNumber,
    workflowNumTotalSteps,
  }: CurrentWorkflowInfo,
  t?: TFunction,
) => {
  const isPending =
    workflowStatus === WorkflowStatus.PENDING &&
    workflowCurrentStepNumber < workflowNumTotalSteps
  if (!isPending) {
    return '-'
  }

  // The form is currently completed until step N.
  // Thus, it should mean that it is pending the response of N+1
  const pendingStep = workflowCurrentStepNumber + 1

  return getCurrentStepString(
    {
      workflowCurrentStepNumber: pendingStep,
      workflowNumTotalSteps,
    },
    t,
  )
}

/** Gets the business friendly string for current step of workflow. */
const getCurrentStepString = (
  {
    workflowCurrentStepNumber,
    workflowNumTotalSteps,
  }: Pick<
    CurrentWorkflowInfo,
    'workflowNumTotalSteps' | 'workflowCurrentStepNumber'
  >,
  t?: TFunction,
) => {
  if (!workflowCurrentStepNumber || !workflowNumTotalSteps) {
    return ''
  }

  return t
    ? t('mrf.workflowStep', {
        currentStep: workflowCurrentStepNumber,
        totalSteps: workflowNumTotalSteps,
      })
    : `Step ${workflowCurrentStepNumber} of ${workflowNumTotalSteps}`
}

/** Gets the business friendly string for MRF submission status. */
export const getStatusFromWorkflowStatus = (
  workflowStatus: WorkflowStatus,
): MRF_STATUS => {
  switch (workflowStatus) {
    case WorkflowStatus.COMPLETED:
      return MRF_STATUS.COMPLETED
    case WorkflowStatus.APPROVED:
      return MRF_STATUS.APPROVED
    case WorkflowStatus.REJECTED:
      return MRF_STATUS.REJECTED
    case WorkflowStatus.PENDING:
      return MRF_STATUS.PENDING
    default: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _: never = workflowStatus
      throw new Error('Invalid WorkflowStatus encountered.')
    }
  }
}

export type getWorkflowStatusFromFormResponseProps = {
  index: number
  workflow: StrippedFormWorkflowDto
  submittedSteps: SubmittedStep[]
}

/** Gets a step's workflow status from workflow steps and MRF submmission steps */
export const getWorkflowStatusFromFormResponse = ({
  index,
  workflow,
  submittedSteps,
}: getWorkflowStatusFromFormResponseProps): WorkflowStatus => {
  const submittedStep = submittedSteps[index]

  // Steps that haven't been submitted must be PENDING
  if (index >= submittedSteps.length) {
    return WorkflowStatus.PENDING
  }

  // Return the ApprovalStatus of approval steps (either APPROVED or REJECTED)
  if (
    workflow[index].approval_field &&
    submittedStep !== undefined &&
    'status' in submittedStep
  ) {
    return submittedStep.status
  }

  // Otherwise, the step is COMPLETED
  return WorkflowStatus.COMPLETED
}
