import { DateString } from './generic'

export enum WorkflowEventType {
  Stopped = 'stopped',
  AssigneesAdded = 'assignees_added',
  ReminderSent = 'reminder_sent',
}

export type WorkflowEventBase = {
  type: WorkflowEventType
  formId: string
  submissionId: string
  actorEmail: string
  stepNumber: number
  emails: string[]
}

export type WorkflowEventDto = WorkflowEventBase & {
  created: DateString
}
