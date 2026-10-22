import { DateString } from './generic'
import { WorkflowStatus } from './submission'

export enum WorkflowEventType {
  Stopped = 'stopped',
  AssigneesAdded = 'assignees_added',
  ReminderSent = 'reminder_sent',
  StepSubmitted = 'step_submitted',
}

export type AdminWorkflowEventType = Exclude<
  WorkflowEventType,
  WorkflowEventType.StepSubmitted
>

export type AdminWorkflowEventBase = {
  type: AdminWorkflowEventType
  actorEmail: string
  stepNumber: number
  emails: string[]
}

export type StepSubmittedEventBase = {
  type: WorkflowEventType.StepSubmitted
  outcome: Exclude<WorkflowStatus, WorkflowStatus.PENDING>
  stepNumber: number
  emails: string[]
}

export type WorkflowEventBase = AdminWorkflowEventBase | StepSubmittedEventBase

export type WorkflowEventDto = WorkflowEventBase & {
  created: DateString
}
