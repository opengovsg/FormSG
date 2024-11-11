import { faker } from '@faker-js/faker'
import mongoose from 'mongoose'
import { err, errAsync, ok, okAsync, Result, ResultAsync } from 'neverthrow'
import { decodeBase64 } from 'tweetnacl-util'

import {
  BasicField,
  FormAuthType,
  FormField,
  FormFieldDto,
  FormResponseMode,
  FormStatus,
  PublicFormDto,
} from '../../../../shared/types'
import { encryptString } from '../../../../shared/utils/crypto'
import {
  IEmailFormModel,
  IEncryptedFormModel,
  IFormSchema,
  IMultirespondentFormModel,
  IPopulatedForm,
} from '../../../types'
import { createLoggerWithLabel } from '../../config/logger'
import getFormModel, {
  getEmailFormModel,
  getEncryptedFormModel,
  getMultirespondentFormModel,
} from '../../models/form.server.model'
import getFormWhitelistSubmitterIdsModel from '../../models/form_whitelist.server.model'
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
import { getMyInfoFieldOptions } from '../myinfo/myinfo.util'

import {
  FormDeletedError,
  FormNotFoundError,
  FormWhitelistSettingNotFoundError,
  PrivateFormError,
} from './form.errors'

const logger = createLoggerWithLabel(module)
const FormModel = getFormModel(mongoose)
const EmailFormModel = getEmailFormModel(mongoose)
const EncryptedFormModel = getEncryptedFormModel(mongoose)
const MultirespondentFormModel = getMultirespondentFormModel(mongoose)
const SubmissionModel = getSubmissionModel(mongoose)
const FormWhitelistSubmitterIdsModel =
  getFormWhitelistSubmitterIdsModel(mongoose)

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

export const checkHasRespondentNotWhitelistedFailure = (
  form: IPopulatedForm,
  submitterId: string,
): ResultAsync<boolean, ApplicationError> => {
  // check since whitelist is only for encrypt mode forms
  if (form.responseMode !== FormResponseMode.Encrypt) {
    return okAsync(false)
  }
  if (form.authType === FormAuthType.NIL) {
    return okAsync(false)
  }

  const { isWhitelistEnabled, encryptedWhitelistedSubmitterIds: whitelistId } =
    form.getWhitelistedSubmitterIds()

  if (!isWhitelistEnabled) {
    return okAsync(false)
  }
  if (isWhitelistEnabled && !whitelistId) {
    return errAsync(new FormWhitelistSettingNotFoundError())
  }

  const formPublicKey = form.publicKey
  if (!formPublicKey) {
    logger.error({
      message: 'Encrypt mode form does not have a public key',
      meta: {
        action: 'checkHasRespondentNotWhitelistedFailure',
        formId: form._id,
      },
    })
    return errAsync(
      new ApplicationError('Encrypt mode form does not have a public key'),
    )
  }
  return ResultAsync.fromPromise(
    FormWhitelistSubmitterIdsModel.findEncryptionPropertiesById(
      whitelistId,
    ).then(({ myPublicKey, myPrivateKey, nonce }) => {
      const myKeyPair = {
        publicKey: myPublicKey,
        privateKey: myPrivateKey,
      }
      const usedNonce = decodeBase64(nonce)

      const upperCaseSubmitterId = submitterId.toUpperCase()

      const submitterIdForLookup = encryptString(
        upperCaseSubmitterId,
        formPublicKey,
        usedNonce,
        myKeyPair,
      ).cipherText

      return FormWhitelistSubmitterIdsModel.checkIfSubmitterIdIsWhitelisted(
        whitelistId,
        submitterIdForLookup,
      ).then((isWhitelisted) => !isWhitelisted)
    }),
    (err) => {
      logger.error({
        message: 'Error while checking if submitterId is whitelisted',
        meta: {
          action: 'checkHasRespondentNotWhitelistedFailure',
          formId: form._id,
          err,
        },
      })
      return new ApplicationError(
        'Error while checking if submitterId is whitelisted',
      )
    },
  )
}

/**
 * Verify that if the form is a single submission per submitterId form, the submitterId does not exist.
 * @param form the form to check for
 * @param submitterId submitterId of current submitter
 * @returns ok(true) if the form is not a single submission per submitterId form or the submitterId has not responded before
 * @returns ok(false) if the form is a single submission per submitterId form and submitterId has already responded
 * @returns err(ApplicationError) if the submitterId is not found
 * @returns err(PossibleDatabaseError) if an error occurred while querying the database to check for previous responses by same submitterId
 */
export const checkHasSingleSubmissionValidationFailure = (
  form: PublicFormDto,
  submitterId: string,
): ResultAsync<boolean, ApplicationError | PossibleDatabaseError> => {
  const logMeta = {
    action: 'checkHasSingleSubmissionValidationFailure',
    formId: form._id,
  }
  if (!form.isSingleSubmission) {
    return okAsync(false)
  }

  if (!submitterId) {
    return errAsync(
      new ApplicationError(
        'Cannot find submitterId which is required for single submission per submitterId form',
      ),
    )
  }
  return ResultAsync.fromPromise(
    SubmissionModel.exists({
      form: form._id,
      submitterId,
    }),
    (error) => {
      logger.error({
        message: 'Error while counting submissions for form',
        meta: logMeta,
        error,
      })
      return transformMongoError(error)
    },
  ).andThen((result) => okAsync(result !== null))
}

