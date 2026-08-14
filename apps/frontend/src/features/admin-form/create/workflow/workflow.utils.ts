import { FormFieldDto } from 'formsg-shared/types/field'
import { FormWorkflowStep } from 'formsg-shared/types/form'
import { isStepComplete } from 'formsg-shared/utils/workflow-step-completion'

/** How many completed steps count as "the admin has set up a workflow". */
const COMPLETED_STEPS_FOR_FEEDBACK = 2

/**
 * Whether a workflow has enough completed steps to prompt the admin for
 * feedback. Takes the whole workflow so the positional first-step rule stays
 * an implementation detail of `isStepComplete`.
 */
export const isWorkflowFeedbackEligible = (
  workflow: FormWorkflowStep[],
  formFields: FormFieldDto[],
): boolean =>
  workflow.filter((step, stepNumber) =>
    isStepComplete(step, formFields, stepNumber),
  ).length >= COMPLETED_STEPS_FOR_FEEDBACK
