import {
  DateString,
  WorkflowEventDto,
  WorkflowEventType,
} from 'formsg-shared/types'
import { isWorkflowActionsEligible } from 'formsg-shared/utils/workflow-actions'
import mongoose from 'mongoose'
import { okAsync, ResultAsync } from 'neverthrow'

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
 * Appends a workflow action to the submission's `workflowEvents`. Submissions
 * created before the workflow actions cutoff are not logged.
 * @returns ok(event) when recorded
 * @returns ok(null) when the submission is before the cutoff
 * @returns err(DatabaseError) if the write fails
 */
export const recordWorkflowEvent = ({
  submission,
  ...eventParams
}: {
  submission: { _id?: unknown; created?: Date }
  type: WorkflowEventType
  actor: { _id?: unknown; email: string }
  stepNumber: number
  emails: string[]
}): ResultAsync<IWorkflowEvent | null, DatabaseError> => {
  if (!isWorkflowActionsEligible(submission.created)) return okAsync(null)

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
