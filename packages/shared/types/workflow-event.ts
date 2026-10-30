import { DateString } from './generic'

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

export type WorkflowEventDto = WorkflowEventBase & {
  created: DateString
}
