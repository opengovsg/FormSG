import {
  AddressAnswerV4,
  CheckboxAnswerV4,
  ChildrenAnswerV4,
  RadioAnswerV4,
  SignatureAnswerV4,
  TableAnswerV4,
  VerifiableAnswerV4,
} from '@opengovsg/formsg-sdk'
import { FIELDS_TO_REJECT } from 'formsg-shared/constants/field/basic'
import { BasicField, FormField, FormFieldDto } from 'formsg-shared/types'
import { Either, isLeft, left, right } from 'fp-ts/lib/Either'
import { err, ok, Result } from 'neverthrow'

import {
  ParsedClearAttachmentAnswerV4,
  ParsedClearFormFieldResponseV3,
  ParsedClearFormFieldResponseV4,
} from '../../../types/api/submission'
import {
  FieldValidationSchema,
  ITableFieldSchema,
  OmitUnusedValidatorProps,
} from '../../../types/field'
import { ResponseValidator } from '../../../types/field/utils/validation'
import { createLoggerWithLabel } from '../../config/logger'
import {
  ValidateFieldError,
  ValidateFieldErrorV3,
  ValidateFieldErrorV4,
} from '../../modules/submission/submission.errors'
import {
  ProcessedAddressResponse,
  ProcessedAttachmentResponse,
  ProcessedCheckboxResponse,
  ProcessedChildrenResponse,
  ProcessedFieldResponse,
  ProcessedSingleAnswerResponse,
  ProcessedTableResponse,
} from '../../modules/submission/submission.types'

import {
  constructAddressFieldValidator,
  constructAttachmentFieldValidator,
  constructCheckboxFieldValidator,
  constructChildFieldValidator,
  constructFieldResponseValidatorV3,
  constructFieldResponseValidatorV4,
  constructOptionalAddressFieldValidator,
  constructSignatureFieldValidator,
  constructSingleAnswerValidator,
  constructTableFieldValidator,
} from './answerValidator.factory'
import {
  isGenericStringAnswerResponseV3,
  isGenericStringAnswerResponseV4,
  isProcessedAddressResponse,
  isProcessedAttachmentResponse,
  isProcessedCheckboxResponse,
  isProcessedChildResponse,
  isProcessedSignatureResponse,
  isProcessedSingleAnswerResponse,
  isProcessedTableResponse,
} from './field-validation.guards'
import {
  checkIsResponseChangedV3,
  checkIsResponseChangedV4,
} from './field-validation.utils'

const logger = createLoggerWithLabel(module)

/**
 * Verifies whether the response field type should be accepted
 * @param response The submitted response
 */
const isValidResponseFieldType = (fieldType: BasicField): boolean =>
  FIELDS_TO_REJECT.includes(fieldType) ? false : true

/**
 * Compares the response field type to the form field type
 * @param formField The form field to compare the response to
 * @param response The submitted response
 */
