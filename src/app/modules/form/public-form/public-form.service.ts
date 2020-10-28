import mongoose from 'mongoose'
import { errAsync, ResultAsync } from 'neverthrow'

import { createLoggerWithLabel } from 'src/config/logger'

import getFormFeedbackModel from '../../../models/form_feedback.server.model'
import { DatabaseError } from '../../core/core.errors'
import { FormNotFoundError } from '../form.errors'

const FormFeedbackModel = getFormFeedbackModel(mongoose)
const logger = createLoggerWithLabel(module)

/**
 * Inserts given feedback to the database.
 * @param formId the formId to insert the feedback for
 * @param rating the feedback rating to insert
 * @param comment the comment accompanying the feedback
 * @returns ok(true) if successfully inserted
 * @returns err(DatabaseError) on database error
 */
export const insertFormFeedback = ({
  formId,
  rating,
  comment,
}: {
  formId: string
  rating: number
  comment: string
}): ResultAsync<true, FormNotFoundError | DatabaseError> => {
  if (!mongoose.Types.ObjectId.isValid(formId)) {
    return errAsync(new FormNotFoundError())
  }

  return ResultAsync.fromPromise(
    FormFeedbackModel.create({
      formId,
      rating,
      comment,
    }),
    (error) => {
      logger.error({
        message: 'Database error when creating form feedback document',
        meta: {
          action: 'submitFeedback',
          formId,
        },
        error,
      })

      return new DatabaseError('Form feedback could not be created')
    },
  ).map(() => true)
}
