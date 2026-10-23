import { AdminSubmittedStep, WorkflowEventDto } from 'formsg-shared/types'

export type DecryptedResponseLike = {
  _id: string
  answer?: unknown
}

export type WorkflowHistory = {
  submittedSteps: AdminSubmittedStep[]
  workflow: { _id: string; step_name?: string }[]
  workflowEvents?: WorkflowEventDto[]
}

const unique = (emails: string[]) =>
  Array.from(new Set(emails.map((email) => email.toLowerCase())))

export const getStepRecipients = ({
  submittedSteps,
  stepNumber,
}: {
  submittedSteps: AdminSubmittedStep[]
  stepNumber: number
}): string[] => {
  const previousStep = submittedSteps[stepNumber - 2]
  return unique(previousStep?.nextStepRecipientEmails ?? [])
}

export const getStopNotifiedEmails = ({
  history,
  responses = [],
  otherEmails,
  stepOneEmailFieldId,
  stepIdsToNotify,
}: {
  history: WorkflowHistory
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
        ? getStepRecipients({
            submittedSteps: history.submittedSteps,
            stepNumber: index + 1,
          })
        : [],
    ),
  ])
}
