import mongoose from 'mongoose'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'

import { createLoggerWithLabel } from '../../../config/logger'
import { IFormSchema, IPopulatedForm } from '../../../types'
import getFormModel from '../../models/form.server.model'
import { DatabaseError } from '../core/core.errors'

import { FormNotFoundError } from './form.errors'

const logger = createLoggerWithLabel(module)
const FormModel = getFormModel(mongoose)

export const deactivateForm = async (
  formId: string,
): Promise<IFormSchema | null> => {
  return FormModel.deactivateById(formId)
}

export const retrieveFullFormById = (
  formId: string,
): ResultAsync<IPopulatedForm, FormNotFoundError | DatabaseError> => {
  if (!mongoose.Types.ObjectId.isValid(formId)) {
    return errAsync(new FormNotFoundError())
  }

  return ResultAsync.fromPromise(FormModel.getFullFormById(formId), (error) => {
    logger.error({
      message: 'Error retrieving form from database',
      meta: {
        action: 'retrieveFullFormById',
      },
      error,
    })
    return new DatabaseError()
  }).andThen((result) => {
    // Either form not found, or form admin is not in the database anymore.
    // The latter is less likely, but guarding it just in case. Treat as form
    // not found since form has no ownership.
    if (!result || !result.admin) {
      return errAsync(new FormNotFoundError())
    }

    return okAsync(result)
  })
}
