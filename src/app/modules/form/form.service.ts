import { faker } from '@faker-js/faker'
import mongoose from 'mongoose'
import { err, errAsync, ok, okAsync, Result, ResultAsync } from 'neverthrow'

import {
  BasicField,
  FormAuthType,
  FormField,
  FormFieldDto,
  FormResponseMode,
  FormStatus,
} from '../../../../shared/types'
import {
  IEmailFormModel,
  IEncryptedFormModel,
  IFormDocument,
  IFormSchema,
  IPopulatedForm,
} from '../../../types'
import { createLoggerWithLabel } from '../../config/logger'
import getFormModel, {
  getEmailFormModel,
  getEncryptedFormModel,
} from '../../models/form.server.model'
import getSubmissionModel from '../../models/submission.server.model'
import {
  getMongoErrorMessage,
  transformMongoError,
} from '../../utils/handle-mongo-error'
import {
  ApplicationError,
  DatabaseError,
  PossibleDatabaseError,
} from '../core/core.errors'
import { IntranetService } from '../intranet/intranet.service'

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
    case FormStatus.Public:
      return ok(true)
    case FormStatus.Archived:
      return err(new FormDeletedError())
    case FormStatus.Private:
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
  responseMode: FormResponseMode,
): IEmailFormModel | IEncryptedFormModel => {
  switch (responseMode) {
    case FormResponseMode.Email:
      return EmailFormModel
    case FormResponseMode.Encrypt:
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
  const isIntranetUser = IntranetService.isIntranetIp(ip)
  // Warn if form is being accessed from within intranet
  // and the form has authentication set
  if (
    isIntranetUser &&
    [
      FormAuthType.SP,
      FormAuthType.CP,
      FormAuthType.MyInfo,
      FormAuthType.SGID,
      FormAuthType.SGID_MyInfo,
    ].includes(form.authType)
  ) {
    logger.warn({
      message:
        'Attempting to access SingPass, CorpPass, MyInfo, SGID or SGID MyInfo form from intranet',
      meta: {
        action: 'checkIsIntranetFormAccess',
        formId: form._id,
      },
    })
  }
  return isIntranetUser
}

export const retrievePublicFormsWithSmsVerification = (
  userId: string,
): ResultAsync<IFormDocument[], PossibleDatabaseError> => {
  return ResultAsync.fromPromise(
    FormModel.retrievePublicFormsWithSmsVerification(userId),
    (error) => {
      logger.error({
        message: 'Error retrieving public forms with sms verifications',
        meta: {
          action: 'retrievePublicFormsWithSmsVerification',
          userId: userId,
        },
        error,
      })

      return transformMongoError(error)
    },
  ).andThen((forms) => {
    if (!forms.length) {
      // NOTE: Warn here because this is supposed to be called to generate a list of form titles
      // When the admin has used up their sms verification limit.
      // It is not an error because there are potential cases where the admins privatize their form after.
      logger.warn({
        message:
          'Attempted to retrieve public forms with sms verifications but none was found',
        meta: {
          action: 'retrievePublicFormsWithSmsVerification',
          userId: userId,
        },
      })
    }
    return okAsync(forms)
  })
}

export const createSingleSampleSubmissionAnswer = (field: FormFieldDto) => {
  let sampleValue = null
  let noOfTableRows
  let noOfTableCols
  const tableSampleValue = []
  switch (field.fieldType) {
    case BasicField.LongText:
      sampleValue = faker.lorem.text()
      break
    case BasicField.ShortText:
      sampleValue = faker.lorem.words()
      break
    case BasicField.Radio:
    case BasicField.Dropdown:
      sampleValue = faker.helpers.arrayElement(field.fieldOptions)
      break
    case BasicField.Email:
      sampleValue = faker.internet.email()
      break
    case BasicField.Decimal:
      sampleValue = faker.number.float({ precision: 0.1 }).toString()
      break
    case BasicField.Number:
      sampleValue = faker.number.int(100).toString()
      break
    case BasicField.Mobile:
      sampleValue = faker.phone.number('+659#######')
      break
    case BasicField.HomeNo:
      sampleValue = faker.phone.number('+656#######')
      break
    case BasicField.YesNo:
      sampleValue = faker.helpers.arrayElement(['Yes', 'No'])
      break
    case BasicField.Rating:
      sampleValue = faker.number
        .int({ min: 1, max: field.ratingOptions.steps })
        .toString()
      break
    case BasicField.Attachment:
      sampleValue = 'attachmentFileName'
      break
    case BasicField.Table:
      noOfTableRows = field.minimumRows
      noOfTableCols = field.columns.length
      for (let row = 0; row < noOfTableRows; row++) {
        const rowSampleValue = []
        for (let col = 0; col < noOfTableCols; col++) {
          rowSampleValue.push(`row${row + 1}col${col + 1}`)
        }
        tableSampleValue.push(rowSampleValue)
      }
      sampleValue = tableSampleValue
      break
    case BasicField.Checkbox:
      sampleValue = faker.helpers.arrayElements(field.fieldOptions)
      break
    case BasicField.Date:
      sampleValue = faker.date.anytime().toLocaleDateString('en-SG', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
      break
    case BasicField.Nric:
      sampleValue = faker.helpers.replaceSymbols('S9######A')
      break
    case BasicField.Uen:
      sampleValue = faker.helpers.replaceSymbols('#########A')
      break
    default:
      break
  }
  return {
    id: field._id,
    question: field.title,
    answer: sampleValue,
    fieldType: field.fieldType,
  }
}

export const createSampleSubmissionResponses = (
  formFields: FormFieldDto<FormField>[],
) => {
  const sampleData: Record<string, any> = {}
  formFields.forEach((field) => {
    const answer = createSingleSampleSubmissionAnswer(field)
    if (!answer) return
    sampleData[field._id] = answer
  })
  return sampleData
}
