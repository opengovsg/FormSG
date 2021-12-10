import { Remote, wrap } from 'comlink'
// Need to use inline loading in order to use comlink syntax
// Typescript documentation for worker-loader webpack v4 also seems outdated,
// loading the worker script via webpack config no longer works
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
 * @param formId fomID to retrieve metadata on
 * @returns The metadata of the form
 */
export const getFormSubmissionsMetadata = async (
  formId: string,
): Promise<StorageModeSubmissionMetadataList> => {
  const queryUrl = `${ADMIN_FORM_ENDPOINT}/${formId}/submissions/metadata?page=1` // To be generalized in later PRs
  return ApiService.get(queryUrl).then(({ data }) => data)
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

  // TO DO: Implementation of decrypting and downloading responses in later PRs

  Promise.all(
    workerPool.map(async (worker: Worker, idx: number) => {
      console.log(await worker.workerApi.log(idx), ' finished running!')
      return worker.worker
    }),
  ).then((workers) =>
    workers.forEach((worker, idx) => {
      console.log('Terminating worker ' + idx)
      worker.terminate() // Workerpool teardown
    }),
  )
}
