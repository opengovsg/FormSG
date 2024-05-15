import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'

import { MB } from '../../../../../shared/constants/file'
import {
  IAttachmentFieldSchema,
  OmitUnusedValidatorProps,
} from '../../../../types/field'
import { ResponseValidator } from '../../../../types/field/utils/validation'
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