const doFieldTypesMatch = (
  formFieldType: BasicField,
  responseFieldType: BasicField,
): Either<string, undefined> => {
  return responseFieldType !== formFieldType
    ? left(
        `Response fieldType (${responseFieldType}) did not match field ${formFieldType}`,
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
    if (
      (response.filename && response.filename.trim() !== '') || // filename is defined only if there is a file uploaded for the response
      response.answer.trim() !== '' ||
      response.content
    ) {
      return true
    }
  } else if (isProcessedAddressResponse(response)) {
    if (!response.answerArray.every((row) => row === '')) {
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
  formField: FieldValidationSchema,
  response: ProcessedSingleAnswerResponse,
) => (formField.required && response.isVisible) || response.answer.trim() !== ''

const attachmentRequiresValidation = (
  formField: FieldValidationSchema,
  response: ProcessedAttachmentResponse,
) => (formField.required && response.isVisible) || response.answer.trim() !== ''

const checkboxRequiresValidation = (
  formField: FieldValidationSchema,
  response: ProcessedCheckboxResponse,
) =>
  (formField.required && response.isVisible) || response.answerArray.length > 0

const childrenRequiresValidation = (
  formField: FieldValidationSchema,
  response: ProcessedChildrenResponse,
) =>
  (formField.required && response.isVisible) ||
  response.answerArray.length > 0 ||
  (response?.childSubFieldsArray?.length ?? -1) > 0

const tableRequiresValidation = (
  formField: OmitUnusedValidatorProps<ITableFieldSchema>,
  response: ProcessedTableResponse,
) => {
  const { columns } = formField
  const { isVisible } = response
  const requiredVisible = columns.some((column) => column.required) && isVisible
  const answerPresent = !response.answerArray.every((row) =>
    row.every((elem) => elem === ''),
  )
  return requiredVisible || answerPresent
}

const addressRequiresValidation = (
  formField: FieldValidationSchema,
  response: ProcessedAddressResponse,
) => {
  return formField.required && response.isVisible
}

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
  formField: FieldValidationSchema | FormFieldDto<FormField>,
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
 * Helper function that applies validator to response,
 * logs if answer is invalid, and returns the result
 */
const validateResponseWithValidator = <T extends ProcessedFieldResponse>(
  validator: ResponseValidator<T>,
  formId: string,
  formField: FieldValidationSchema,
  response: T,
): Result<true, ValidateFieldError> => {
  const validEither = validator(response)
  if (isLeft(validEither)) {
    logInvalidAnswer(formId, formField, validEither.left)
    return err(new ValidateFieldError('Invalid answer submitted'))
  }
  return ok(true)
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
  formField: FieldValidationSchema,
  response: ProcessedFieldResponse,
): Result<true, ValidateFieldError> => {
  if (!isValidResponseFieldType(response.fieldType)) {
    return err(
      new ValidateFieldError(`Rejected field type "${response.fieldType}"`),
    )
  }

  const fieldTypeEither = doFieldTypesMatch(
    formField.fieldType,
    response.fieldType,
  )

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
      const validator = constructSingleAnswerValidator(formField)
      return validateResponseWithValidator(
        validator,
        formId,
        formField,
        response,
      )
    }
  } else if (isProcessedAttachmentResponse(response)) {
    if (attachmentRequiresValidation(formField, response)) {
      const validator = constructAttachmentFieldValidator(formField)
      return validateResponseWithValidator(
        validator,
        formId,
        formField,
        response,
      )
    }
  } else if (isProcessedCheckboxResponse(response)) {
    if (checkboxRequiresValidation(formField, response)) {
      const validator = constructCheckboxFieldValidator(formField)
      return validateResponseWithValidator(
        validator,
        formId,
        formField,
        response,
      )
    }
  } else if (isProcessedChildResponse(response)) {
    if (childrenRequiresValidation(formField, response)) {
      const validator = constructChildFieldValidator(formField)
      return validateResponseWithValidator(
        validator,
        formId,
        formField,
        response,
      )
    }
  } else if (
    isProcessedTableResponse(response) &&
    formField.fieldType === BasicField.Table
  ) {
    if (tableRequiresValidation(formField, response)) {
      const validator = constructTableFieldValidator(formField)
      return validateResponseWithValidator(
        validator,
        formId,
        formField,
        response,
      )
    }
  } else if (isProcessedAddressResponse(response)) {
    if (addressRequiresValidation(formField, response)) {
      const validator = constructAddressFieldValidator(formField)
      return validateResponseWithValidator(
        validator,
        formId,
        formField,
        response,
      )
    } else if (!formField.required) {
      //even if address is optional, still need to validate level/unit number
      const validator = constructOptionalAddressFieldValidator(formField)
      return validateResponseWithValidator(
        validator,
        formId,
        formField,
        response,
      )
    }
  } else if (isProcessedSignatureResponse(response)) {
    const validator = constructSignatureFieldValidator(formField)
    return validateResponseWithValidator(validator, formId, formField, response)
  } else {
    logInvalidAnswer(formId, formField, 'Invalid response shape')
    return err(new ValidateFieldError('Response has invalid shape'))
  }
  return ok(true)
}

