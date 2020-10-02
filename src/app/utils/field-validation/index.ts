import { Either, isLeft, left, right } from 'fp-ts/lib/Either'

import { ProcessedFieldResponse } from 'src/app/modules/submission/submission.types'
import { IFieldSchema } from 'src/types/field/baseField'

import { createLoggerWithLabel } from '../../../config/logger'

import sectionValidator from './validators/sectionValidator'
import { FIELDS_TO_REJECT } from './config'
// Deprecated
import FieldValidatorFactory from './FieldValidatorFactory.class'

const logger = createLoggerWithLabel(module)

const fieldValidatorFactory = new FieldValidatorFactory()

/**
 * Compares the response field type to the form field type
 * @param formField The form field to compare the response to
 * @param response The submitted response
 */
const isFieldTypeValid = (
  formField: IFieldSchema,
  response: ProcessedFieldResponse,
): Either<string, boolean> => {
  return response.fieldType !== formField.fieldType
    ? left(`Response fieldType (${response.fieldType}) did not match`)
    : right(true)
}

/**
 * Generic logging function for invalid fields
 * @param {String} formId id of form, for logging
 * @param {Object} formField A form field from the database
 * @param {string} message Message to log
 * @throws {Error}
 */
const logInvalidAnswer = (
  formId: string,
  formField: IFieldSchema,
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
 * Single function that abstracts away the complexity of field validation
 * and factory methods away from the controller
 * @param {String} formId id of form, for logging
 * @param {Object} formField A form field from the database
 * @param {Object} response A client-side response that is to be untrusted
 * @throws {Error}
 */
export default function validateField(
  formId: string,
  formField: IFieldSchema,
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

  // Validate that the answers in the response adhere to the form field
  switch (formField.fieldType) {
    // New validators
    case 'section':
      // eslint-disable-next-line no-case-declarations
      const either = sectionValidator(response)
      if (isLeft(either)) {
        logInvalidAnswer(formId, formField, 'Answer not allowed')
        throw new Error('Invalid answer submitted')
      }
      return
    // TODO: deprecated, remove once all form fields have been migrated
    default:
      // eslint-disable-next-line no-case-declarations
      const fieldValidator = fieldValidatorFactory.createFieldValidator(
        formId,
        formField,
        response,
      )

      if (!fieldValidator.isAnswerValid()) {
        throw new Error('Invalid answer submitted')
      }
      return
  }
}
