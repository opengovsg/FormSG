import axios from 'axios'

import { EncryptedSubmissionDto, SubmissionMetadataList } from 'src/types'
import {
  FormsSubmissionMetadataQueryDto,
  FormSubmissionMetadataQueryDto,
  SubmissionCountQueryDto,
  SubmissionResponseQueryDto,
} from 'src/types/api'

import { ADMIN_FORM_ENDPOINT } from './AdminFormService'

/**
 * Counts the number of submissions for a given form
 * @param urlParameters Mapping of the url parameters to values
 * @returns The number of form submissions
 */
export const countFormSubmissions = async ({
  formId,
  dates,
}: SubmissionCountQueryDto): Promise<number> => {
  const queryUrl = `${ADMIN_FORM_ENDPOINT}/${formId}/submissions/count`
  if (dates) {
    return axios
      .get(queryUrl, {
        params: { ...dates },
      })
      .then(({ data }) => data)
  }
  return axios.get(queryUrl).then(({ data }) => data)
}

/**
 * Retrieves the metadata for a page of submissions
 * @param formId The id of the form to retrieve submission for
 * @param pageNum The page number of the responses
 * @returns The metadata of the page of forms
 */
export const getSubmissionsMetadataByPage = async ({
  formId,
  pageNum,
}: FormsSubmissionMetadataQueryDto): Promise<SubmissionMetadataList> => {
  return axios
    .get(`${ADMIN_FORM_ENDPOINT}/${formId}/submissions/metadata`, {
      params: {
        page: pageNum,
      },
    })
    .then(({ data }) => data)
}

/**
 * Retrieves the metadata for a single submissionId if submissionId is specified
 * @param formId The id of the form to retrieve submission for
 * @param submissionId The id of the specified submission to retrieve
 * @returns The metadata of the form
 */
export const getSubmissionMetadataById = async ({
  formId,
  submissionId,
}: FormSubmissionMetadataQueryDto): Promise<SubmissionMetadataList> => {
  return axios
    .get(`${ADMIN_FORM_ENDPOINT}/${formId}/submissions/metadata`, {
      params: {
        submissionId,
      },
    })
    .then(({ data }) => data)
}

/**
 * Returns the data of a single submission of a given storage mode form
 * @param formId The id of the form to query
 * @param submissionId The id of the submission
 * @returns The data of the submission
 */
export const getEncryptedResponse = async ({
  formId,
  submissionId,
}: SubmissionResponseQueryDto): Promise<EncryptedSubmissionDto> => {
  return axios
    .get(`${ADMIN_FORM_ENDPOINT}/${formId}/submissions/${submissionId}`)
    .then(({ data }) => data)
}
