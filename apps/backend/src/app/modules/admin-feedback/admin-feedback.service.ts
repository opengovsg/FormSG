import { isEmpty } from 'lodash'
import mongoose from 'mongoose'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'

import { createLoggerWithLabel } from '../../config/logger'
import getAdminFeedbackModel from '../../models/admin_feedback.server.model'
import { DatabaseError } from '../core/core.errors'

import { MissingAdminFeedbackError } from './admin-feedback.errors'

const AdminFeedbackModel = getAdminFeedbackModel(mongoose)
const logger = createLoggerWithLabel(module)

/**
 * Inserts given admin feedback to the database.
 * @param userId the userId of the admin that provided the feedback
 * @param csat the 1-5 star satisfaction score to insert
 * @param comment the feedback comment to insert if available
 * @returns ok(IAdminFeedbackSchema) if successfully inserted
 * @returns err(DatabaseError) on database error
 */
export const insertAdminFeedback = ({
  userId,
  csat,
  comment,
  triggerSource,
  formId,
}: {
  userId: string
  csat: number
  comment?: string
  triggerSource?: string
  formId?: string
}) => {
  return ResultAsync.fromPromise(
    AdminFeedbackModel.create({
      userId,
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
 * Will not update previous value if comment or csat is undefined
 * @param feedbackId the id of the admin feedback to update
 * @param userId the id of the admin
 * @param comment the feedback comment to insert
 * @param csat the 1-5 star satisfaction score to insert
 * @returns ok(IAdminFeedbackSchema) if successfully inserted
 * @returns err(MissingAdminFeedbackError) if feedback document with the same feedbackId and userId is not found
 * @returns err(DatabaseError) on database error
 */
export const updateAdminFeedback = ({
  feedbackId,
  userId,
  comment,
  csat,
}: {
  feedbackId: string
  userId: string
  comment?: string
  csat?: number
}) => {
  const updateObj: Record<string, unknown> = {}
  if (comment !== undefined) updateObj.comment = comment
  if (csat !== undefined) {
    updateObj.csat = csat
    // `ratingChanged` is a pre-existing flag; it now reflects a `csat` edit.
    updateObj.ratingChanged = true
  }

  // if no update to be done, return ok
  if (isEmpty(updateObj)) return okAsync(true)

  return ResultAsync.fromPromise(
    AdminFeedbackModel.updateOne(
      { _id: feedbackId, userId: userId },
      { $set: updateObj },
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
