import { isEmpty } from 'lodash'
import moment from 'moment-timezone'
import mongoose from 'mongoose'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'

import {
  FormFeedbackMetaDto,
  ProcessedFeedbackMeta,
} from '../../../../shared/types'
import { IFormFeedbackSchema } from '../../../types'
import { createLoggerWithLabel } from '../../config/logger'
import getAdminFeedbackModel from '../../models/admin_feedback.server.model'
import getFormFeedbackModel from '../../models/form_feedback.server.model'
import { getMongoErrorMessage } from '../../utils/handle-mongo-error'
import { DatabaseError } from '../core/core.errors'

import {
  DuplicateFeedbackSubmissionError,
  MissingAdminFeedbackError,
} from './feedback.errors'

const FormFeedbackModel = getFormFeedbackModel(mongoose)

const AdminFeedbackModel = getAdminFeedbackModel(mongoose)
const logger = createLoggerWithLabel(module)

/**
 * Returns number of form feedback for given form id.
 *
 * @param formId the form id to retrieve feedback counts for
 * @returns ok(form feedback count)
 * @returns err(DatabaseError) if database query errors
 */
export const getFormFeedbackCount = (
  formId: string,
): ResultAsync<number, DatabaseError> => {
  return ResultAsync.fromPromise(
    FormFeedbackModel.countDocuments({ formId }).exec(),
    (error) => {
      logger.error({
        message: 'Error counting feedback documents from database',
        meta: {
          action: 'getFormFeedbackCount',
          formId,
        },
        error,
      })

      return new DatabaseError(getMongoErrorMessage(error))
    },
  )
}

/**
 * Retrieves form feedback stream.
 * @param formId the formId of form to retrieve feedback for
 * @returns form feedback stream
 */
export const getFormFeedbackStream = (
  formId: string,
): mongoose.QueryCursor<IFormFeedbackSchema> => {
  return FormFeedbackModel.getFeedbackCursorByFormId(formId)
}

/**
 * Returned processed object containing count of feedback, average rating, and
 * list of feedback.
 * @param formId the form to retrieve feedback for
 * @returns ok(feedback response object) on success
 * @returns err(DatabaseError) if database error occurs during query
 */
export const getFormFeedbacks = (
  formId: string,
): ResultAsync<FormFeedbackMetaDto, DatabaseError> => {
  return ResultAsync.fromPromise(
    FormFeedbackModel.find({ formId }).sort({ created: 1 }).exec(),
    (error) => {
      logger.error({
        message: 'Error retrieving feedback documents from database',
        meta: {
          action: 'getFormFeedbacks',
          formId,
        },
        error,
      })

      return new DatabaseError(getMongoErrorMessage(error))
    },
  ).map((feedbacks) => {
    if (isEmpty(feedbacks)) {
      return {
        count: 0,
        feedback: [],
      }
    }

    // Process retrieved feedback.
    const totalFeedbackCount = feedbacks.length
    let totalRating = 0
    const processedFeedback = feedbacks.map((fb, idx) => {
      totalRating += fb.rating
      const response: ProcessedFeedbackMeta = {
        // 1-based indexing.
        index: idx + 1,
        timestamp: moment(fb.created).valueOf(),
        rating: fb.rating,
        comment: fb.comment ?? '',
        date: moment(fb.created).tz('Asia/Singapore').format('D MMM YYYY'),
        dateShort: moment(fb.created).tz('Asia/Singapore').format('D MMM'),
      }

      return response
    })
    const averageRating = (totalRating / totalFeedbackCount).toFixed(2)
    return {
      average: averageRating,
      count: totalFeedbackCount,
      feedback: processedFeedback,
    }
  })
}

/**
 * Checks if a feedback for the form with formId and submission with submissionId
 * already exists.
 *
 * @param formId the form id of the form that the feedback is for
 * @param submissionId the submission id of the form submission that the feedback is for
 *
 * @returns ok(true) if there is no existing feedback for the form with formId and submission
 * with submissionId
 * @returns err(InvalidSubmissionIdError) if submissionId does not exist amongst all the form submissions
 * @returns err(DatabaseError) if database query errors
 */
export const hasNoPreviousFeedback = (
  submissionId: string,
): ResultAsync<true, DuplicateFeedbackSubmissionError | DatabaseError> =>
  ResultAsync.fromPromise(
    FormFeedbackModel.exists({
      submissionId: submissionId,
    }),
    (error) => {
      logger.error({
        message: 'Error finding feedback documents from database',
        meta: {
          action: 'hasNoPreviousFeedback',
          submissionId,
        },
        error,
      })

      return new DatabaseError(getMongoErrorMessage(error))
    },
  ).andThen((hasPreviousFeedback) => {
    if (hasPreviousFeedback) {
      return errAsync(new DuplicateFeedbackSubmissionError())
    }
    return okAsync(true as const)
  })

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
 * @param comment the feedback comment to insert
 * @param rating the feedback rating to insert (0 for thumbs down, 1 for thumbs up)
 * @returns ok(IAdminFeedbackSchema) if successfully inserted
 * @returns err(DatabaseError) on database error
 */
export const updateAdminFeedback = ({
  feedbackId,
  comment,
  rating,
}: {
  feedbackId: string
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
    if (!adminFeedback) return errAsync(new MissingAdminFeedbackError())

    return ResultAsync.fromPromise(
      AdminFeedbackModel.updateAdminFeedback(
        feedbackId,
        comment ? comment : adminFeedback?.comment,
        rating ? rating : adminFeedback?.rating,
      ),
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
