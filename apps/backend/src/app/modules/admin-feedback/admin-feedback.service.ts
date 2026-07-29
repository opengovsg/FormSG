import { isEmpty } from 'lodash'
import mongoose from 'mongoose'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'

import { createLoggerWithLabel } from '../../config/logger'
import getAdminFeedbackModel from '../../models/admin_feedback.server.model'
import { DatabaseError } from '../core/core.errors'

import { MissingAdminFeedbackError } from './admin-feedback.errors'

const AdminFeedbackModel = getAdminFeedbackModel(mongoose)
const logger = createLoggerWithLabel(module)

export type Feedback = {
  comment?: string
  rating?: number
  csat?: number
  ratingChanged?: boolean
}

/**
 * Inserts given admin feedback to the database.
 * @param userId the userId of the admin that provided the feedback
 * @param rating legacy thumbs value (0 for thumbs down, 1 for thumbs up)
 * @param csat the 1-5 CSAT score, mutually exclusive with `rating`
 * @param comment the feedback comment to insert if available
 * @returns ok(IAdminFeedbackSchema) if successfully inserted
 * @returns err(DatabaseError) on database error
 */
export const insertAdminFeedback = ({
  userId,
  rating,
  csat,
  comment,
  triggerSource,
  formId,
}: {
  userId: string
  rating?: number
  csat?: number
  comment?: string
  triggerSource?: string
  formId?: string
}) => {
  return ResultAsync.fromPromise(
    AdminFeedbackModel.create({
      userId,
      rating,
      csat,
      comment,
      triggerSource,
      formId,
    }),
    (error) => {
      logger.error({
        message: 'Database error when creating admin feedback document',
        meta: {
          action: 'insertAdminFeedback',
          userId,
        },
        error,
      })

      return new DatabaseError('Admin feedback could not be created')
    },
  )
}

/**
 * Updates admin feedback in the database.
 * Will not update previous value if comment or rating is undefined
 * @param feedbackId the id of the admin feedback to update
 * @param userId the id of the admin
 * @param comment the feedback comment to insert
 * @param rating legacy thumbs value (0 for thumbs down, 1 for thumbs up)
 * @param csat the 1-5 CSAT score, mutually exclusive with `rating`
 * @returns ok(IAdminFeedbackSchema) if successfully inserted
 * @returns err(MissingAdminFeedbackError) if feedback document with the same feedbackId and userId is not found
 * @returns err(DatabaseError) on database error
 */
export const updateAdminFeedback = ({
  feedbackId,
  userId,
  comment,
  rating,
  csat,
}: {
  feedbackId: string
  userId: string
  comment?: string
  rating?: number
  csat?: number
}) => {
  const scoreChanged = rating !== undefined || csat !== undefined
  const updateObj: Partial<Feedback> = {
    ...(comment !== undefined && { comment }),
    ...(rating !== undefined && { rating }),
    ...(csat !== undefined && { csat }),
    ...(scoreChanged && { ratingChanged: true }),
  }

  // if no update to be done, return ok
  if (isEmpty(updateObj)) return okAsync(true)

  return ResultAsync.fromPromise(
    AdminFeedbackModel.updateOne(
      { _id: feedbackId, userId: userId },
      { $set: updateObj },
      { runValidators: true },
    ),
    (error) => {
      logger.error({
        message: 'Database error when creating admin feedback document',
        meta: {
          action: 'updateAdminFeedback',
          feedbackId,
          userId,
        },
        error,
      })

      return new DatabaseError('Admin feedback could not be created')
    },
  ).andThen((mongoResult) => {
    if (!mongoResult.modifiedCount) {
      logger.error({
        message: 'Unable to retrieve feedback document',
        meta: {
          action: 'updateAdminFeedback',
          feedbackId,
          userId,
        },
      })
      return errAsync(new MissingAdminFeedbackError())
    }
    return okAsync(true)
  })
}
