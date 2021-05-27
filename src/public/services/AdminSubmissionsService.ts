import axios from 'axios'

import { EncryptedSubmissionDto, SubmissionMetadataList } from 'src/types'
import {
  SubmissionCountQueryDto,
  SubmissionMetadataQueryDto,
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
  startDate,
  endDate,
}: SubmissionCountQueryDto): Promise<number> => {
  const queryUrl = `${ADMIN_FORM_ENDPOINT}/${formId}/submissions/count`
  if (startDate && endDate) {
    return axios
      .get(queryUrl, {
        params: { startDate, endDate },
      })
      .then(({ data }) => data)
  }
  return axios.get(queryUrl).then(({ data }) => data)
}

/**
 * Retrieves the metadata for either a page of submission or a single submissionId if submissionId is specified
 * @param formId The id of the form to retrieve submission for
 * @param submissionId The id of the specified submission to retrieve
 * @param pageNum The page number of the responses
 * @returns The metadata of the form
 */
export const getFormsMetadata = async ({
  formId,
  submissionId,
  pageNum,
}: SubmissionMetadataQueryDto): Promise<SubmissionMetadataList> => {
  const params = submissionId ? { submissionId } : { page: pageNum }

  return axios
    .get(`${ADMIN_FORM_ENDPOINT}/${formId}/submissions/metadata`, {
      params,
    })
    .then(({ data }) => data)
}

/**
 * Returns the data of a single submission of a given storage mode form
 * @param formId The id of the form to query
 * @param submissionId The id of the submission
 * @returns The data of the submission
 */
export const getEncryptedResponse = ({
  formId,
  submissionId,
}: SubmissionResponseQueryDto): Promise<EncryptedSubmissionDto> => {
  return axios
    .get(`${ADMIN_FORM_ENDPOINT}/${formId}/submissions/${submissionId}`)
    .then(({ data }) => data)
}