/**
 * Checks if a response is present on a field that is hidden.
 * The expected behavior is that a response should no be present on a hidden field.
 * @param response to check for
 * @param isVisible whether the field is visible
 * @returns
 */
const isResponsePresentOnHiddenFieldV3 = ({
  formField,
  response,
  isVisible,
  formId,
}: {
  formField: FormFieldDto
  response: ParsedClearFormFieldResponseV3
  isVisible: boolean
  formId: string
}): Result<boolean, ValidateFieldErrorV3> => {
  if (isVisible) return ok(false)

  if (isGenericStringAnswerResponseV3(response)) {
    const answer = response.answer
    const isStringAnswerEmpty = answer.toString().trim() === ''
    return ok(!isStringAnswerEmpty)
  }
  switch (response.fieldType) {
    case BasicField.YesNo:
      return ok(response.answer.trim() !== '')
    case BasicField.Email:
    case BasicField.Mobile:
      return ok(
        response.answer.value.trim() !== '' ||
          (!!response.answer.signature &&
            response.answer.signature.trim() !== ''),
      )
    case BasicField.Radio:
      return ok(
        ('value' in response.answer && response.answer.value.trim() !== '') ||
          ('othersInput' in response.answer &&
            response.answer.othersInput.trim() !== ''),
      )
    case BasicField.Checkbox:
      return ok(response.answer.value?.length > 0)
    case BasicField.Table:
      return ok(
        !response.answer.every((rowObject) =>
          Object.values(rowObject).every((value) => value === ''),
        ),
      )
    case BasicField.Attachment:
      return ok(
        (response.answer.filename && response.answer.filename.trim() !== '') || // filename is defined only if there is a file uploaded for the response
          (response.answer.answer && response.answer.answer.trim() !== '') ||
          !!response.answer.content,
      )
    case BasicField.Children:
      return ok(
        (response.answer.child && response.answer.child.length > 1) ||
          (response.answer.child.length === 1 &&
            response.answer.child[0] &&
            response.answer.child[0].every((val) => val !== '')), // If only 1 element which has fields all empty, same as no child selected.
      )
    case BasicField.Address:
      return ok(
        response.answer.addressSubFields &&
          !Object.values(response.answer.addressSubFields).every(
            (value) => value === '',
          ),
      )
    case BasicField.Signature:
      return ok(response.answer.value.length > 0)
  }
  logInvalidAnswer(formId, formField, 'Invalid response shape')
  return err(new ValidateFieldErrorV3('Response has invalid shape'))
}

const isValidationRequiredV3 = ({
  formField,
  response,
  prevResponse,
  isVisible,
  formId,
}: {
  formField: FormFieldDto
  response: ParsedClearFormFieldResponseV3
  prevResponse?: ParsedClearFormFieldResponseV3
  isVisible: boolean
  formId: string
}): Result<boolean, ValidateFieldErrorV3> => {
  if (!checkIsResponseChangedV3({ response, prevResponse })) {
    return ok(false)
  }

  if (isGenericStringAnswerResponseV3(response)) {
    return ok(
      (formField.required && isVisible) ||
        response.answer.toString().trim() !== '',
    )
  }

  switch (response.fieldType) {
    case BasicField.YesNo:
      return ok(
        (formField.required && isVisible) || response.answer.trim() !== '',
      )
    case BasicField.Email:
    case BasicField.Mobile:
      return ok(
        (formField.required && isVisible) ||
          response.answer.value.trim() !== '' ||
          (!!response.answer.signature &&
            response.answer.signature.trim() !== ''),
      )
    case BasicField.Radio:
      return ok(
        (formField.required && isVisible) ||
          ('value' in response.answer && response.answer.value.trim() !== '') ||
          ('othersInput' in response.answer &&
            response.answer.othersInput.trim() !== ''),
      )
    case BasicField.Checkbox:
      return ok(
        (formField.required && isVisible) || response.answer.value.length > 0,
      )
    case BasicField.Table:
      if (formField.fieldType === BasicField.Table) {
        const { columns } = formField
        const isRequiredColumnsVisible =
          columns.some((column) => column.required) && isVisible
        const isAnswerPresent = !response.answer.every((row) =>
          Object.values(row).every((value) => value === ''),
        )
        return ok(isRequiredColumnsVisible || isAnswerPresent)
      }
      break
    case BasicField.Attachment: {
      const answerObjectDefined = !!response.answer
      const answerNotEmpty =
        !!response.answer.answer && response.answer.answer.trim() !== ''
      return ok(
        (formField.required && isVisible) ||
          (answerObjectDefined && answerNotEmpty),
      )
    }
    case BasicField.Children:
      return ok(
        (formField.required && isVisible) ||
          response.answer.child.length > 0 ||
          response.answer.childFields.length > 0,
      )
    case BasicField.Signature:
    case BasicField.Address: {
      const answerObjectDefined = !!response.answer
      return ok(answerObjectDefined) // address will require validation required or optional
    }
  }
  logInvalidAnswer(formId, formField, 'Invalid response shape')
  return err(new ValidateFieldErrorV3('Response has invalid shape'))
}

