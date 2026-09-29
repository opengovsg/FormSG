import { FormFieldDto } from '../field'

import type { FormAuthType, WhitelistedSubmitterIds } from './form'

export enum WorkflowType {
  Static = 'static',
  Dynamic = 'dynamic',
  Conditional = 'conditional',
}

// Logins the step editor offers. Step 1 may still hold a legacy provider until changed.
export type StepLoginAuthType =
  | FormAuthType.NIL
  | FormAuthType.MyInfo
  | FormAuthType.CP

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

// Public projections carry only the enabled state of an eligible-respondent list.
type WithPublicAuth<T> = Omit<T, 'auth'> & { auth?: PublicWorkflowStepAuth }

export type StrippedFormWorkflowStep =
  | WithPublicAuth<FormWorkflowStepStaticNoEmails>
  | WithPublicAuth<FormWorkflowStepDynamic>
  | WithPublicAuth<FormWorkflowStepConditional>

export type FormWorkflow = Array<FormWorkflowStep>

// Request-only login input. The list is sent as whitelistCsvString, never as a reference.
export type WorkflowStepLoginInput = Pick<
  FormWorkflowStepAuth,
  'auth_type' | 'is_submitter_id_collection_enabled'
>

// Step 1 login lives on the form. Omitted values keep their saved values.
export interface WorkflowStepFormLevelInput {
  first_step_login?: {
    authType?: FormAuthType
    isSubmitterIdCollectionEnabled?: boolean
    isSingleSubmission?: boolean
  }
  esrvc_id?: string
}

type WithWriteAuth<T> = Omit<T, 'auth'> & {
  auth?: WorkflowStepLoginInput | null
}

// PUT: omitted auth keeps the saved login, null removes it. POST: omitted means no login.
export type WorkflowStepWriteDto = (
  | WithWriteAuth<FormWorkflowStepStatic>
  | WithWriteAuth<FormWorkflowStepDynamic>
  | WithWriteAuth<FormWorkflowStepConditional>
) & { _id?: string } & WorkflowStepFormLevelInput & {
    // Omitted keeps the saved list, null clears it, a string replaces it.
    whitelistCsvString?: string | null
  }

// Additional props to be added for DTOs

export type FormWorkflowStepDto = FormWorkflowStep & { _id: string }

export type FormWorkflowDto = Array<FormWorkflowStepDto>

export type StrippedFormWorkflowStepDto = StrippedFormWorkflowStep & {
  _id: string
}

export type StrippedFormWorkflowDto = Array<StrippedFormWorkflowStepDto>
