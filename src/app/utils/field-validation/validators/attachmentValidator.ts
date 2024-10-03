import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'
import { BasicField } from 'shared/types'

import { MB } from '../../../../../shared/constants/file'
import {
  ParsedClearAttachmentResponseV3,
  ParsedClearFormFieldResponseV3,
} from '../../../../types/api'
import {
  IAttachmentFieldSchema,
  OmitUnusedValidatorProps,
} from '../../../../types/field'
import {
  ResponseValidator,
  ResponseValidatorConstructor,
} from '../../../../types/field/utils/validation'
import { ProcessedAttachmentResponse } from '../../../modules/submission/submission.types'

type AttachmentValidator = ResponseValidator<ProcessedAttachmentResponse>
type AttachmentValidatorConstructor = (
  attachmentField: OmitUnusedValidatorProps<IAttachmentFieldSchema>,
) => AttachmentValidator

/**
 * Returns a validator to check if answer is empty string.
 */
const attachmentAnswerValidator: AttachmentValidator = (response) => {
  const { answer } = response

  return answer.trim().length === 0
    ? left(`AttachmentValidator:\t Answer is an empty string`)
    : right(response)
}

/**
 * Returns a validator to check if attachment content is empty.
 */
const attachmentContentValidator: AttachmentValidator = (response) => {
  const { content } = response

  return content === undefined
    ? left(`AttachmentValidator:\t No attachment content`)
    : right(response)
}

/**
 * Returns a validation function to check if
 * attachment size is within the specified limit.
 */
const makeAttachmentSizeValidator: AttachmentValidatorConstructor =
  (attachmentField) => (response) => {
    const { attachmentSize } = attachmentField
    const byteSizeLimit = parseInt(attachmentSize) * MB

    // Check if the attachment content is empty
    if (response.content.byteLength === 0) {
      return left(`AttachmentValidator:\t File is empty.`)
    }

    return response.content.byteLength <= byteSizeLimit
      ? right(response)
      : left(`AttachmentValidator:\t File size more than limit`)
  }

/**
 * Returns a validation function for an attachment field when called.
 */
export const constructAttachmentValidator: AttachmentValidatorConstructor = (
  attachmentField,
) =>
  flow(
    attachmentAnswerValidator,
    chain(attachmentContentValidator),
    chain(makeAttachmentSizeValidator(attachmentField)),
  )

const isParsedClearAttachmentResponseV3: ResponseValidator<
  ParsedClearFormFieldResponseV3,
  ParsedClearAttachmentResponseV3
> = (response) => {
  if (response.fieldType !== BasicField.Attachment) {
    return left(
      `AttachmentValidatorV3.fieldTypeMismatch:\tfield type is not attachment`,
    )
  }
  return right(response)
}

/**
 * Returns a validator to check if answer is empty string.
 */
const attachmentFilenameNotEmptyValidator: ResponseValidator<
  ParsedClearAttachmentResponseV3
> = (response) => {
  const { filename } = response.answer

  return filename.trim().length === 0
    ? left(`AttachmentValidatorV3:\t Answer is an empty string`)
    : right(response)
}

/**
 * Returns a validator to check if attachment content is empty.
 */
const attachmentContentDefinedValidatorV3: ResponseValidator<
  ParsedClearAttachmentResponseV3
> = (response) => {
  const { content } = response.answer

  return content === undefined
    ? left(`AttachmentValidatorV3:\t No attachment content`)
    : right(response)
}

/**
 * Returns a validation function to check if
 * attachment size is within the specified limit.
 */
const makeAttachmentSizeValidatorV3: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<IAttachmentFieldSchema>,
  ParsedClearAttachmentResponseV3
> = (attachmentField) => (response) => {
  const { attachmentSize } = attachmentField
  const byteSizeLimit = parseInt(attachmentSize) * MB

  const { content } = response.answer

  // Check if the attachment content is empty
  if (content.byteLength === 0) {
    return left(`AttachmentValidatorV3:\t File is empty.`)
  }

  return content.byteLength <= byteSizeLimit
    ? right(response)
    : left(`AttachmentValidatorV3:\t File size more than limit`)
}

export const constructAttachmentFieldValidatorV3: ResponseValidatorConstructor<
  OmitUnusedValidatorProps<IAttachmentFieldSchema>,
  ParsedClearFormFieldResponseV3,
  ParsedClearAttachmentResponseV3
> = (attachmentField) =>
  flow(
    isParsedClearAttachmentResponseV3,
    chain(attachmentFilenameNotEmptyValidator),
    chain(attachmentContentDefinedValidatorV3),
    chain(makeAttachmentSizeValidatorV3(attachmentField)),
  )
