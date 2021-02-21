import { Either, isLeft, left, right } from 'fp-ts/lib/Either'
import { err, ok, Result } from 'neverthrow'

import {
  ProcessedFieldResponse,
  ProcessedSingleAnswerResponse,
} from '../../../app/modules/submission/submission.types'
import { createLoggerWithLabel } from '../../../config/logger'
import { IFieldSchema } from '../../../types/field/baseField'
import { BasicField } from '../../../types/field/fieldTypes'
import { FieldResponse } from '../../../types/response'
import { ValidateFieldError } from '../../modules/submission/submission.errors'

import { ALLOWED_VALIDATORS, FIELDS_TO_REJECT } from './config'
import {
  isProcessedAttachmentResponse,
  isProcessedCheckboxResponse,
  isProcessedSingleAnswerResponse,
  isProcessedTableResponse,
} from './field-validation.guards'
import fieldValidatorFactory from './FieldValidatorFactory.class' // Deprecated
import { constructSingleAnswerValidator } from './singleAnswerValidator.factory'

const logger = createLoggerWithLabel(module)

/**
 * Verifies whether the response field type should be accepted
 * @param response The submitted response
 */
const isValidResponseFieldType = (response: ProcessedFieldResponse): boolean =>
  FIELDS_TO_REJECT.includes(response.fieldType) ? false : true

/**
 * Compares the response field type to the form field type
 * @param formField The form field to compare the response to
 * @param response The submitted response
 */
const doFieldTypesMatch = (
  formField: IFieldSchema,
  response: ProcessedFieldResponse,
): Either<string, undefined> => {
  return response.fieldType !== formField.fieldType
    ? left(
        `Response fieldType (${response.fieldType}) did not match field ${formField.fieldType}`,
      )
    : right(undefined)
}

/**
 * Returns true if response appears on a hidden field.
 * This may happen if a submission is made programatically to try and bypass form logic.
 * @param response The submitted response
 */
const isResponsePresentOnHiddenField = (
  response: ProcessedFieldResponse,
): boolean => {
  if (response.isVisible) return false
  if (isProcessedSingleAnswerResponse(response)) {
    if (response.answer.trim() !== '') {
      return true
    }
  } else if (isProcessedCheckboxResponse(response)) {
    if (response.answerArray.length > 0) {
      return true
    }
  } else if (isProcessedTableResponse(response)) {
    if (
      !response.answerArray.every((row) => row.every((elem) => elem === ''))
    ) {
      return true
    }
  } else if (isProcessedAttachmentResponse(response)) {
    if (response.filename.trim() !== '') {
      return true
    }
  }
  return false
}

/**
 * Determines whether a response requires validation. A required field
 * may not require an answer if it is not visible due to logic. However,
 * if an answer is presented, it should be validated.
 * @param formField The form field to compare the response to
 * @param response The submitted response
 */
const singleAnswerRequiresValidation = (
  formField: IFieldSchema,
  response: ProcessedSingleAnswerResponse,
) => (formField.required && response.isVisible) || response.answer.trim() !== ''

/**
 * Generic logging function for invalid fields.
 * Incomplete for table fields as the columnType is not logged.
 * @param formId id of form, for logging
 * @param formField A form field from the database
 * @param message Message to log
 * @throws {Error}
 */
const logInvalidAnswer = (
  formId: string,
  formField: IFieldSchema,
  message: string,
) => {
  logger.error({
    message: `Invalid answer: ${message}`,
    meta: {
      action: 'InvalidAnswer',
      formId,
      fieldId: String(formField._id),
      fieldType: formField.fieldType,
    },
  })
}

/**
 * Single exported function that abstracts away the complexities
 * of field validation.
 * @param formId id of form, for logging
 * @param formField A form field from the database
 * @param response A client-side response that is to be untrusted
 * @throws
 */
export const validateField = (
  formId: string,
  formField: IFieldSchema,
  response: ProcessedFieldResponse,
): Result<true, ValidateFieldError> => {
  if (!isValidResponseFieldType(response)) {
    return err(
      new ValidateFieldError(`Rejected field type "${response.fieldType}"`),
    )
  }

  const fieldTypeEither = doFieldTypesMatch(formField, response)

  if (isLeft(fieldTypeEither)) {
    return err(new ValidateFieldError(fieldTypeEither.left))
  }

  if (isResponsePresentOnHiddenField(response)) {
    return err(
      new ValidateFieldError(`Attempted to submit response on a hidden field`),
    )
  }

  if (isProcessedSingleAnswerResponse(response)) {
    if (singleAnswerRequiresValidation(formField, response)) {
      switch (formField.fieldType) {
        // Migrated validators
        case BasicField.Section:
        case BasicField.ShortText:
        case BasicField.LongText:
        case BasicField.Nric:
        case BasicField.HomeNo:
        case BasicField.Radio:
        case BasicField.Rating:
        case BasicField.Email:
        case BasicField.Date:
        case BasicField.Dropdown:
        case BasicField.Decimal:
        case BasicField.Mobile: {
          const validator = constructSingleAnswerValidator(formField)
          const validEither = validator(response)
          if (isLeft(validEither)) {
            logInvalidAnswer(formId, formField, validEither.left)
            return err(new ValidateFieldError('Invalid answer submitted'))
          }
          return ok(true)
        }
        // Fallback for un-migrated single answer validators
        default: {
          return classBasedValidation(formId, formField, response)
        }
      }
    }
  } else if (
    isProcessedCheckboxResponse(response) ||
    isProcessedTableResponse(response)
  ) {
    // fallback for processed checkbox/table responses
    return classBasedValidation(formId, formField, response)
  } else {
    logInvalidAnswer(formId, formField, 'Invalid response shape')
    return err(new ValidateFieldError('Response has invalid shape'))
  }
  return ok(true)
}

/**
 * Validate that the answers in the response adhere to the form field definition
 * using the deprecated class-based field validators.
 * @deprecated
 */
const classBasedValidation = (
  formId: string,
  formField: IFieldSchema,
  response: FieldResponse,
): Result<true, ValidateFieldError> => {
  const fieldValidator = fieldValidatorFactory.createFieldValidator(
    formId,
    formField,
    response,
  )

  if (!fieldValidator.isAnswerValid()) {
    // TODO: Remove after soft launch of validation. Should throw Error for all validators
    // fieldValidator.constructor.name only returns the name of the class if code is not minified!
    if (ALLOWED_VALIDATORS.includes(fieldValidator.constructor.name)) {
      return err(new ValidateFieldError('Invalid answer submitted'))
    }
  }
  return ok(true)
}
