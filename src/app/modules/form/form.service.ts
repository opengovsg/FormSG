import mongoose from 'mongoose'
import { err, errAsync, ok, okAsync, Result, ResultAsync } from 'neverthrow'

import { createLoggerWithLabel } from '../../../config/logger'
import {
  IEmailFormModel,
  IEncryptedFormModel,
  IFormSchema,
  IPopulatedForm,
  ResponseMode,
  Status,
} from '../../../types'
import getFormModel, {
  getEmailFormModel,
  getEncryptedFormModel,
} from '../../models/form.server.model'
import getSubmissionModel from '../../models/submission.server.model'
import { getMongoErrorMessage } from '../../utils/handle-mongo-error'
import { ApplicationError, DatabaseError } from '../core/core.errors'

import {
  FormDeletedError,
  FormNotFoundError,
  PrivateFormError,
} from './form.errors'

const logger = createLoggerWithLabel(module)
const FormModel = getFormModel(mongoose)
const EmailFormModel = getEmailFormModel(mongoose)
const EncryptedFormModel = getEncryptedFormModel(mongoose)
const SubmissionModel = getSubmissionModel(mongoose)

export const deactivateForm = async (
  formId: string,
): Promise<IFormSchema | null> => {
  return FormModel.deactivateById(formId)
}

/**
 * Retrieves the fully populated form of the given formId.
 * @param formId the id of the form to retrieve
 * @returns ok(fully populated form) if form exists
 * @returns err(FormNotFoundError) if the form or form admin does not exist
 * @returns err(DatabaseError) if error occurs whilst querying the database
 */
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
 * Retrieves (non-populated) form document of the given formId.
 * @param formId the id of the form to retrieve
 * @returns ok(form) if form exists
 * @returns err(FormNotFoundError) if the form or form admin does not exist
 * @returns err(DatabaseError) if error occurs whilst querying the database
 */
export const retrieveFormById = (
  formId: string,
): ResultAsync<IFormSchema, FormNotFoundError | DatabaseError> => {
  if (!mongoose.Types.ObjectId.isValid(formId)) {
    return errAsync(new FormNotFoundError())
  }

  return ResultAsync.fromPromise(FormModel.findById(formId).exec(), (error) => {
    logger.error({
      message: 'Error retrieving form from database',
      meta: {
        action: 'retrieveFormById',
        formId,
      },
      error,
    })
    return new DatabaseError(getMongoErrorMessage(error))
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
 * @returns err(PrivateFormError) if form is private, the message will be the form inactive message
 * @returns err(ApplicationError) if form has an invalid state
 */
export const isFormPublic = (
  form: IPopulatedForm,
): Result<true, FormDeletedError | PrivateFormError | ApplicationError> => {
  if (!form.status) {
    return err(new ApplicationError())
  }

  switch (form.status) {
    case Status.Public:
      return ok(true)
    case Status.Archived:
      return err(new FormDeletedError())
    case Status.Private:
      return err(new PrivateFormError(form.inactiveMessage, form.title))
  }
}

/**
 * Method to check whether a form has reached submission limits, and deactivate the form if necessary
 * @param form the form to check
 * @returns ok(true) if submission is allowed because the form has not reached limits
 * @returns ok(false) if submission is not allowed because the form has reached limits
 */
export const checkFormSubmissionLimitAndDeactivateForm = async (
  form: IPopulatedForm,
): Promise<Result<true, PrivateFormError>> => {
  if (form.submissionLimit !== null) {
    const currentCount = await SubmissionModel.countDocuments({
      form: form._id,
    }).exec()

    if (currentCount >= form.submissionLimit) {
      logger.info({
        message: 'Form reached maximum submission count, deactivating.',
        meta: {
          form: form._id,
          action: 'checkFormSubmissionLimitAndDeactivate',
        },
      })
      await deactivateForm(form._id)
      return err(new PrivateFormError(form.inactiveMessage, form.title))
    } else {
      return ok(true)
    }
  } else {
    return ok(true)
  }
}

export const getFormModelByResponseMode = (
  responseMode: ResponseMode,
): IEmailFormModel | IEncryptedFormModel => {
  switch (responseMode) {
    case ResponseMode.Email:
      return EmailFormModel
    case ResponseMode.Encrypt:
      return EncryptedFormModel
  }
}
