import { VIRUS_SCANNER_SUBMISSION_VERSION } from 'formsg-shared/constants'
import { okAsync, ResultAsync } from 'neverthrow'

import { ParsedClearFormFieldResponsesV4 } from '../../../../../types/api'
import { aws as AwsConfig } from '../../../../config/config'
import { createLoggerWithLabel } from '../../../../config/logger'
import { AttachmentUploadError } from '../../submission.errors'
import { uploadAttachments } from '../../submission.service'
import { AttachmentMetadata } from '../../submission.types'
import {
  getEncryptedAttachmentsMapFromAttachmentsMap,
  isAttachmentResponseV4,
} from '../../submission.utils'

import { V1ContentMappingError } from './submission-snapshot.errors'

const logger = createLoggerWithLabel(module)

/**
 * The attachment plaintext the submit path already holds: it has been through
 * the virus scanner on the way in, so the V1 copy is made from it rather than
 * scanned again or re-encrypted from the submission-key ciphertext.
 */
const collectScannedPlaintext = (
  responses: ParsedClearFormFieldResponsesV4,
): Record<string, Buffer> => {
  const plaintext: Record<string, Buffer> = {}
  for (const id of Object.keys(responses)) {
    const response = responses[id]
    if (isAttachmentResponseV4(response)) {
      plaintext[id] = response.answer.content
    }
  }
  return plaintext
}

/**
 * Produces the form-key-encrypted copy of every attachment on a submission and
 * uploads it to the V1 attachment bucket, returning the object key per field.
 *
 * The native objects cannot serve a V1 consumer: they are encrypted to the
 * submission key, which a V1 payload never carries, and they are
 * content-addressed over those bytes, so they can be neither re-keyed nor
 * reused.
 */
export const produceV1AttachmentCopies = ({
  formId,
  responses,
  formPublicKey,
  logMeta,
}: {
  formId: string
  responses: ParsedClearFormFieldResponsesV4
  formPublicKey: string
  logMeta: Record<string, unknown>
}): ResultAsync<
  AttachmentMetadata,
  AttachmentUploadError | V1ContentMappingError
> => {
  const plaintext = collectScannedPlaintext(responses)
  if (Object.keys(plaintext).length === 0) {
    return okAsync(new Map<string, string>())
  }

  return ResultAsync.fromPromise(
    getEncryptedAttachmentsMapFromAttachmentsMap(
      plaintext,
      formPublicKey,
      // The storage-mode submission version, not the MRF wire constant: the
      // encryption class is selected as `version < 3`, and only the storage
      // class produces an envelope an unmodified V1 consumer can open. The
      // MRF constant advances, so deriving this from it would silently move
      // the copy onto cryptoV3.
      VIRUS_SCANNER_SUBMISSION_VERSION,
    ),
    (error) => {
      logger.error({
        message: 'Failed to produce the V1 copies of submission attachments',
        meta: { action: 'produceV1AttachmentCopies', ...logMeta },
        error: error as Error,
      })
      return new V1ContentMappingError(undefined, error)
    },
  ).andThen((encryptedCopies) =>
    uploadAttachments(
      formId,
      encryptedCopies,
      AwsConfig.submissionHistoryV1AttachmentS3Bucket,
    ),
  )
}
