import { FormFieldDto } from '../field'

export enum WorkflowType {
  Static = 'static',
  Dynamic = 'dynamic',
  Conditional = 'conditional',
}

export interface FormWorkflowStepBase {
  workflow_type: WorkflowType
  edit: FormFieldDto['_id'][]
  approval_field?: FormFieldDto['_id']
  step_name?: string
  /**
   * Marks a step slot that exists but has not been set up. Only step 1 can be a
   * placeholder, and only the delete-step endpoint writes one: deleting step 1
   * leaves this behind instead of shifting the remaining steps up, so steps 2
   * onwards keep their positions and their configuration.
   *
   * A workflow whose first step is a placeholder does not run. See
   * `getRunnableWorkflow`.
   */
  isPlaceholder?: boolean
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
