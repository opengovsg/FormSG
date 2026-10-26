import { FormFieldDto } from '../field'
import type { FormAuthType } from './form'

export enum WorkflowType {
  Static = 'static',
  Dynamic = 'dynamic',
  Conditional = 'conditional',
}

/** Logins a workflow step after Step 1 may require. SP is deprecated. */
export type WorkflowStepAuthType = FormAuthType.MyInfo | FormAuthType.CP

/**
 * Login saved on a step after Step 1. Step 1 keeps the form-level settings
 * (`authType`, `esrvcId`), so `workflow[0]` never carries `auth`. An absent
 * `auth` means the step has no login.
 */
export interface FormWorkflowStepAuth {
  auth_type: WorkflowStepAuthType
  // Corppass only. Corppass checks its authorisation list against this ID.
  esrvc_id?: string
}

/** Logins Step 1 may use, written through the form-level settings. */
export type StepLoginAuthType =
  | FormAuthType.NIL
  | FormAuthType.MyInfo
  | FormAuthType.CP

/**
 * Step 1's login as sent with a step save. Request-only: it is written to the
 * form-level `authType` and `esrvcId` in the same save as the step and never
 * stored on the step. Absent means "leave the form-level login alone".
 */
export interface FirstStepLoginInput {
  auth_type: StepLoginAuthType
  esrvc_id?: string
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

type WithWriteAuth<T> = Omit<T, 'auth'> & {
  // Absent or null means no login. The admin UI always sends the whole step.
  auth?: FormWorkflowStepAuth | null
  // Step 1 only. See FirstStepLoginInput.
  first_step_login?: FirstStepLoginInput
}

/** A step as the admin UI creates or updates it. */
export type FormWorkflowStepWriteDto = (
  | WithWriteAuth<FormWorkflowStepStatic>
  | WithWriteAuth<FormWorkflowStepDynamic>
  | WithWriteAuth<FormWorkflowStepConditional>
) & { _id?: string }

// Additional props to be added for DTOs

export type FormWorkflowStepDto = FormWorkflowStep & { _id: string }

export type FormWorkflowDto = Array<FormWorkflowStepDto>

export type StrippedFormWorkflowStepDto = StrippedFormWorkflowStep & {
  _id: string
}

export type StrippedFormWorkflowDto = Array<StrippedFormWorkflowStepDto>
