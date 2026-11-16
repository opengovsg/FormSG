import { WorkflowEventType } from 'formsg-shared/types'

import { getStepRecipients, WorkflowHistory } from './getStopNotifiedEmails'

/** Match backend recipient accumulation, including Step 1 correction recipients. */
export const getCurrentStepRecipients = (
  history: WorkflowHistory,
  stepNumber: number,
): string[] => {
  if (stepNumber !== 1) {
    return getStepRecipients({
      submittedSteps: history.submittedSteps,
      events: history.workflowEvents,
      stepNumber,
    })
  }
  const events = history.workflowEvents ?? []
  const latestCorrection = events
    .filter(
      (event) =>
        event.stepNumber === 1 &&
        (event.type === WorkflowEventType.SentBack ||
          event.type === WorkflowEventType.FixStep),
    )
    .slice(-1)[0]
  return Array.from(
    new Set(
      [
        ...(latestCorrection?.emails ?? []),
        ...events
          .filter(
            (event) =>
              event.stepNumber === 1 &&
              event.type === WorkflowEventType.AssigneesAdded,
          )
          .flatMap((event) => event.emails),
      ].map((email) => email.toLowerCase()),
    ),
  )
}
