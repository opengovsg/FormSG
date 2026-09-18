import {
  FormFieldDto,
  FormWorkflowStep,
  FormWorkflowStepDynamic,
  FormWorkflowStepStatic,
  WorkflowType,
} from 'formsg-shared/types'

export enum AdminEditWorkflowState {
  CreatingStep,
  EditingStep,
  EditingEmailCard,
}

export type CreateOrEditData =
  | { state: AdminEditWorkflowState.CreatingStep }
  | { state: AdminEditWorkflowState.EditingStep; stepNumber: number }
  | { state: AdminEditWorkflowState.EditingEmailCard }

export interface StepDraft {
  target: CreateOrEditData
  inputs: Partial<EditStepInputs>
}

export type EditStepInputs = FormWorkflowStep & {
  _id: string
  workflow_type: WorkflowType
  emails?: FormWorkflowStepStatic['emails']
  field?: FormWorkflowStepDynamic['field']
  approval_field?: FormFieldDto['_id']
  conditional_field?: FormFieldDto['_id']
  step_name: FormWorkflowStepStatic['step_name']
}
