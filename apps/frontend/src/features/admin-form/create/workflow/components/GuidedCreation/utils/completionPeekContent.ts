import { TFunction } from 'i18next'

/**
 * The copy for each of the guided flow's five completion moments.
 *
 * Separate from the components so the one rule worth testing, step 1 reading
 * differently from every later step, is testable without rendering. Kept in one
 * place because the pattern has to read the same at every moment.
 */

const PREFIX = 'features.adminForm.sidebar.workflow.completionPeek'

export enum CompletionPeekMomentType {
  /**
   * Step 1 gets its own wording because it is the only step whose respondents
   * the admin does not choose.
   */
  StepOneDone = 'stepOneDone',
  LaterStepDone = 'laterStepDone',
  EmailSetUp = 'emailSetUp',
  /**
   * The one moment that does not report a completion. It introduces a setting
   * the admin has not met, so the title gives them the completion they earned
   * and the subtitle offers the setting as something optional.
   */
  StatusTracking = 'statusTracking',
  GuidedSetupFinished = 'guidedSetupFinished',
}

/**
 * Which moment is being reported. A union rather than a bare enum because only
 * the later-step moment needs a step number, and the others must not be given
 * one.
 */
export type CompletionPeekMoment =
  | { type: CompletionPeekMomentType.StepOneDone }
  | {
      type: CompletionPeekMomentType.LaterStepDone
      /**
       * Zero-based, matching `WorkflowContent`'s `stepNumber={i}` and the rest
       * of the workflow store. Rendered as `stepNumber + 1`, so step index 1
       * reads "Step 2".
       */
      stepNumber: number
    }
  | { type: CompletionPeekMomentType.EmailSetUp }
  | { type: CompletionPeekMomentType.StatusTracking }
  | { type: CompletionPeekMomentType.GuidedSetupFinished }

export interface CompletionPeekContent {
  title: string
  subtitle: string
}

/**
 * The title and subtitle for a moment. Every moment has both; the card's
 * subtitle is optional but no moment currently omits it.
 */
export const getCompletionPeekContent = (
  t: TFunction,
  moment: CompletionPeekMoment,
): CompletionPeekContent => ({
  title: t(
    `${PREFIX}.${moment.type}.title`,
    moment.type === CompletionPeekMomentType.LaterStepDone
      ? { stepNumber: moment.stepNumber + 1 }
      : undefined,
  ),
  subtitle: t(`${PREFIX}.${moment.type}.subtitle`),
})

export interface CompletionPeekActionLabels {
  declineAnotherStep: string
  addAnotherStep: string
  continue: string
  finish: string
}

/**
 * The four action labels, resolved together so that all of this pattern's copy
 * lives in one module. Labels are separate from the moments because an action
 * is a label paired with a callback, and the callbacks belong to whoever is
 * driving the flow.
 */
export const getCompletionPeekActionLabels = (
  t: TFunction,
): CompletionPeekActionLabels => ({
  declineAnotherStep: t(`${PREFIX}.actions.declineAnotherStep`),
  addAnotherStep: t(`${PREFIX}.actions.addAnotherStep`),
  continue: t(`${PREFIX}.actions.continue`),
  finish: t(`${PREFIX}.actions.finish`),
})

/**
 * Tucked under the card it reports on, except for the email moment, which
 * follows the end-of-workflow block rather than a card and so is free-standing.
 *
 * Derived rather than passed in, so no call site can tuck a card under
 * something that is not a card.
 */
export const isCompletionPeekTucked = (moment: CompletionPeekMoment): boolean =>
  moment.type !== CompletionPeekMomentType.EmailSetUp
