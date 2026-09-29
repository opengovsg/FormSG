import {
  FormAuthType,
  FormFieldDto,
  FormWorkflowStep,
  FormWorkflowStepDynamic,
  FormWorkflowStepStatic,
  WorkflowStepLoginInput,
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

export interface StepDraft {
  target: CreateOrEditData
  inputs: Partial<EditStepInputs>
}

// Step 1's form-level login as edited; sent as first_step_login.
export interface FirstStepLoginDraft {
  authType: FormAuthType
  isSubmitterIdCollectionEnabled: boolean
  isSingleSubmission: boolean
}

export type EditStepInputs = FormWorkflowStep & {
  _id: string
  workflow_type: WorkflowType
  emails?: FormWorkflowStepStatic['emails']
  field?: FormWorkflowStepDynamic['field']
  approval_field?: FormFieldDto['_id']
  conditional_field?: FormFieldDto['_id']
  step_name: FormWorkflowStepStatic['step_name']
  // Staged login edits, sent with the step save. Undefined keeps the saved value.
  login_auth?: WorkflowStepLoginInput | null
  first_step_login?: FirstStepLoginDraft
  esrvc_id?: string
  whitelistCsvString?: string | null
}
