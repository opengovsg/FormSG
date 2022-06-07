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
import getFormFeedbackModel from '../../models/form_feedback.server.model'
import { getMongoErrorMessage } from '../../utils/handle-mongo-error'
import { DatabaseError } from '../core/core.errors'

import { DuplicateFeedbackSubmissionError } from './feedback.error'

const FormFeedbackModel = getFormFeedbackModel(mongoose)
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
  formId: string,
  submissionId: string,
): ResultAsync<true, DuplicateFeedbackSubmissionError | DatabaseError> =>
  ResultAsync.fromPromise(
    FormFeedbackModel.exists({
      formId: formId,
      submissionId: submissionId,
    }),
    (error) => {
      logger.error({
        message: 'Error finding feedback documents from database',
        meta: {
          action: 'hasNoPreviousFeedback',
          formId,
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
