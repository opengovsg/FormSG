import mongoose from 'mongoose'
import { err, errAsync, ok, okAsync, Result, ResultAsync } from 'neverthrow'

import {
  AuthType,
  IEmailFormModel,
  IEncryptedFormModel,
  IFormSchema,
  IPopulatedForm,
  ResponseMode,
  Status,
} from '@root/types'
import { createLoggerWithLabel } from '../../config/logger'
import getFormModel, {
  getEmailFormModel,
  getEncryptedFormModel,
} from '../../models/form.server.model'
import getSubmissionModel from '../../models/submission.server.model'
import { IntranetFactory } from '../../services/intranet/intranet.factory'
import {
  getMongoErrorMessage,
  transformMongoError,
} from '../../utils/handle-mongo-error'
import {
  ApplicationError,
  DatabaseError,
  PossibleDatabaseError,
} from '../core/core.errors'

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

/**
 * Deactivates a given form by its id
 * @param formId the id of the form to deactivate
 * @returns ok(true) if the form has been deactivated successfully
 * @returns err(PossibleDatabaseError) if an error occurred while trying to deactivate the form
 * @returns err(FormNotFoundError) if there is no form with the given formId
 */
export const deactivateForm = (
  formId: string,
): ResultAsync<IFormSchema, PossibleDatabaseError | FormNotFoundError> => {
  return ResultAsync.fromPromise(FormModel.deactivateById(formId), (error) => {
    logger.error({
      message: 'Error deactivating form by id',
      meta: {
        action: 'deactivateForm',
        form: formId,
      },
      error,
    })

    return transformMongoError(error)
  }).andThen((deactivatedForm) => {
    if (!deactivatedForm) {
      logger.error({
        message:
          'Attempted to deactivate form that cannot be found in the database',
        meta: {
          action: 'deactivateForm',
          form: formId,
        },
      })
      return errAsync(new FormNotFoundError())
    }
    // Successfully deactivated.
    return okAsync(deactivatedForm)
  })
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
 * Retrieves the specified form fields of the given formId
 * @param formId the id of the form
 * @param fields an array of field names to retrieve
 * @returns ok(form) if form exists
 * @returns err(FormNotFoundError) if the form or form admin does not exist
 * @returns err(DatabaseError) if error occurs whilst querying the database
 */
export const retrieveFormKeysById = (
  formId: string,
  fields: (keyof IPopulatedForm)[],
): ResultAsync<IPopulatedForm, FormNotFoundError | DatabaseError> => {
  if (!mongoose.Types.ObjectId.isValid(formId)) {
    return errAsync(new FormNotFoundError())
  }

  return ResultAsync.fromPromise(
    FormModel.getFullFormById(formId, fields),
    (error) => {
      logger.error({
        message: 'Error retrieving form from database',
        meta: {
          action: 'retrieveFormKeysById',
        },
        error,
      })
      return new DatabaseError()
    },
  ).andThen((result) =>
    result ? okAsync(result) : errAsync(new FormNotFoundError()),
  )
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
 * @returns err(ApplicationError) if form has an invalid state
 * @returns err(FormDeletedError) if form has been deleted
 * @returns err(PrivateFormError) if form is private, the message will be the form inactive message
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
 * @returns ok(form) if submission is allowed because the form has not reached limits
 * @returns err(PossibleDatabaseError) if an error occurred while querying the database for the specified form
 * @returns err(FormNotFoundError) if the form has exceeded the submission limits but could not be found and deactivated
 * @returns err(PrivateFormError) if the count of the form has been exceeded and the form has been deactivated
 */
export const checkFormSubmissionLimitAndDeactivateForm = (
  form: IPopulatedForm,
): ResultAsync<
  IPopulatedForm,
  PossibleDatabaseError | PrivateFormError | FormNotFoundError
> => {
  const logMeta = {
    action: 'checkFormSubmissionLimitAndDeactivateForm',
    formId: form._id,
  }
  const { submissionLimit } = form
  const formId = String(form._id)
  // Not using falsey check as submissionLimit === 0 can result in incorrectly
  // returning form without any actions.
  if (submissionLimit === null) return okAsync(form)

  return ResultAsync.fromPromise(
    SubmissionModel.countDocuments({
      form: formId,
    }).exec(),
    (error) => {
      logger.error({
        message: 'Error while counting submissions for form',
        meta: logMeta,
        error,
      })
      return transformMongoError(error)
    },
  ).andThen((currentCount) => {
    // Limit has not been hit yet, passthrough.
    if (currentCount < submissionLimit) return okAsync(form)

    logger.info({
      message: 'Form reached maximum submission count, deactivating.',
      meta: logMeta,
    })

    // Map success case back into error to display to client as form has been
    // deactivated.
    return deactivateForm(formId).andThen(() =>
      errAsync(
        new PrivateFormError(
          'Submission made after form submission limit was reached',
          form.title,
        ),
      ),
    )
  })
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

/**
 * Checks if a form is accessed from within intranet and sets the property accordingly
 * @param ip The ip of the request
 * @param publicFormView The form to check
 * @returns ok(PublicFormView) if the form is accessed from the internet
 * @returns err(ApplicationError) if an error occured while checking if the ip of the request is from the intranet
 */
export const checkIsIntranetFormAccess = (
  ip: string,
  form: IPopulatedForm,
): boolean => {
  return (
    IntranetFactory.isIntranetIp(ip)
      .andThen((isIntranetUser) => {
        // Warn if form is being accessed from within intranet
        // and the form has authentication set
        if (
          isIntranetUser &&
          [AuthType.SP, AuthType.CP, AuthType.MyInfo].includes(form.authType)
        ) {
          logger.warn({
            message:
              'Attempting to access SingPass, CorpPass or MyInfo form from intranet',
            meta: {
              action: 'checkIsIntranetFormAccess',
              formId: form._id,
            },
          })
        }
        return ok(isIntranetUser)
      })
      // This is required becausing the factory can throw missing feature error on initialization
      .unwrapOr(false)
  )
}
