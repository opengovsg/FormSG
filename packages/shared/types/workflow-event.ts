import { DateString } from './generic'
import { WorkflowStatus } from './submission'

export enum WorkflowEventType {
  Stopped = 'stopped',
  AssigneesAdded = 'assignees_added',
  ReminderSent = 'reminder_sent',
  StepSubmitted = 'step_submitted',
  SentBack = 'sent_back',
}

export type AdminWorkflowEventType = Exclude<
  WorkflowEventType,
  WorkflowEventType.StepSubmitted
>

export type AdminWorkflowEventBase = {
  type: AdminWorkflowEventType
  actorEmail: string
  /** The step acted on. For a send back, the step the workflow went back to. */
  stepNumber: number
  emails: string[]
  /** Send back only: the step that was pending when it was sent back. */
  fromStepNumber?: number
  /** Send back only: the admin's remarks, emailed to the step's people. */
  remarks?: string
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
