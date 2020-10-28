import mongoose from 'mongoose'
import { err, errAsync, ok, okAsync, Result, ResultAsync } from 'neverthrow'

import { createLoggerWithLabel } from '../../../config/logger'
import { IFormSchema, IPopulatedForm, Status } from '../../../types'
import getFormModel from '../../models/form.server.model'
import { ApplicationError, DatabaseError } from '../core/core.errors'

import {
  FormDeletedError,
  FormNotFoundError,
  PrivateFormError,
} from './form.errors'

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

/**
 * Method to ensure given form is available to the public.
 * @param form the form to check
 * @returns ok(true) if form is public
 * @returns err(FormDeletedError) if form has been deleted
 * @returns err(PrivateFormError) if form is private
 * @returns err(ApplicationError) if form has an invalid state
 */
export const isFormPublic = (
  form: IPopulatedForm,
): Result<
  true,
  FormNotFoundError | FormDeletedError | PrivateFormError | ApplicationError
> => {
  switch (form.status) {
    case Status.Public:
      return ok(true)
    case Status.Archived:
      return err(new FormDeletedError())
    case Status.Private:
      return err(new PrivateFormError(form.inactiveMessage))
    default:
      logger.error({
        message: 'Encountered invalid form status',
        meta: {
          action: 'isFormPublic',
          formStatus: form.status,
          form,
        },
      })
      return err(new ApplicationError())
  }
}
