import { DateString } from '~shared/types'
import {
  FormSubmissionMetadataQueryDto,
  StorageModeChartsDto,
  SubmissionCountQueryDto,
  SubmissionDto,
  SubmissionMetadataList,
  SubmissionType,
} from '~shared/types/submission'

import formsgSdk from '~utils/formSdk'
import { ApiService } from '~services/ApiService'

import { ADMIN_FORM_ENDPOINT } from '../common/AdminViewFormService'

import { augmentDecryptedResponses } from './ResponsesPage/storage/utils/augmentDecryptedResponses'
import {
  processDecryptedContent,
  processDecryptedContentV3,
} from './ResponsesPage/storage/utils/processDecryptedContent'

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
): Promise<SubmissionMetadataList> => {
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
}): Promise<SubmissionDto> => {
  return ApiService.get<SubmissionDto>(
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

  const encryptedSubmission = await getEncryptedSubmissionById({
    formId,
    submissionId,
  })

  let processedContent, submissionSecretKey, mrfVersion
  switch (encryptedSubmission.submissionType) {
    case SubmissionType.Encrypt: {
      const decryptedContent = formsgSdk.crypto.decrypt(secretKey, {
        encryptedContent: encryptedSubmission.content,
        verifiedContent: encryptedSubmission.verified,
        version: encryptedSubmission.version,
      })
      if (!decryptedContent) {
        throw new Error('Could not decrypt the storage mode response')
      }
      processedContent = processDecryptedContent(decryptedContent)
      break
    }
    case SubmissionType.Multirespondent: {
      const decryptedContent = formsgSdk.cryptoV3.decrypt(secretKey, {
        encryptedContent: encryptedSubmission.encryptedContent,
        encryptedSubmissionSecretKey:
          encryptedSubmission.encryptedSubmissionSecretKey,
        version: encryptedSubmission.version,
      })
      if (!decryptedContent)
        throw new Error('Could not decrypt the multirespondent form response')
      processedContent = await processDecryptedContentV3(
        encryptedSubmission.form_fields,
        decryptedContent,
      )
      submissionSecretKey = decryptedContent.submissionSecretKey
      mrfVersion = encryptedSubmission.mrfVersion
      break
    }
  }

  const responses = augmentDecryptedResponses(
    processedContent,
    encryptedSubmission.attachmentMetadata,
  )

  // Add metadata for display.
  return {
    refNo: encryptedSubmission.refNo,
    submissionTime: encryptedSubmission.submissionTime,
    submissionSecretKey,
    payment:
      encryptedSubmission.submissionType === SubmissionType.Encrypt
        ? encryptedSubmission.payment
        : undefined,
    responses,
    mrfVersion,
  }
}

const getAllEncryptedSubmission = async ({
  formId,
  startDate,
  endDate,
}: {
  formId: string
  startDate?: DateString
  endDate?: DateString
}): Promise<StorageModeChartsDto[]> => {
  const queryUrl = `${ADMIN_FORM_ENDPOINT}/${formId}/submissions`
  if (startDate && endDate) {
    return ApiService.get(queryUrl, {
      params: {
        startDate,
        endDate,
      },
    }).then(({ data }) => data)
  }
  return ApiService.get(queryUrl).then(({ data }) => data)
}

type DecryptedContent = NonNullable<ReturnType<typeof formsgSdk.crypto.decrypt>>
export type DecryptedSubmission = DecryptedContent & {
  submissionTime: string
}

export const getAllDecryptedSubmission = async ({
  formId,
  secretKey,
  startDate,
  endDate,
}: {
  formId: string
  secretKey?: string
  startDate?: DateString
  endDate?: DateString
}): Promise<DecryptedSubmission[]> => {
  if (!secretKey) return []

  const allEncryptedData = await getAllEncryptedSubmission({
    formId,
    startDate,
    endDate,
  })

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