const validateResponseWithValidatorV3 = <
  T extends ParsedClearFormFieldResponseV3,
>(
  validator: ResponseValidator<T>,
  formId: string,
  formField: FormFieldDto,
  response: T,
): Result<true, ValidateFieldErrorV3> => {
  const validEither = validator(response)
  if (isLeft(validEither)) {
    logInvalidAnswer(formId, formField, validEither.left)
    return err(new ValidateFieldErrorV3('Invalid answer submitted'))
  }
  return ok(true)
}

export const validateFieldV3 = ({
  formId,
  formField,
  response,
  prevResponse,
  isVisible,
}: {
  formId: string
  formField: FormFieldDto
  response: ParsedClearFormFieldResponseV3
  prevResponse?: ParsedClearFormFieldResponseV3
  isVisible: boolean
}): Result<true, ValidateFieldErrorV3> => {
  if (!isValidResponseFieldType(response.fieldType)) {
    return err(
      new ValidateFieldErrorV3(`Rejected field type "${response.fieldType}"`),
    )
  }

  const fieldTypeEither = doFieldTypesMatch(
    formField.fieldType,
    response.fieldType,
  )

  if (isLeft(fieldTypeEither)) {
    return err(new ValidateFieldErrorV3(fieldTypeEither.left))
  }

  const isResponsePresentOnHiddenFieldV3Result =
    isResponsePresentOnHiddenFieldV3({ formField, response, isVisible, formId })

  if (isResponsePresentOnHiddenFieldV3Result.isErr()) {
    return err(isResponsePresentOnHiddenFieldV3Result.error)
  }

  if (isResponsePresentOnHiddenFieldV3Result.value) {
    return err(
      new ValidateFieldErrorV3(
        `Attempted to submit response on a hidden field`,
      ),
    )
  }

  const isValidationRequiredV3Result = isValidationRequiredV3({
    formField,
    response,
    prevResponse,
    isVisible,
    formId,
  })

  if (isValidationRequiredV3Result.isErr()) {
    return err(isValidationRequiredV3Result.error)
  }

  if (!isValidationRequiredV3Result.value) {
    return ok(true)
  }

  const validator = constructFieldResponseValidatorV3({
    formId,
    formField,
    isVisible,
  })
  return validateResponseWithValidatorV3(validator, formId, formField, response)
}

/**
 * V4 counterpart of {@link isResponsePresentOnHiddenFieldV3}. Rejects
 * submissions that carry a non-empty answer for a field that logic has hidden.
 */
