import { Either, isLeft, left, right } from 'fp-ts/lib/Either'

import {
  ProcessedFieldResponse,
  ProcessedSingleAnswerResponse,
} from 'src/app/modules/submission/submission.types'
import { IField } from 'src/types/field/baseField'
import { ResponseValidator } from 'src/types/field/utils/validation'
import { FieldResponse } from 'src/types/response'

import { createLoggerWithLabel } from '../../../config/logger'
import {
  isLongTextField,
  isSectionField,
  isShortTextField,
} from '../../../types/field/utils/guards'
import { isProcessedSingleAnswerResponse } from '../../../types/response/guards'

import constructSectionValidator from './validators/sectionValidator'
import constructTextValidator from './validators/textValidator'
import { ALLOWED_VALIDATORS, FIELDS_TO_REJECT } from './config'
import FieldValidatorFactory from './FieldValidatorFactory.class'

const logger = createLoggerWithLabel(module)

const fieldValidatorFactory = new FieldValidatorFactory()

/**
 * Compares the response field type to the form field type
 * @param formField The form field to compare the response to
 * @param response The submitted response
 */
const isFieldTypeValid = (
  formField: IField,
  response: ProcessedFieldResponse,
): Either<string, undefined> => {
  return response.fieldType !== formField.fieldType
    ? left(`Response fieldType (${response.fieldType}) did not match`)
    : right(undefined)
}

const answerRequiresValidation = (
  formField: IField,
  response: ProcessedFieldResponse,
) => {
  return formField.required && response.isVisible
}

/**
 * Generic logging function for invalid fields.
 * Incomplete for table fields as the columnType is not logged.
 * @param {String} formId id of form, for logging
 * @param {Object} formField A form field from the database
 * @param {string} message Message to log
 * @throws {Error}
 */
const logInvalidAnswer = (
  formId: string,
  formField: IField,
  message: string,
) => {
  formField.fieldType
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
 * Factory function that returns a validation function for the form field.
 * @param formField A form field from a form object
 */
const constructValidationFn = (
  formField: IField,
): ResponseValidator<ProcessedSingleAnswerResponse> => {
  if (isSectionField(formField)) {
    return constructSectionValidator()
  } else if (isShortTextField(formField) || isLongTextField(formField)) {
    return constructTextValidator(formField)
  }
  return () => left('Unsupported field validation function')
}

/**
 * Single exported function that abstracts away the complexities
 * of field validation.
 * @param {String} formId id of form, for logging
 * @param {Object} formField A form field from the database
 * @param {Object} response A client-side response that is to be untrusted
 * @throws {Error}
 */
export default function validateField(
  formId: string,
  formField: IField,
  response: FieldResponse,
): void {
  if (FIELDS_TO_REJECT.includes(response.fieldType)) {
    throw new Error(`Rejected field type "${response.fieldType}"`)
  }

  // Validate that the form field type matches the response type
  const fieldTypeEither = isFieldTypeValid(formField, response)

  if (isLeft(fieldTypeEither)) {
    throw new Error('Invalid field type submitted')
  }

  if (
    answerRequiresValidation(formField, response) &&
    isProcessedSingleAnswerResponse(response)
  ) {
    switch (formField.fieldType) {
      /* eslint-disable no-case-declarations */
      // Migrated validators
      case 'section':
      case 'textfield': // short text
      case 'textarea': // long text
        const either = constructValidationFn(formField)(response)
        if (isLeft(either)) {
          logInvalidAnswer(formId, formField, 'Answer not allowed')
          throw new Error('Invalid answer submitted')
        }
        return
      // Fallback
      default:
        classBasedValidation(formId, formField, response)
      /* eslint-enable no-case-declarations */
    }
  } else {
    classBasedValidation(formId, formField, response)
  }
}

/**
 * Validate that the answers in the response adhere to the form field definition
 * using the deprecated class-based field validators.
 * @deprecated
 */
function classBasedValidation(
  formId: string,
  formField: IField,
  response: FieldResponse,
) {
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
