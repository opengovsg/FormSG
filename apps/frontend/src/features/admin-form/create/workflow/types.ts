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

/**
 * Which card is open. Also what an in-flight save is handing over to, so that
 * "the open card" and "the card we are switching to" are the same shape and
 * need no translation between them.
 */
export type CreateOrEditData =
  | { state: AdminEditWorkflowState.CreatingStep }
  | { state: AdminEditWorkflowState.EditingStep; stepNumber: number }
  | { state: AdminEditWorkflowState.EditingEmailCard }

export type EditStepInputs = FormWorkflowStep & {
  _id: string
  workflow_type: WorkflowType
  emails?: FormWorkflowStepStatic['emails']
  field?: FormWorkflowStepDynamic['field']
  approval_field?: FormFieldDto['_id']
  conditional_field?: FormFieldDto['_id']
  step_name: FormWorkflowStepStatic['step_name']
}
