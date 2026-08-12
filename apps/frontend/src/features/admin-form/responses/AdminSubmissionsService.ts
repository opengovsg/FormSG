import { datadogLogs } from '@datadog/browser-logs'

import {
  FormSubmissionMetadataQueryDto,
  SubmissionCountQueryDto,
  SubmissionDto,
  SubmissionMetadataList,
  SubmissionType,
} from 'formsg-shared/types/submission'

import { env } from '~/env'

import formsgSdk from '~utils/formSdk'
import { ApiService } from '~services/ApiService'

import { ADMIN_FORM_ENDPOINT } from '../common/AdminViewFormService'

import {
  killWorkers,
  makeWorkerApiAndCleanup,
} from './common/utils/decryptionWorker'
import { getEncryptedResponsesStream } from './ResponsesPage/storage/StorageResponsesService'
import { CleanableDecryptionWorkerApi } from './ResponsesPage/storage/types'
import { augmentDecryptedResponses } from './ResponsesPage/storage/utils/augmentDecryptedResponses'
import {
  buildFormFieldMetaMap,
  processDecryptedContent,
  processDecryptedContentV4,
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

  let processedContent, submissionSecretKey, mrfVersion, stepToken
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
      const formFieldsMeta = buildFormFieldMetaMap(
        encryptedSubmission.form_fields,
      )
      const decryptedV4 = formsgSdk.cryptoV3.decryptToV4(
        secretKey,
        {
          encryptedContent: encryptedSubmission.encryptedContent,
          encryptedSubmissionSecretKey:
            encryptedSubmission.encryptedSubmissionSecretKey,
          verifiedContent: encryptedSubmission.verifiedContent,
          version: encryptedSubmission.version,
          encryptedStepToken: encryptedSubmission.encryptedStepToken,
        },
        formFieldsMeta,
      )

      if (!decryptedV4) {
        datadogLogs.logger.error('Could not decrypt MRF response in v4', {
          meta: {
            action: 'getDecryptedSubmissionById',
            formId,
            submissionId,
          },
        })
        throw new Error('Could not process submission content')
      }

      processedContent = processDecryptedContentV4(
        encryptedSubmission.form_fields,
        decryptedV4.responses,
        decryptedV4.verified,
      )
      submissionSecretKey = decryptedV4.submissionSecretKey
      mrfVersion = encryptedSubmission.mrfVersion
      stepToken = decryptedV4.stepToken
      break
    }
  }

  if (!processedContent) throw new Error('Could not process submission content')

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
    mrf:
      encryptedSubmission.submissionType === SubmissionType.Multirespondent
        ? encryptedSubmission.mrfMeta
        : undefined,
    responses,
    mrfVersion,
    stepToken,
  }
}

type DecryptedContent = NonNullable<ReturnType<typeof formsgSdk.crypto.decrypt>>
export type DecryptedSubmission = Pick<DecryptedContent, 'responses'>

export const getAllDecryptedSubmission = async ({
  formId,
  secretKey,
  startDate,
  endDate,
  downloadAttachments,
  isSortByLatest,
  limit,
}: {
  formId: string
  secretKey: string
  startDate: string
  endDate: string
  downloadAttachments: boolean
  isSortByLatest: boolean
  limit: number
}): Promise<DecryptedSubmission[]> => {
  const numWorkers = window.navigator.hardwareConcurrency ?? 1
  const workerPool: CleanableDecryptionWorkerApi[] = []
  let currentSubmissionIndex = 0

  for (let i = workerPool.length; i < numWorkers; i++) {
    workerPool.push(makeWorkerApiAndCleanup())
  }

  const submissionsStream = await getEncryptedResponsesStream(formId, {
    startDate,
    endDate,
    downloadAttachments,
    isSortByLatest,
    limit,
  })

  const decryptSubmissionPromises: Promise<DecryptedSubmission>[] = []

  const reader = submissionsStream.getReader()
  let read: (result: ReadableStreamReadResult<string>) => void

  await reader.read().then(
    (read = async (result) => {
      if (result.done) return
      const { workerApi } = workerPool[currentSubmissionIndex % numWorkers]
      decryptSubmissionPromises.push(
        workerApi
          .parseAndDecryptSubmissionData({
            submissionStreamDtoString: result.value,
            secretKey,
            workerCtxOptions: {
              formsgSdkMode: env.formsgSdkMode,
            },
          })
          .then((result) => {
            if (!result.isParseSuccessful || !result.isDecryptionSuccessful) {
              throw new Error('One or more responses failed to decrypt.')
            }
            return { responses: result.decryptedResponses }
          }),
      )
      currentSubmissionIndex++
      return reader.read().then(read)
    }),
  )

  const decryptionResults = await Promise.all(
    decryptSubmissionPromises,
  ).finally(() => {
    killWorkers(workerPool)
  })
  return decryptionResults
}
