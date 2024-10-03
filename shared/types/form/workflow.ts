import { FormFieldDto } from '../field'

export enum WorkflowType {
  Static = 'static',
  Dynamic = 'dynamic',
}

export interface FormWorkflowStepBase {
  workflow_type: WorkflowType
  edit: FormFieldDto['_id'][]
  approval_field?: FormFieldDto['_id']
}

export interface FormWorkflowStepStatic extends FormWorkflowStepBase {
  workflow_type: WorkflowType.Static
  emails: string[]
}

export interface FormWorkflowStepDynamic extends FormWorkflowStepBase {
  workflow_type: WorkflowType.Dynamic
  field: FormFieldDto['_id']
}

export type FormWorkflowStep = FormWorkflowStepStatic | FormWorkflowStepDynamic

export type FormWorkflow = Array<FormWorkflowStep>

// Additional props to be added for DTOs

export type FormWorkflowStepDto = FormWorkflowStep & { _id: string }

export type FormWorkflowDto = Array<FormWorkflowStepDto>
