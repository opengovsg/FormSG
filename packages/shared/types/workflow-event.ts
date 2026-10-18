import { DateString } from './generic'
import { WorkflowStatus } from './submission'

export enum WorkflowEventType {
  Stopped = 'stopped',
  AssigneesAdded = 'assignees_added',
  ReminderSent = 'reminder_sent',
  StepSubmitted = 'step_submitted',
  SentBack = 'sent_back',
}

/**
 * A step submission a send back undid, kept on the event so the activity log
 * still shows it once the step is no longer in `submittedSteps`.
 */
export type UndoneWorkflowStep = {
  stepNumber: number
  submittedAt: string
  isApproval: boolean
  status?: WorkflowStatus.APPROVED | WorkflowStatus.REJECTED
  nextStepRecipientEmails?: string[]
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
  /** Send back only: the step submissions it undid, oldest first. */
  undoneSteps?: UndoneWorkflowStep[]
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
