import mongoose from 'mongoose'
import { ResultAsync } from 'neverthrow'

import { createLoggerWithLabel } from '../../../config/logger'
import getFormFeedbackModel from '../../models/form_feedback.server.model'
import { getMongoErrorMessage } from '../../utils/handle-mongo-error'
import { DatabaseError } from '../core/core.errors'

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
