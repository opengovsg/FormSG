import { TFunction } from 'i18next'

/**
 * The two composed labels the completion email views show for a recipient.
 *
 * Kept here rather than at each call site because the card's summary and
 * Settings' controls have to describe the same setting the same way, and only
 * one implementation can enforce that. Separate from
 * getCompletionEmailRecipients so that module stays free of i18n.
 */

const STEP_N_EACH_KEY =
  'features.adminForm.settings.emailNotifications.section.mrf.respondents.stepN.label.each'

/**
 * An email field, as "2. Your email". Falls back to the bare title when the
 * field has no question number, which Settings' own option list does not guard
 * against.
 */
export const formatEmailFieldLabel = ({
  questionNumber,
  title,
}: {
  questionNumber?: number
  title: string
}): string => (questionNumber ? `${questionNumber}. ${title}` : title)

/** A notified step, as "Step 2", or "Step 2 (Approver)" when it is named. */
export const formatNotifiedStepLabel = (
  t: TFunction,
  { stepNumber, stepName }: { stepNumber: number; stepName?: string },
): string =>
  t(STEP_N_EACH_KEY, { stepNumber }) + (stepName ? ` (${stepName})` : '')
