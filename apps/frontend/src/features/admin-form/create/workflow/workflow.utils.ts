import { FormWorkflowStep, WorkflowType } from 'formsg-shared/types/form'

/**
 * A workflow step is "completed" when it has fields assigned
 * and a respondent configured.
 */
export const isStepCompleted = (step: FormWorkflowStep): boolean => {
  if (step.edit.length === 0) return false

  switch (step.workflow_type) {
    case WorkflowType.Static:
      return step.emails.length > 0
    case WorkflowType.Dynamic:
      return !!step.field
    case WorkflowType.Conditional:
      return !!step.conditional_field
  }
}
