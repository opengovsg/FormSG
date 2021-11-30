import { Remote, wrap } from 'comlink'
// eslint-disable-next-line import/no-webpack-loader-syntax
import DecryptionWorker from 'worker-loader!./workers/decryption.worker'

import { SubmissionCountQueryDto } from '~shared/types/submission'

import { ApiService } from '~services/ApiService'

import { ADMIN_FORM_ENDPOINT } from '../common/AdminViewFormService'

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
  dates?: SubmissionCountQueryDto
}): Promise<number> => {
  const queryUrl = `${ADMIN_FORM_ENDPOINT}/${formId}/submissions/count`
  if (dates) {
    return ApiService.get(queryUrl, {
      params: { ...dates },
    }).then(({ data }) => data)
  }
  return ApiService.get(queryUrl).then(({ data }) => data)
}

/**
 * Get of submissions metadata for a given form
 * @param urlParameters Mapping of the url parameters to values
 * @returns The number of form submissions
 */
export const getFormSubmissionsMetadata = async (
  formId: string,
): Promise<any> => {
  const queryUrl = `${ADMIN_FORM_ENDPOINT}/${formId}/submissions/metadata?page=1`
  return ApiService.get(queryUrl).then(({ data }) => data)
}

interface Worker {
  worker: DecryptionWorker
  workerApi: Remote<{
    decryptIntoCsv: (data: any) => any
  }>
}

export const downloadEncryptedResponses = async (
  formId: string,
  formTitle: string,
  secretKey: string,
) => {
  console.log('DECRYPTING')

  const numWorkers = window.navigator.hardwareConcurrency || 4

  const workerPool: Worker[] = []

  for (let i = 0; i < numWorkers; i++) {
    const worker = new DecryptionWorker()
    const workerApi =
      wrap<import('./workers/decryption.worker').DecryptionWorker>(worker)
    console.log('New Worker!', i)
    workerPool.push({ worker, workerApi })
    const test = i + ' is running!'
    workerPool[i].workerApi.decryptIntoCsv(test)
  }

  for (let i = 0; i < numWorkers; i++) {
    workerPool[i].worker.terminate()
  }

  return null
}
