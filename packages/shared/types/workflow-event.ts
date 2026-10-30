import { DateString } from './generic'
import type { WorkflowStatus } from './submission'

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

export type WorkflowEventBase = {
  type: AdminWorkflowEventType
  actorEmail: string
  stepNumber: number
  emails: string[]
}

export type AdminWorkflowEventDto = WorkflowEventBase & {
  created: DateString
}

export type StepSubmittedEventDto = {
  type: WorkflowEventType.StepSubmitted
  stepNumber: number
  outcome: Exclude<WorkflowStatus, WorkflowStatus.PENDING>
  emails: string[]
  created: DateString
}

export type WorkflowEventDto = AdminWorkflowEventDto | StepSubmittedEventDto
