import {
  FormWorkflowStep,
  FormWorkflowStepDynamic,
  FormWorkflowStepStatic,
  WorkflowType,
} from '~shared/types'

export enum AdminEditWorkflowState {
  CreatingStep,
  EditingStep,
}

export type EditStepInputs = Omit<FormWorkflowStep, 'emails'> & {
  workflow_type: WorkflowType
  // Should be FormWorkflowStepStatic['emails'], but the model accomodates an
  // array of strings while on the frontend, we only want to show one email input
  // for now.
  emails?: string
  field?: FormWorkflowStepDynamic['field']
}
