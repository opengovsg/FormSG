import { Either, isLeft, left, right } from 'fp-ts/lib/Either'

import { ProcessedFieldResponse } from 'src/app/modules/submission/submission.types'
import { IField } from 'src/types/field/baseField'
import { ResponseValidator } from 'src/types/field/utils/validation'

import { createLoggerWithLabel } from '../../../config/logger'
import {
  isLongTextField,
  isSectionField,
  isShortTextField,
} from '../../../types/field/utils/guards'

import constructSectionValidator from './validators/sectionValidator'
import constructTextValidator from './validators/textValidator'
import { FIELDS_TO_REJECT } from './config'
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
const constructValidationFn = (formField: IField): ResponseValidator => {
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
  response: ProcessedFieldResponse,
): void {
  if (FIELDS_TO_REJECT.includes(response.fieldType)) {
    throw new Error(`Rejected field type "${response.fieldType}"`)
  }

  // Validate that the form field type matches the response type
  const fieldTypeEither = isFieldTypeValid(formField, response)

  if (isLeft(fieldTypeEither)) {
    throw new Error('Invalid field type submitted')
  }

  // Validate that the answers in the response adhere to the form field definition
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
    // TODO: Remove default branch once all form fields have been migrated
    default:
      const fieldValidator = fieldValidatorFactory.createFieldValidator(
        formId,
        formField,
        response,
      )

      if (!fieldValidator.isAnswerValid()) {
        throw new Error('Invalid answer submitted')
      }
      return
    /* eslint-enable no-case-declarations */
  }
}
