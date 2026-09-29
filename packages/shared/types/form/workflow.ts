import { FormFieldDto } from '../field'

import type { FormAuthType, WhitelistedSubmitterIds } from './form'

export enum WorkflowType {
  Static = 'static',
  Dynamic = 'dynamic',
  Conditional = 'conditional',
}

export type WorkflowStepAuthType = FormAuthType.MyInfo | FormAuthType.CP

// Login for steps after the first. Step 1 uses the form-level auth settings.
export interface FormWorkflowStepAuth {
  auth_type: WorkflowStepAuthType
  is_submitter_id_collection_enabled: boolean
  // Mirrors the form-level whitelistedSubmitterIds
  whitelisted_submitter_ids?: WhitelistedSubmitterIds | null
}

export interface PublicWorkflowStepAuth {
  auth_type: WorkflowStepAuthType
  is_submitter_id_collection_enabled: boolean
  isWhitelistEnabled: boolean
}

export interface FormWorkflowStepBase {
  workflow_type: WorkflowType
  edit: FormFieldDto['_id'][]
  approval_field?: FormFieldDto['_id']
  is_approval_enabled?: boolean
  step_name?: string
  auth?: FormWorkflowStepAuth
}

export interface FormWorkflowStepStatic extends FormWorkflowStepBase {
  workflow_type: WorkflowType.Static
  emails: string[]
}

export type FormWorkflowStepStaticNoEmails = Omit<
  FormWorkflowStepStatic,
  'emails'
>

export interface FormWorkflowStepDynamic extends FormWorkflowStepBase {
  workflow_type: WorkflowType.Dynamic
  field: FormFieldDto['_id']
}

export interface FormWorkflowStepConditional extends FormWorkflowStepBase {
  workflow_type: WorkflowType.Conditional
  conditional_field: FormFieldDto['_id']
}

export type FormWorkflowStep =
  | FormWorkflowStepStatic
  | FormWorkflowStepDynamic
  | FormWorkflowStepConditional

export type StrippedFormWorkflowStep =
  | FormWorkflowStepStaticNoEmails
  | FormWorkflowStepDynamic
  | FormWorkflowStepConditional

export type FormWorkflow = Array<FormWorkflowStep>

// Additional props to be added for DTOs

export type FormWorkflowStepDto = FormWorkflowStep & { _id: string }

export type FormWorkflowDto = Array<FormWorkflowStepDto>

export type StrippedFormWorkflowStepDto = StrippedFormWorkflowStep & {
  _id: string
}

export type StrippedFormWorkflowDto = Array<StrippedFormWorkflowStepDto>
