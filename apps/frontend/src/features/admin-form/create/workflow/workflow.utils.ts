import { FormWorkflowStep, WorkflowType } from 'formsg-shared/types/form'

import { isFirstStepByStepNumber } from './components/WorkflowContent/utils/isFirstStepByStepNumber'

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
 */
export const isStepCompleted = (
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
