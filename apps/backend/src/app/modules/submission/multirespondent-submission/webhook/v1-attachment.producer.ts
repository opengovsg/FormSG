import { VIRUS_SCANNER_SUBMISSION_VERSION } from 'formsg-shared/constants'
import { okAsync, ResultAsync } from 'neverthrow'

import { ParsedClearFormFieldResponsesV4 } from '../../../../../types/api'
import { aws as AwsConfig } from '../../../../config/config'
import { createLoggerWithLabel } from '../../../../config/logger'
import { V1_ATTACHMENT_KEY_PREFIX } from '../../../webhook/webhook.constants'
import { AttachmentUploadError } from '../../submission.errors'
import {
  AttachmentUploadTarget,
  uploadAttachments,
} from '../../submission.service'
import { AttachmentMetadata } from '../../submission.types'
import {
  getEncryptedAttachmentsMapFromAttachmentsMap,
  isAttachmentResponseV4,
} from '../../submission.utils'

import { V1ContentMappingError } from './submission-snapshot.errors'

const logger = createLoggerWithLabel(module)

const v1AttachmentUploadTarget = (
  useSharedAttachmentBucket: boolean,
): AttachmentUploadTarget =>
  useSharedAttachmentBucket
    ? {
        bucket: AwsConfig.attachmentS3Bucket,
        keyPrefix: V1_ATTACHMENT_KEY_PREFIX,
      }
    : {
        bucket: AwsConfig.submissionHistoryV1AttachmentS3Bucket,
        keyPrefix: '',
      }

/**
 * Extracts all attachments responses from the given responses.
 */
const getFieldIdToAttachmentsMap = (
  responses: ParsedClearFormFieldResponsesV4,
): Record<string, Buffer> => {
  const attachmentsMap: Record<string, Buffer> = {}

  for (const [fieldId, response] of Object.entries(responses)) {
    if (isAttachmentResponseV4(response)) {
      attachmentsMap[fieldId] = response.answer.content
    }
  }
  return attachmentsMap
}

/**
 * Produces the form public key encrypted copy of every attachment from the given responses and
 * uploads it to the shared attachment bucket under V1_ATTACHMENT_KEY_PREFIX, or to the legacy V1
 * attachment bucket unprefixed when useSharedAttachmentBucket is off.
 *
 * @returns ok(AttachmentMetadata) A map of field id to the s3 key of the uploaded attachment
 */
export const encryptAndUploadAttachmentInV1 = ({
  formId,
  responses,
  formPublicKey,
  useSharedAttachmentBucket,
  logMeta,
}: {
  formId: string
  responses: ParsedClearFormFieldResponsesV4
  formPublicKey: string
  useSharedAttachmentBucket: boolean
  logMeta: Record<string, unknown>
}): ResultAsync<
  AttachmentMetadata,
  AttachmentUploadError | V1ContentMappingError
> => {
  const fieldIdToAttachmentsMap = getFieldIdToAttachmentsMap(responses)
  if (Object.keys(fieldIdToAttachmentsMap).length === 0) {
    return okAsync(new Map<string, string>())
  }

  return ResultAsync.fromPromise(
    getEncryptedAttachmentsMapFromAttachmentsMap(
      fieldIdToAttachmentsMap,
      formPublicKey,
      // RATIONALE: We provide same version as storage mode version,
      // so that cryptoV1 is used for encryption which is same as storage mode.
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
  ).andThen((v1EncryptedAttachmentsData) =>
    uploadAttachments(
      formId,
      v1EncryptedAttachmentsData,
      v1AttachmentUploadTarget(useSharedAttachmentBucket),
    ),
  )
}
