import {
  FormSubmissionMetadataQueryDto,
  StorageModeSubmissionDto,
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
  page: NonNullable<FormSubmissionMetadataQueryDto['page']> = 1,
): Promise<StorageModeSubmissionMetadataList> => {
  return ApiService.get(
    `${ADMIN_FORM_ENDPOINT}/${formId}/submissions/metadata`,
    {
      params: {
        page,
      },
    },
  ).then(({ data }) => data)
}

/**
 * Returns the data of a single submission of a given storage mode form
 * @param formId The id of the form to query
 * @param submissionId The id of the submission
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
    `${ADMIN_FORM_ENDPOINT}/${formId}/submissions/${submissionId}`,
  ).then(({ data }) => data)
}
