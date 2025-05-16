import { WorkflowStatus } from './submission'

export type StepData = {
  name: string
  stepNumber: number
  timestamp?: string
  workflowStatus: WorkflowStatus
}
