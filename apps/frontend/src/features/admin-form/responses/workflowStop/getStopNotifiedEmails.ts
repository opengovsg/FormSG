import { AdminSubmittedStep } from 'formsg-shared/types'

import { WorkflowAssigneeRecord } from './previewStore'

/** The decrypted answer fields the workflow actions read. */
export type DecryptedResponseLike = {
  _id: string
  question?: string
  answer?: unknown
  answerArray?: unknown
  fieldType?: unknown
}

/** Step history and the workflow snapshot taken at submission. */
export type WorkflowHistory = {
  submittedSteps: AdminSubmittedStep[]
  workflow: { _id: string; step_name?: string }[]
}

const unique = (emails: string[]) =>
  Array.from(new Set(emails.map((email) => email.toLowerCase())))

/**
 * Who a step was sent to (from the step history), plus anyone added to it in
 * the preview. Step 1 is the respondent, who has no stored recipients.
 */
export const getStepAssignees = ({
  submittedSteps,
  assignees,
  stepNumber,
}: {
  submittedSteps: AdminSubmittedStep[]
  assignees: WorkflowAssigneeRecord[]
  /** 1-indexed. */
  stepNumber: number
}): string[] => {
  const previousStep = submittedSteps[stepNumber - 2]
  const sentTo =
    previousStep && 'nextStepRecipientEmails' in previousStep
      ? (previousStep.nextStepRecipientEmails ?? [])
      : []
  return unique([
    ...sentTo,
    ...assignees
      .filter((assignee) => assignee.stepNumber === stepNumber)
      .flatMap((assignee) => assignee.emails),
  ])
}

/**
 * Who gets the "workflow stopped" email: exactly the three recipient groups
 * chosen in the stop modal (same as the workflow completion email). Selected
 * steps after the pending step are skipped: nobody has been asked to act on
 * them yet. [TBC: confirm with product]
 */
export const getStopNotifiedEmails = ({
  history,
  assignees,
  responses = [],
  otherEmails,
  stepOneEmailFieldId,
  stepIdsToNotify,
}: {
  history: WorkflowHistory
  assignees: WorkflowAssigneeRecord[]
  responses?: DecryptedResponseLike[]
  otherEmails: string[]
  stepOneEmailFieldId?: string
  stepIdsToNotify: string[]
}): string[] => {
  const pendingStepNumber = history.submittedSteps.length + 1
  const stepOneAnswer = responses.find(
    ({ _id }) => _id === stepOneEmailFieldId,
  )?.answer

  return unique([
    ...otherEmails,
    ...(typeof stepOneAnswer === 'string' && stepOneAnswer
      ? [stepOneAnswer]
      : []),
    ...history.workflow.flatMap((step, index) =>
      stepIdsToNotify.includes(step._id) && index + 1 <= pendingStepNumber
        ? getStepAssignees({
            submittedSteps: history.submittedSteps,
            assignees,
            stepNumber: index + 1,
          })
        : [],
    ),
  ])
}
