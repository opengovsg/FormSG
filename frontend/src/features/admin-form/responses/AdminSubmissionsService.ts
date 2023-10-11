import {
  FormSubmissionMetadataQueryDto,
  StorageModeSubmissionBase,
  StorageModeSubmissionDto,
  StorageModeSubmissionMetadataList,
  SubmissionCountQueryDto,
} from '~shared/types/submission'

import formsgSdk from '~utils/formSdk'
import { ApiService } from '~services/ApiService'

import { ADMIN_FORM_ENDPOINT } from '../common/AdminViewFormService'

import { augmentDecryptedResponses } from './ResponsesPage/storage/utils/augmentDecryptedResponses'
import { processDecryptedContent } from './ResponsesPage/storage/utils/processDecryptedContent'

/**
 * Counts the number of submissions for a given form
 * @param urlParameters Mapping of the url parameters to values
 * @returns The number of form submissions
 */
export const countFormSubmissions = async ({
  formId,
  dates,
}: {
  formId: string
  dates?: Partial<SubmissionCountQueryDto>
}): Promise<number> => {
  const queryUrl = `${ADMIN_FORM_ENDPOINT}/${formId}/submissions/count`
  if (dates && dates.startDate && dates.endDate) {
    return ApiService.get(queryUrl, {
      params: dates,
    }).then(({ data }) => data)
  }
  return ApiService.get(queryUrl).then(({ data }) => data)
}

/**
 * Get of submissions metadata for a given form
 * @param formId fomID to retrieve metadata on
 * @returns The metadata of the form
 */
export const getFormSubmissionsMetadata = async (
  formId: string,
  queryParams: FormSubmissionMetadataQueryDto,
): Promise<StorageModeSubmissionMetadataList> => {
  return ApiService.get(
    `${ADMIN_FORM_ENDPOINT}/${formId}/submissions/metadata`,
    {
      params: queryParams,
    },
  ).then(({ data }) => data)
}

/**
 * Returns the data of a single submission of a given storage mode form
 * @param arg.formId The id of the form to query
 * @param arg.submissionId The id of the submission
 * @returns The data of the submission
 */
const getEncryptedSubmissionById = async ({
  formId,
  submissionId,
}: {
  formId: string
  submissionId: string
}): Promise<StorageModeSubmissionDto> => {
  return ApiService.get<StorageModeSubmissionDto>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/submissions/${submissionId}`,
  ).then(({ data }) => data)
}

export const getDecryptedSubmissionById = async ({
  formId,
  submissionId,
  secretKey,
}: {
  formId: string
  submissionId: string
  secretKey?: string
}) => {
  if (!secretKey) return

  const { content, version, verified, attachmentMetadata, ...rest } =
    await getEncryptedSubmissionById({ formId, submissionId })

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

const getAllEncryptedSubmission = async ({ formId }: { formId: string }) => {
  return ApiService.get<StorageModeSubmissionBase[]>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/submissions`,
  ).then(({ data }) => data)
}

export const getAllDecryptedSubmission = async ({
  formId,
  secretKey,
}: {
  formId: string
  secretKey?: string
}) => {
  if (!secretKey) return

  const allEncryptedData = await getAllEncryptedSubmission({ formId })

  return allEncryptedData.map((encryptedData) => {
    const decryptedContent = formsgSdk.crypto.decrypt(secretKey, {
      encryptedContent: encryptedData.encryptedContent,
      verifiedContent: encryptedData.verifiedContent,
      version: encryptedData.version,
    })

    if (!decryptedContent) throw new Error('Could not decrypt the response')

    return { ...decryptedContent, submissionTime: encryptedData.created }
  })
}
