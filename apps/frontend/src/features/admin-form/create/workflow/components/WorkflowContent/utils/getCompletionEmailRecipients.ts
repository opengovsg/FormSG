/**
 * What the collapsed completion email card displays, derived from the stored MRF
 * email notification settings. Free of i18n so that the id resolution and the
 * empty-state rule are testable without rendering.
 */

export interface CompletionEmailRecipientsInput {
  emails: string[]
  /** '' when unset. */
  stepOneEmailNotificationFieldId: string
  stepsToNotify: string[]
  workflowSteps: readonly { _id: string; step_name?: string }[]
  emailFormFields: readonly {
    _id: string
    questionNumber?: number
    title: string
  }[]
}

export interface CompletionEmailRecipients {
  otherParties: string[]
  stepOneField: { questionNumber?: number; title: string } | null
  /** 1-based step numbers, as admins see them, in workflow order. */
  notifiedSteps: { stepNumber: number; stepName?: string }[]
  /** True when nothing is configured, which is where every new form starts. */
  isEmpty: boolean
}

export const getCompletionEmailRecipients = ({
  emails,
  stepOneEmailNotificationFieldId,
  stepsToNotify,
  workflowSteps,
  emailFormFields,
}: CompletionEmailRecipientsInput): CompletionEmailRecipients => {
  const otherParties = emails.filter(Boolean)

  // A field or step since deleted resolves away rather than showing a dangling
  // id. Settings drops them from its options for the same reason.
  const matchedField = stepOneEmailNotificationFieldId
    ? emailFormFields.find(
        (field) => field._id === stepOneEmailNotificationFieldId,
      )
    : undefined
  const stepOneField = matchedField
    ? { questionNumber: matchedField.questionNumber, title: matchedField.title }
    : null

  // Walk the workflow, not stepsToNotify, so the summary reads in the same
  // order as the steps above it.
  const notifiedStepIds = new Set(stepsToNotify)
  const notifiedSteps = workflowSteps
    .map((step, index) => ({ step, stepNumber: index + 1 }))
    .filter(({ step }) => notifiedStepIds.has(step._id))
    .map(({ step, stepNumber }) => ({ stepNumber, stepName: step.step_name }))

  return {
    otherParties,
    stepOneField,
    notifiedSteps,
    isEmpty:
      otherParties.length === 0 &&
      stepOneField === null &&
      notifiedSteps.length === 0,
  }
}
