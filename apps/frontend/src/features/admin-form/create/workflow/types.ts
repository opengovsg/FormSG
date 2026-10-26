import {
  FirstStepLoginInput,
  FormFieldDto,
  FormWorkflowStepAuth,
  FormWorkflowStepBase,
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

export enum GuidedWrapUp {
  None = 'none',
  EmailSaved = 'email-saved',
  StatusTracking = 'status-tracking',
  Done = 'done',
}

export type EditStepInputs = Omit<FormWorkflowStepBase, 'auth'> & {
  _id: string
  workflow_type: WorkflowType
  emails?: FormWorkflowStepStatic['emails']
  field?: FormWorkflowStepDynamic['field']
  approval_field?: FormFieldDto['_id']
  conditional_field?: FormFieldDto['_id']
  step_name: FormWorkflowStepStatic['step_name']
  // Steps 2+ only. Null or undefined means no login.
  auth?: FormWorkflowStepAuth | null
  // Step 1 only. Set once the admin changes Step 1's login in the editor, so
  // an untouched step leaves the form-level login alone.
  first_step_login?: FirstStepLoginInput
}
