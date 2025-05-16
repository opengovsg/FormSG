import { WorkflowStatus } from './submission'

export type StepData = {
  name: string
  stepNumber: number
  timestamp?: string
  isApproval?: boolean
  workflowStatus?: WorkflowStatus
}
