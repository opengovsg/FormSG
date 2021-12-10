import {
  StorageModeSubmissionMetadataList,
  SubmissionCountQueryDto,
} from '~shared/types/submission'

import { ApiService } from '~services/ApiService'

import { ADMIN_FORM_ENDPOINT } from '../common/AdminViewFormService'

import { WorkerInterface } from './workers/type/workerinterface'

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

/**
 * Terminates all workers
 * @param workers an array of workers
 */
export const killWorkers = (workers: WorkerInterface[]): void =>
  workers.forEach((worker) => worker.worker.terminate())
