import { releaseProxy, wrap } from 'comlink'
import { mapValues } from 'lodash'

import { API_BASE_URL } from '~services/ApiService'

import { ADMIN_FORM_ENDPOINT } from '~features/admin-form/common/AdminViewFormService'

import { ndjsonStream } from './utils/ndjsonStream'
import DecryptionWorker, {
  DecryptionWorkerApi,
} from './worker/decryption.worker'
import { CleanableDecryptionWorkerApi } from './types'

export type EncryptedResponsesStreamParams = {
  startDate?: string
  endDate?: string
  downloadAttachments: boolean
}

const fixParamsToUrl = (dict: Record<string, unknown>, url: string) => {
  Object.keys(dict).forEach((key) => {
    url = url.replace(':' + key, String(dict[key]))
  })
  return url
}

const generateDownloadUrl = (
  formId: string,
  params: EncryptedResponsesStreamParams,
) => {
  // NOTE: The ? is appended behind to ensure that the query parameters in url are constructed correctly
  let resUrl = `${fixParamsToUrl(
    params,
    `${API_BASE_URL}/${ADMIN_FORM_ENDPOINT}/${formId}/submissions/download?`,
  )}`

  if (!params.startDate || !params.endDate) {
    delete params.startDate
    delete params.endDate
  }

  const uriEncodedParams = mapValues(params, encodeURIComponent)

  if (params) {
    resUrl += Object.keys(uriEncodedParams)
      .map((key) => `${key}=${uriEncodedParams[key]}`)
      .join('&')
  }
  return resUrl
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

/**
 * Creates a worker, a cleanup function and returns it
 */
export const makeWorkerApiAndCleanup = (): CleanableDecryptionWorkerApi => {
  // Create a worker and wrap it with comlink for ease of interaction.
  const worker = new DecryptionWorker()
  const workerApi = wrap<DecryptionWorkerApi>(worker)

  // A cleanup function that releases the comlink proxy and terminates the worker
  const cleanup = () => {
    workerApi[releaseProxy]()
    worker.terminate()
  }

  const workerApiAndCleanup = { workerApi, cleanup }

  return workerApiAndCleanup
}
