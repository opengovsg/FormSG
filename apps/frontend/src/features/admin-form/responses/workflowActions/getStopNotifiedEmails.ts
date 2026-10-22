import { AdminSubmittedStep, WorkflowEventDto } from 'formsg-shared/types'

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
