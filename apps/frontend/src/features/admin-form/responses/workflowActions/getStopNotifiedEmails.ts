import {
  AdminSubmittedStep,
  WorkflowEventDto,
  WorkflowEventType,
} from 'formsg-shared/types'

export type WorkflowHistory = {
  submittedSteps: AdminSubmittedStep[]
  workflow: { _id: string; step_name?: string }[]
  workflowEvents?: WorkflowEventDto[]
}

const unique = (emails: string[]) =>
  Array.from(new Set(emails.map((email) => email.toLowerCase())))

export const getStepRecipients = ({
  submittedSteps,
  events = [],
  stepNumber,
}: {
  submittedSteps: AdminSubmittedStep[]
  events?: WorkflowEventDto[]
  stepNumber: number
}): string[] => {
  const previousStep = submittedSteps[stepNumber - 2]
  return unique([
    ...(previousStep && 'nextStepRecipientEmails' in previousStep
      ? (previousStep.nextStepRecipientEmails ?? [])
      : []),
    ...events
      .filter(
        (event) =>
          event.type === WorkflowEventType.AssigneesAdded &&
          event.stepNumber === stepNumber,
      )
      .flatMap((event) => event.emails),
  ])
}