export const getFormModelByResponseMode = (
  responseMode: FormResponseMode,
): IEmailFormModel | IEncryptedFormModel | IMultirespondentFormModel => {
  switch (responseMode) {
    case FormResponseMode.Email:
      return EmailFormModel
    case FormResponseMode.Encrypt:
      return EncryptedFormModel
    case FormResponseMode.Multirespondent:
      return MultirespondentFormModel
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

export const createSingleSampleSubmissionAnswer = (field: FormFieldDto) => {
  // Prefill dropdown MyInfo field options for faking
  const { fieldType } = field
  if (fieldType === BasicField.Dropdown && field.myInfo) {
    field.fieldOptions = getMyInfoFieldOptions(field.myInfo.attr)
  }

  switch (fieldType) {
    case BasicField.LongText: {
      const sampleValue = faker.lorem.text()
      return {
        id: field._id,
        question: field.title,
        answer: sampleValue,
        fieldType: field.fieldType,
      }
    }

    case BasicField.ShortText: {
      const sampleValue = faker.lorem.words()
      return {
        id: field._id,
        question: field.title,
        answer: sampleValue,
        fieldType: field.fieldType,
      }
    }

    case BasicField.Radio:
    case BasicField.Dropdown: {
      const sampleValue =
        field.fieldOptions.length === 0
          ? ''
          : faker.helpers.arrayElement(field.fieldOptions)
      return {
        id: field._id,
        question: field.title,
        answer: sampleValue,
        fieldType: field.fieldType,
      }
    }
    case BasicField.Email: {
      const sampleValue = faker.internet.email()
      return {
        id: field._id,
        question: field.title,
        answer: sampleValue,
        fieldType: field.fieldType,
      }
    }

    case BasicField.Decimal: {
      const sampleValue = faker.number.float({ precision: 0.1 }).toString()
      return {
        id: field._id,
        question: field.title,
        answer: sampleValue,
        fieldType: field.fieldType,
      }
    }

    case BasicField.Number: {
      const sampleValue = faker.number.int(100).toString()
      return {
        id: field._id,
        question: field.title,
        answer: sampleValue,
        fieldType: field.fieldType,
      }
    }

    case BasicField.Mobile: {
      const sampleValue = faker.phone.number('+659#######')
      return {
        id: field._id,
        question: field.title,
        answer: sampleValue,
        fieldType: field.fieldType,
      }
    }

    case BasicField.HomeNo: {
      const sampleValue = faker.phone.number('+656#######')
      return {
        id: field._id,
        question: field.title,
        answer: sampleValue,
        fieldType: field.fieldType,
      }
    }

    case BasicField.YesNo: {
      const sampleValue = faker.helpers.arrayElement(['Yes', 'No'])
      return {
        id: field._id,
        question: field.title,
        answer: sampleValue,
        fieldType: field.fieldType,
      }
    }

    case BasicField.Rating: {
      const sampleValue = faker.number
        .int({ min: 1, max: field.ratingOptions.steps })
        .toString()
      return {
        id: field._id,
        question: field.title,
        answer: sampleValue,
        fieldType: field.fieldType,
      }
    }

    case BasicField.Attachment: {
      return {
        id: field._id,
        question: field.title,
        answer: 'attachmentFileName',
        fieldType: field.fieldType,
      }
    }

    case BasicField.Table: {
      const noOfTableRows = field.minimumRows || 0
      const noOfTableCols = field.columns.length
      const tableSampleValue = []
      for (let row = 0; row < noOfTableRows; row++) {
        const rowSampleValue = []
        for (let col = 0; col < noOfTableCols; col++) {
          rowSampleValue.push(`row${row + 1}col${col + 1}`)
        }
        tableSampleValue.push(rowSampleValue)
      }
      return {
        id: field._id,
        question: field.title,
        answerArray: tableSampleValue,
        fieldType: field.fieldType,
      }
    }
    case BasicField.Checkbox: {
      const sampleValue =
        field.fieldOptions.length === 0
          ? []
          : faker.helpers.arrayElements(field.fieldOptions)
      return {
        id: field._id,
        question: field.title,
        answerArray: sampleValue,
        fieldType: field.fieldType,
      }
    }
    case BasicField.Date: {
      const sampleValue = faker.date.anytime().toLocaleDateString('en-SG', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
      return {
        id: field._id,
        question: field.title,
        answer: sampleValue,
        fieldType: field.fieldType,
      }
    }

    case BasicField.Nric: {
      return {
        id: field._id,
        question: field.title,
        answer: faker.helpers.replaceSymbols('S9######A'),
        fieldType: field.fieldType,
      }
    }
    case BasicField.Uen: {
      return {
        id: field._id,
        question: field.title,
        answer: faker.helpers.replaceSymbols('#########A'),
        fieldType: field.fieldType,
      }
    }
    case BasicField.Section:
    case BasicField.Statement:
    case BasicField.Image:
    case BasicField.CountryRegion:
    case BasicField.Children:
      return {
        id: field._id,
        question: field.title,
        answer: null,
        fieldType: field.fieldType,
      }
    default: {
      // Force TS to emit an error if the cases above are not exhaustive
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const exhaustiveCheck: never = fieldType
      break
    }
  }
}

export const createSampleSubmissionResponses = (
  formFields: FormFieldDto<FormField>[],
) => {
  const sampleData: Record<
    string,
    ReturnType<typeof createSingleSampleSubmissionAnswer>
  > = {}
  formFields.forEach((field) => {
    const answer = createSingleSampleSubmissionAnswer(field)
    if (!answer) return
    sampleData[field._id] = answer
  })
  return sampleData
}
