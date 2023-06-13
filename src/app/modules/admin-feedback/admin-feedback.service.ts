import mongoose from 'mongoose'
import { errAsync, ResultAsync } from 'neverthrow'

import { createLoggerWithLabel } from '../../config/logger'
import getAdminFeedbackModel from '../../models/admin_feedback.server.model'
import { DatabaseError } from '../core/core.errors'

import {
  IncorrectUserIdToAdminFeedbackError,
  MissingAdminFeedbackError,
} from './admin-feedback.errors'

const AdminFeedbackModel = getAdminFeedbackModel(mongoose)
const logger = createLoggerWithLabel(module)

/**
 * Inserts given admin feedback to the database.
 * @param userId the userId of the admin that provided the feedback
 * @param rating the feedback rating to insert (0 for thumbs down, 1 for thumbs up)
 * @param comment the feedback comment to insert if available
 * @returns ok(IAdminFeedbackSchema) if successfully inserted
 * @returns err(DatabaseError) on database error
 */
export const insertAdminFeedback = ({
  userId,
  rating,
  comment,
}: {
  userId: string
  rating: number
  comment?: string
}) => {
  return ResultAsync.fromPromise(
    AdminFeedbackModel.create({
      userId,
      rating,
      comment,
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
 * Will use previous value if comment or rating are not passed into method
 * @param feedbackId the id of the admin feedback to update
 * @param userId the id of the admin
 * @param comment the feedback comment to insert
 * @param rating the feedback rating to insert (0 for thumbs down, 1 for thumbs up)
 * @returns ok(IAdminFeedbackSchema) if successfully inserted
 * @returns err(MissingAdminFeedbackError) if feedback document with the same feedbackId and userId is not found
 * @returns err(DatabaseError) on database error
 */
export const updateAdminFeedback = ({
  feedbackId,
  userId,
  comment,
  rating,
}: {
  feedbackId: string
  userId: string
  comment?: string
  rating?: number
}) => {
  return ResultAsync.fromPromise(
    AdminFeedbackModel.findById(feedbackId),
    (error) => {
      logger.error({
        message: 'Database error when querying for  admin feedback document',
        meta: {
          action: 'updateAdminFeedback',
          feedbackId,
        },
        error,
      })

      return new DatabaseError('Admin feedback could not be found')
    },
  ).andThen((adminFeedback) => {
    // Ensure that adminFeedback exists
    if (!adminFeedback) return errAsync(new MissingAdminFeedbackError())

    // Ensure that the feedback belongs to the specified user
    if (adminFeedback.userId.toString() !== userId)
      return errAsync(new IncorrectUserIdToAdminFeedbackError())

    return ResultAsync.fromPromise(
      AdminFeedbackModel.findByIdAndUpdate(feedbackId, {
        comment: comment ? comment : adminFeedback?.comment,
        rating: rating === undefined ? adminFeedback?.rating : rating,
      }),
      (error) => {
        logger.error({
          message: 'Database error when updating admin feedback document',
          meta: {
            action: 'updateAdminFeedback',
            feedbackId,
          },
          error,
        })

        return new DatabaseError('Admin feedback could not be updated')
      },
    )
  })
}
