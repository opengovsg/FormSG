import { Either, isLeft, left, right } from 'fp-ts/lib/Either'

import {
  ProcessedFieldResponse,
  ProcessedSingleAnswerResponse,
} from '../../../app/modules/submission/submission.types'
import { createLoggerWithLabel } from '../../../config/logger'
import { IField } from '../../../types/field/baseField'
import { BasicField } from '../../../types/field/fieldTypes'
import {
  isLongTextField,
  isSectionField,
  isShortTextField,
} from '../../../types/field/utils/guards'
import { ResponseValidator } from '../../../types/field/utils/validation'
import { FieldResponse } from '../../../types/response'
import { isProcessedSingleAnswerResponse } from '../../../types/response/guards'

import { constructSectionValidator } from './validators/sectionValidator'
import constructTextValidator from './validators/textValidator'
import { ALLOWED_VALIDATORS, FIELDS_TO_REJECT } from './config'
import fieldValidatorFactory from './FieldValidatorFactory.class'

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
  formField: IField,
  response: ProcessedFieldResponse,
): Either<string, undefined> => {
  return response.fieldType !== formField.fieldType
    ? left(
        `Response fieldType (${response.fieldType}) did not match field ${formField.fieldType}`,
      )
    : right(undefined)
}

/**
 * Determines whether a response requires validation. A required field
 * may not require an answer if it is not visible due to logic. However,
 * if an answer is presented, it should be validated.
 * @param formField The form field to compare the response to
 * @param response The submitted response
 */
const singleAnswerRequiresValidation = (
  formField: IField,
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
  formField: IField,
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
 * Constructs a validation function from a form field. Only meant to
 * validate single answer responses.
 * @param formField A form field from a form object
 */
const constructSingleAnswerValidator = (
  formField: IField,
): ResponseValidator<ProcessedSingleAnswerResponse> => {
  if (isSectionField(formField)) {
    return constructSectionValidator()
  } else if (isShortTextField(formField) || isLongTextField(formField)) {
    return constructTextValidator(formField)
  }
  return () => left('Unsupported field type')
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
  formField: IField,
  response: FieldResponse,
): void => {
  if (!isValidResponseFieldType(response)) {
    throw new Error(`Rejected field type "${response.fieldType}"`)
  }

  const fieldTypeEither = doFieldTypesMatch(formField, response)

  if (isLeft(fieldTypeEither)) {
    throw new Error(fieldTypeEither.left)
  }

  if (isProcessedSingleAnswerResponse(response)) {
    if (singleAnswerRequiresValidation(formField, response)) {
      switch (formField.fieldType) {
        // Migrated validators
        case BasicField.Section:
        case BasicField.ShortText:
        case BasicField.LongText: {
          const validator = constructSingleAnswerValidator(formField)
          const validEither = validator(response)
          if (isLeft(validEither)) {
            logInvalidAnswer(formId, formField, validEither.left)
            throw new Error('Invalid answer submitted')
          }
          return
        }
        // Fallback for un-migrated single answer validators
        default: {
          classBasedValidation(formId, formField, response)
        }
      }
    }
  } else {
    // fallback for processed checkbox/table/attachment responses
    classBasedValidation(formId, formField, response)
  }
}

/**
 * Validate that the answers in the response adhere to the form field definition
 * using the deprecated class-based field validators.
 * @deprecated
 */
const classBasedValidation = (
  formId: string,
  formField: IField,
  response: FieldResponse,
) => {
  const fieldValidator = fieldValidatorFactory.createFieldValidator(
    formId,
    formField,
    response,
  )

  if (!fieldValidator.isAnswerValid()) {
    // TODO: Remove after soft launch of validation. Should throw Error for all validators
    // fieldValidator.constructor.name only returns the name of the class if code is not minified!
    if (ALLOWED_VALIDATORS.includes(fieldValidator.constructor.name)) {
      throw new Error('Invalid answer submitted')
    }
  }
}