const isResponsePresentOnHiddenFieldV4 = ({
  formField,
  response,
  isVisible,
  formId,
}: {
  formField: FormFieldDto
  response: ParsedClearFormFieldResponseV4
  isVisible: boolean
  formId: string
}): Result<boolean, ValidateFieldErrorV4> => {
  if (isVisible) return ok(false)

  if (isGenericStringAnswerResponseV4(response)) {
    const { value } = response.answer as { value: string }
    return ok(value.trim() !== '')
  }

  switch (response.fieldType) {
    case BasicField.YesNo: {
      const a = response.answer as { value: string }
      return ok(a.value.trim() !== '')
    }
    case BasicField.Email:
    case BasicField.Mobile: {
      const a = response.answer as VerifiableAnswerV4
      return ok(
        a.value.trim() !== '' || (!!a.signature && a.signature.trim() !== ''),
      )
    }
    case BasicField.Radio: {
      const a = response.answer as RadioAnswerV4
      return ok(a.value.trim() !== '')
    }
    case BasicField.Checkbox: {
      // Optional-chain: malformed bodies can send a null answer or omit
      // `value` entirely; treat as an empty selection rather than throwing.
      const a = response.answer as CheckboxAnswerV4 | null
      return ok(
        (a?.value?.length ?? 0) > 0 ||
          (typeof a?.othersInput === 'string' && a.othersInput.trim() !== ''),
      )
    }
    case BasicField.Table: {
      const a = response.answer as TableAnswerV4
      return ok(
        Object.values(a).some((row) =>
          Object.values(row.value).some((cell) => String(cell).trim() !== ''),
        ),
      )
    }
    case BasicField.Attachment: {
      const a = response.answer as ParsedClearAttachmentAnswerV4
      return ok(
        a.value.trim() !== '' ||
          (!!a.filename && a.filename.trim() !== '') ||
          (!!a.content && a.content.byteLength > 0),
      )
    }
    case BasicField.Children: {
      const a = response.answer as ChildrenAnswerV4
      return ok(
        Object.values(a).some((child) =>
          Object.values(child.value).some(
            (subField) => subField.value.trim() !== '',
          ),
        ),
      )
    }
    case BasicField.Address: {
      const a = response.answer as AddressAnswerV4
      return ok(
        Object.values(a).some((subField) => subField.value.trim() !== ''),
      )
    }
    case BasicField.Signature: {
      const a = response.answer as SignatureAnswerV4
      return ok(a.value.length > 0)
    }
  }
  logInvalidAnswer(formId, formField, 'Invalid response shape')
  return err(new ValidateFieldErrorV4('Response has invalid shape'))
}

/**
 * V4 counterpart of {@link isValidationRequiredV3}. Returns false when the
 * response is unchanged from a prior submission, or when a non-required
 * hidden/empty field has nothing to validate.
 */
