import { FormWorkflowStep, WorkflowType } from 'formsg-shared/types/form'

import { isFirstStepByStepNumber } from './components/WorkflowContent/utils/isFirstStepByStepNumber'

/** How many completed steps count as "the admin has set up a workflow". */
const COMPLETED_STEPS_FOR_FEEDBACK = 2

/**
 * A workflow step is "completed" when it has fields assigned
 * and a respondent configured.
 *
 * The first step is the exception: its respondent is always "anyone who has
 * access to your form", which is stored as a Static step with an empty
 * `emails` array. Without that exception it could never be completed, so the
 * trigger would need three visible steps to see two completed ones.
 *
 * `stepNumber` must be the step's position in the full, unfiltered workflow.
 * Callers should prefer `isWorkflowFeedbackEligible`, which owns that
 * invariant.
 */
const isStepCompleted = (
  step: FormWorkflowStep,
  stepNumber: number,
): boolean => {
  if (step.edit.length === 0) return false
  if (isFirstStepByStepNumber(stepNumber)) return true

  switch (step.workflow_type) {
    case WorkflowType.Static:
      return step.emails.length > 0
    case WorkflowType.Dynamic:
      return !!step.field
    case WorkflowType.Conditional:
      return !!step.conditional_field
  }
}

/**
 * Whether a workflow has enough completed steps to prompt the admin for
 * feedback. Takes the whole workflow so the positional first-step rule stays
 * an implementation detail.
 */
export const isWorkflowFeedbackEligible = (
  workflow: FormWorkflowStep[],
): boolean =>
  workflow.filter(isStepCompleted).length >= COMPLETED_STEPS_FOR_FEEDBACK
