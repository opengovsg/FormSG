import {
  AdminWorkflowEventType,
  DateString,
  SubmittedStep,
  WorkflowEventDto,
  WorkflowEventType,
  WorkflowStatus,
} from 'formsg-shared/types'
import mongoose from 'mongoose'
import { ResultAsync } from 'neverthrow'

import {
  IAdminWorkflowEvent,
  IStepSubmittedEvent,
  IWorkflowEvent,
  StepSubmittedContent,
} from '../../../types'
import { createLoggerWithLabel } from '../../config/logger'
import { getMultirespondentSubmissionModel } from '../../models/submission.server.model'
import { getMongoErrorMessage } from '../../utils/handle-mongo-error'
import { DatabaseError } from '../core/core.errors'

const MultirespondentSubmission = getMultirespondentSubmissionModel(mongoose)
const logger = createLoggerWithLabel(module)

/**
 * Builds an event to $push onto a submission's `workflowEvents`, for callers
 * that write it together with the action in one conditional update.
 */
export const buildWorkflowEvent = ({
  type,
  actor,
  stepNumber,
  emails,
  ...sendBackDetails
}: {
  type: AdminWorkflowEventType
  actor: { _id?: unknown; email: string }
  stepNumber: number
  emails: string[]
} & Pick<
  IAdminWorkflowEvent,
  'fromStepNumber' | 'remarks' | 'undoneSteps'
>): IAdminWorkflowEvent => ({
  type,
  actorId: actor._id,
  actorEmail: actor.email,
  stepNumber,
  emails,
  ...sendBackDetails,
  created: new Date(),
})

export const buildStepSubmittedEvent = (
  stepNumber: number,
  step: SubmittedStep,
  content: StepSubmittedContent,
): IStepSubmittedEvent => ({
  type: WorkflowEventType.StepSubmitted,
  outcome: step.isApproval ? step.status : WorkflowStatus.COMPLETED,
  stepNumber,
  emails: step.nextStepRecipientEmails ?? [],
  created: new Date(step.submittedAt),
  content,
})

/**
 * Appends a workflow action to the submission's `workflowEvents`.
 * @returns ok(event) when recorded
 * @returns err(DatabaseError) if the write fails
 */
export const recordWorkflowEvent = ({
  submission,
  ...eventParams
}: {
  submission: { _id?: unknown }
  type: AdminWorkflowEventType
  actor: { _id?: unknown; email: string }
  stepNumber: number
  emails: string[]
}): ResultAsync<IAdminWorkflowEvent, DatabaseError> => {
  const event = buildWorkflowEvent(eventParams)
  return ResultAsync.fromPromise(
    MultirespondentSubmission.updateOne(
      { _id: submission._id },
      { $push: { workflowEvents: event } },
    ).exec(),
    (error) => {
      logger.error({
        message: 'Error recording workflow event',
        meta: {
          action: 'recordWorkflowEvent',
          submissionId: String(submission._id),
          type: event.type,
        },
        error,
      })
      return new DatabaseError(getMongoErrorMessage(error))
    },
  ).map(() => event)
}

const toStepSubmittedEventDto = (
  event: IStepSubmittedEvent,
): WorkflowEventDto => ({
  type: event.type,
  outcome: event.outcome,
  stepNumber: event.stepNumber,
  emails: event.emails,
  created: new Date(event.created).toISOString() as DateString,
})

const toAdminWorkflowEventDto = (
  event: IAdminWorkflowEvent,
): WorkflowEventDto => ({
  type: event.type,
  actorEmail: event.actorEmail,
  stepNumber: event.stepNumber,
  emails: event.emails,
  ...(event.type === WorkflowEventType.SentBack
    ? {
        fromStepNumber: event.fromStepNumber,
        remarks: event.remarks,
        undoneSteps: event.undoneSteps,
      }
    : {}),
  created: new Date(event.created).toISOString() as DateString,
})

/**
 * @returns the events as sent to admins, oldest first
 */
export const toWorkflowEventDtos = (
  events: IWorkflowEvent[] = [],
): WorkflowEventDto[] =>
  events
    .map((event) =>
      event.type === WorkflowEventType.StepSubmitted
        ? toStepSubmittedEventDto(event)
        : toAdminWorkflowEventDto(event),
    )
    .sort((a, b) => a.created.localeCompare(b.created))

/**
 * The events since the workflow was last sent back. A step reached again after
 * a send back starts afresh for counts kept per step, such as reminders.
 */
export const getEventsSinceLastSendBack = (
  events: IWorkflowEvent[] = [],
): IWorkflowEvent[] => {
  const sinceLastSendBack = [...events]
    .reverse()
    .findIndex(({ type }) => type === WorkflowEventType.SentBack)
  return sinceLastSendBack === -1
    ? events
    : events.slice(events.length - sinceLastSendBack)
}
