import { Remote, wrap } from 'comlink'
// eslint-disable-next-line import/no-webpack-loader-syntax
import DecryptionWorker from 'worker-loader!./workers/decryption.worker'

import {
  StorageModeSubmissionMetadataList,
  SubmissionCountQueryDto,
} from '~shared/types/submission'

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
): Promise<StorageModeSubmissionMetadataList> => {
  const queryUrl = `${ADMIN_FORM_ENDPOINT}/${formId}/submissions/metadata?page=1`
  return ApiService.get(queryUrl).then(({ data }) => {
    console.log('DATA', data)
    return data
  })
}

interface Worker {
  worker: DecryptionWorker
  workerApi: Remote<{
    log: (id: number) => string
  }>
}

export const downloadEncryptedResponses = async (
  formId: string,
  formTitle: string,
  secretKey: string,
): Promise<void> => {
  const numWorkers = window.navigator.hardwareConcurrency || 4

  const workerPool: Worker[] = []

  // Workerpool sample setup
  for (let i = 0; i < numWorkers; i++) {
    const worker = new DecryptionWorker()
    const workerApi =
      wrap<import('./workers/decryption.worker').DecryptionWorker>(worker)
    workerPool.push({ worker, workerApi })
  }

  Promise.all(
    workerPool.map(async (worker: Worker, idx: number) => {
      await worker.workerApi.log(idx)
      return worker.worker
    }),
  ).then((workers) =>
    workers.forEach((worker, idx) => {
      console.log('Terminating worker ' + idx)
      worker.terminate() // Workerpool teardown
    }),
  )
}
