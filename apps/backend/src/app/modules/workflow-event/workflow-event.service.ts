import {
  DateString,
  WorkflowEventDto,
  WorkflowEventType,
} from 'formsg-shared/types'
import mongoose from 'mongoose'
import { ResultAsync } from 'neverthrow'

import { IWorkflowEvent } from '../../../types'
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
}: {
  type: WorkflowEventType
  actor: { _id?: unknown; email: string }
  stepNumber: number
  emails: string[]
}): IWorkflowEvent => ({
  type,
  actorId: actor._id,
  actorEmail: actor.email,
  stepNumber,
  emails,
  created: new Date(),
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
  type: WorkflowEventType
  actor: { _id?: unknown; email: string }
  stepNumber: number
  emails: string[]
}): ResultAsync<IWorkflowEvent, DatabaseError> => {
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

/**
 * @returns the events as sent to admins, oldest first
 */
export const toWorkflowEventDtos = (
  events: IWorkflowEvent[] = [],
): WorkflowEventDto[] =>
  events
    .map((event) => ({
      type: event.type,
      actorEmail: event.actorEmail,
      stepNumber: event.stepNumber,
      emails: event.emails,
      created: new Date(event.created).toISOString() as DateString,
    }))
    .sort((a, b) => a.created.localeCompare(b.created))

/**
 * @returns the emails added to the step through Reassign, lowercased and deduped
 */
export const getAddedAssignees = (
  events: IWorkflowEvent[] = [],
  stepNumber: number,
): string[] =>
  Array.from(
    new Set(
      events
        .filter(
          (event) =>
            event.type === WorkflowEventType.AssigneesAdded &&
            event.stepNumber === stepNumber,
        )
        .flatMap(({ emails }) => emails.map((email) => email.toLowerCase())),
    ),
  )
