import { chain, left, right } from 'fp-ts/lib/Either'
import { flow } from 'fp-ts/lib/function'

import { ProcessedAttachmentResponse } from 'src/app/modules/submission/submission.types'
import { IAttachmentField } from 'src/types/field'
import { ResponseValidator } from 'src/types/field/utils/validation'

const MILLION = 1000000

type AttachmentValidator = ResponseValidator<ProcessedAttachmentResponse>
type AttachmentValidatorConstructor = (
  attachmentField: IAttachmentField,
) => AttachmentValidator

const attachmentAnswerValidator: AttachmentValidator = (response) => {
  const { answer } = response

  return answer.trim().length === 0
    ? left(`AttachmentValidator:\t Answer is an empty string`)
    : right(response)
}

const attachmentContentValidator: AttachmentValidator = (response) => {
  const { content } = response

  return content === undefined
    ? left(`AttachmentValidator:\t No attachment content`)
    : right(response)
}

const makeAttachmentSizeValidator: AttachmentValidatorConstructor = (
  attachmentField,
) => (response) => {
  const { attachmentSize } = attachmentField
  const byteSizeLimit = parseInt(attachmentSize) * MILLION
  return response.content.byteLength < byteSizeLimit
    ? right(response)
    : left(`AttachmentValidator:\t File size more than limit`)
}

export const constructAttachmentValidator: AttachmentValidatorConstructor = (
  attachmentField,
) =>
  flow(
    attachmentAnswerValidator,
    chain(attachmentContentValidator),
    chain(makeAttachmentSizeValidator(attachmentField)),
  )
