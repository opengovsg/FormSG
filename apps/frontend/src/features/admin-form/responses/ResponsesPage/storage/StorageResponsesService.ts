import { mapValues } from 'lodash'

import { API_BASE_URL } from '~services/ApiService'

import { ADMIN_FORM_ENDPOINT } from '~features/admin-form/common/AdminViewFormService'

import { ndjsonStream } from './utils/ndjsonStream'

export type EncryptedResponsesStreamParams = {
  startDate?: string
  endDate?: string
  downloadAttachments: boolean
  isSortByLatest?: boolean
  limit?: number
}

const generateDownloadUrl = (
  formId: string,
  params: EncryptedResponsesStreamParams,
) => {
  if (!params.startDate || !params.endDate) {
    delete params.startDate
    delete params.endDate
  }

  // Stringify all values in params.
  const uriEncodedParams = new URLSearchParams(mapValues(params, String))
  return `${API_BASE_URL}${ADMIN_FORM_ENDPOINT}/${formId}/submissions/download?${uriEncodedParams}`
}

export const getEncryptedResponsesStream = async (
  formId: string,
  params: EncryptedResponsesStreamParams,
  abortController?: AbortController,
) => {
  // Unable to use axios for streams, and thus using native fetch instead.
  return fetch(generateDownloadUrl(formId, params), {
    signal: abortController?.signal,
  })
    .then((res) => res.body)
    .then(ndjsonStream)
}
