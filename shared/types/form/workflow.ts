export enum WorkflowType {
  Static = 'static',
  Dynamic = 'dynamic',
}

export type FormWorkflowStep = {
  workflow_type: WorkflowType
  emails: string[]
}

export type FormWorkflow = Array<FormWorkflowStep>

// Additional props to be added for DTOs

export type FormWorkflowStepDto = FormWorkflowStep & { _id: string }

export type FormWorkflowDto = Array<FormWorkflowStepDto>