const isValidationRequiredV4 = ({
  formField,
  response,
  prevResponse,
  isVisible,
  formId,
}: {
  formField: FormFieldDto
  response: ParsedClearFormFieldResponseV4
  prevResponse?: ParsedClearFormFieldResponseV4
  isVisible: boolean
  formId: string
}): Result<boolean, ValidateFieldErrorV4> => {
  if (!checkIsResponseChangedV4({ response, prevResponse })) {
    return ok(false)
  }

  const requiredAndVisible = formField.required && isVisible

  if (isGenericStringAnswerResponseV4(response)) {
    const { value } = response.answer as { value: string }
    return ok(requiredAndVisible || value.trim() !== '')
  }

  switch (response.fieldType) {
    case BasicField.YesNo: {
      const a = response.answer as { value: string }
      return ok(requiredAndVisible || a.value.trim() !== '')
    }
    case BasicField.Email:
    case BasicField.Mobile: {
      const a = response.answer as VerifiableAnswerV4
      return ok(
        requiredAndVisible ||
          a.value.trim() !== '' ||
          (!!a.signature && a.signature.trim() !== ''),
      )
    }
    case BasicField.Radio: {
      const a = response.answer as RadioAnswerV4
      return ok(requiredAndVisible || a.value.trim() !== '')
    }
    case BasicField.Checkbox: {
      // Optional-chain: malformed bodies can send a null answer or omit
      // `value` entirely; treat as an empty selection rather than throwing.
      const a = response.answer as CheckboxAnswerV4 | null
      return ok(
        requiredAndVisible ||
          (a?.value?.length ?? 0) > 0 ||
          (typeof a?.othersInput === 'string' && a.othersInput.trim() !== ''),
      )
    }
    case BasicField.Table:
      if (formField.fieldType === BasicField.Table) {
        const a = response.answer as TableAnswerV4
        const requiredColumnsVisible =
          formField.columns.some((column) => column.required) && isVisible
        const answerPresent = Object.values(a).some((row) =>
          Object.values(row.value).some((cell) => String(cell).trim() !== ''),
        )
        return ok(requiredColumnsVisible || answerPresent)
      }
      break
    case BasicField.Attachment: {
      const a = response.answer as ParsedClearAttachmentAnswerV4
      return ok(requiredAndVisible || (!!a.value && a.value.trim() !== ''))
    }
    case BasicField.Children: {
      const a = response.answer as ChildrenAnswerV4
      return ok(
        requiredAndVisible ||
          Object.values(a).some((child) =>
            Object.values(child.value).some(
              (subField) => subField.value.trim() !== '',
            ),
          ),
      )
    }
    case BasicField.Signature:
    case BasicField.Address:
      // Address requires validation regardless (optional address still
      // validates level/unit sub-fields). Signature likewise.
      return ok(!!response.answer)
  }
  logInvalidAnswer(formId, formField, 'Invalid response shape')
  return err(new ValidateFieldErrorV4('Response has invalid shape'))
}

const validateResponseWithValidatorV4 = (
  validator: ResponseValidator<ParsedClearFormFieldResponseV4>,
  formId: string,
  formField: FormFieldDto,
  response: ParsedClearFormFieldResponseV4,
): Result<true, ValidateFieldErrorV4> => {
  const validEither = validator(response)
  if (isLeft(validEither)) {
    logInvalidAnswer(formId, formField, validEither.left)
    return err(new ValidateFieldErrorV4('Invalid answer submitted'))
  }
  return ok(true)
}

export const validateFieldV4 = ({
  formId,
  formField,
  response,
  prevResponse,
  isVisible,
}: {
  formId: string
  formField: FormFieldDto
  response: ParsedClearFormFieldResponseV4
  prevResponse?: ParsedClearFormFieldResponseV4
  isVisible: boolean
}): Result<true, ValidateFieldErrorV4> => {
  const responseFieldType = response.fieldType as BasicField

  if (!isValidResponseFieldType(responseFieldType)) {
    return err(
      new ValidateFieldErrorV4(`Rejected field type "${responseFieldType}"`),
    )
  }

  const fieldTypeEither = doFieldTypesMatch(
    formField.fieldType,
    responseFieldType,
  )

  if (isLeft(fieldTypeEither)) {
    return err(new ValidateFieldErrorV4(fieldTypeEither.left))
  }

  const isResponsePresentOnHiddenFieldV4Result =
    isResponsePresentOnHiddenFieldV4({ formField, response, isVisible, formId })

  if (isResponsePresentOnHiddenFieldV4Result.isErr()) {
    return err(isResponsePresentOnHiddenFieldV4Result.error)
  }

  if (isResponsePresentOnHiddenFieldV4Result.value) {
    return err(
      new ValidateFieldErrorV4(
        `Attempted to submit response on a hidden field`,
      ),
    )
  }

  const isValidationRequiredV4Result = isValidationRequiredV4({
    formField,
    response,
    prevResponse,
    isVisible,
    formId,
  })

  if (isValidationRequiredV4Result.isErr()) {
    return err(isValidationRequiredV4Result.error)
  }

  if (!isValidationRequiredV4Result.value) {
    return ok(true)
  }

  const validator = constructFieldResponseValidatorV4({
    formId,
    formField,
    isVisible,
  })
  return validateResponseWithValidatorV4(validator, formId, formField, response)
}
