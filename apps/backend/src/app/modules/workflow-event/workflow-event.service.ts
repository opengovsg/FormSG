import {
  DateString,
  WorkflowEventDto,
  WorkflowEventType,
} from 'formsg-shared/types'
import { isWorkflowActionsEligible } from 'formsg-shared/utils/workflow-actions'
import mongoose from 'mongoose'
import { okAsync, ResultAsync } from 'neverthrow'

import { IWorkflowEventSchema } from '../../../types'
import { createLoggerWithLabel } from '../../config/logger'
import getWorkflowEventModel from '../../models/workflow_event.server.model'
import { getMongoErrorMessage } from '../../utils/handle-mongo-error'
import { DatabaseError } from '../core/core.errors'

const WorkflowEventModel = getWorkflowEventModel(mongoose)
const logger = createLoggerWithLabel(module)

/**
 * Records a workflow action against a submission. Submissions created before
 * the workflow actions cutoff are not logged.
 * @returns ok(event) when recorded
 * @returns ok(null) when the submission is before the cutoff
 * @returns err(DatabaseError) if the write fails
 */
export const recordWorkflowEvent = ({
  submission,
  type,
  actor,
  stepNumber,
  emails,
}: {
  submission: { _id?: unknown; form: unknown; created?: Date }
  type: WorkflowEventType
  actor: { _id?: unknown; email: string }
  stepNumber: number
  emails: string[]
}): ResultAsync<IWorkflowEventSchema | null, DatabaseError> => {
  if (!isWorkflowActionsEligible(submission.created)) return okAsync(null)

  return ResultAsync.fromPromise(
    WorkflowEventModel.create({
      type,
      formId: submission.form,
      submissionId: submission._id,
      actorId: actor._id,
      actorEmail: actor.email,
      stepNumber,
      emails,
    }),
    (error) => {
      logger.error({
        message: 'Error recording workflow event',
        meta: {
          action: 'recordWorkflowEvent',
          submissionId: String(submission._id),
          type,
        },
        error,
      })
      return new DatabaseError(getMongoErrorMessage(error))
    },
  )
}

/**
 * @returns ok(events) for the submission, oldest first
 * @returns err(DatabaseError) if the query fails
 */
export const getWorkflowEvents = ({
  formId,
  submissionId,
}: {
  formId: string
  submissionId: string
}): ResultAsync<WorkflowEventDto[], DatabaseError> =>
  ResultAsync.fromPromise(
    WorkflowEventModel.find({ formId, submissionId })
      .sort({ created: 1 })
      .lean()
      .exec(),
    (error) => {
      logger.error({
        message: 'Error retrieving workflow events',
        meta: { action: 'getWorkflowEvents', formId, submissionId },
        error,
      })
      return new DatabaseError(getMongoErrorMessage(error))
    },
  ).map((events) =>
    events.map((event) => ({
      type: event.type,
      formId: String(event.formId),
      submissionId: String(event.submissionId),
      actorEmail: event.actorEmail,
      stepNumber: event.stepNumber,
      emails: event.emails,
      created: (event.created as Date).toISOString() as DateString,
    })),
  )

/**
 * @returns ok(emails) added to the step through Reassign, lowercased and deduped
 * @returns err(DatabaseError) if the query fails
 */
export const getAddedAssignees = ({
  submissionId,
  stepNumber,
}: {
  submissionId: string
  stepNumber: number
}): ResultAsync<string[], DatabaseError> =>
  ResultAsync.fromPromise(
    WorkflowEventModel.find({
      submissionId,
      stepNumber,
      type: WorkflowEventType.AssigneesAdded,
    })
      .lean()
      .exec(),
    (error) => {
      logger.error({
        message: 'Error retrieving added assignees',
        meta: { action: 'getAddedAssignees', submissionId, stepNumber },
        error,
      })
      return new DatabaseError(getMongoErrorMessage(error))
    },
  ).map((events) =>
    Array.from(
      new Set(
        events.flatMap(({ emails }) =>
          emails.map((email) => email.toLowerCase()),
        ),
      ),
    ),
  )
