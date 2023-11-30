import { StorageModeSubmissionDto } from '~shared/types'

import formsgSdk from '~utils/formSdk'
import { ApiService } from '~services/ApiService'

import { augmentDecryptedResponses } from '~features/admin-form/responses/ResponsesPage/storage/utils/augmentDecryptedResponses'
import { processDecryptedContent } from '~features/admin-form/responses/ResponsesPage/storage/utils/processDecryptedContent'

import { PUBLIC_FORMS_ENDPOINT } from '../PublicFormService'

/**
 * Returns the data of a single submission of a given storage mode form
 * @param arg.formId The id of the form to query
 * @param arg.submissionId The id of the submission
 * @returns The data of the submission
 */
export const getEncryptedSubmissionById = async ({
  formId,
  submissionId,
}: {
  formId: string
  submissionId: string
}): Promise<StorageModeSubmissionDto> => {
  return ApiService.get<StorageModeSubmissionDto>(
    `${PUBLIC_FORMS_ENDPOINT}/${formId}/submissions/${submissionId}`,
  ).then(({ data }) => data)
}

export const decryptSubmission = async ({
  submission,
  secretKey,
}: {
  submission?: StorageModeSubmissionDto
  secretKey?: string
}) => {
  if (!submission || !secretKey) return

  const { content, version, verified, attachmentMetadata, ...rest } = submission

  const decryptedContent = formsgSdk.crypto.decrypt(secretKey, {
    encryptedContent: content,
    verifiedContent: verified,
    version,
  })
  if (!decryptedContent) throw new Error('Could not decrypt the response')
  const processedContent = augmentDecryptedResponses(
    processDecryptedContent(decryptedContent),
    attachmentMetadata,
  )

  // Add metadata for display.
  return {
    ...rest,
    responses: processedContent,
  }
}
