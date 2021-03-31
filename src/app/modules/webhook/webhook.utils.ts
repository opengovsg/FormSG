import { AxiosResponse } from 'axios'

import { stringifySafe } from '../../../shared/util/stringify-safe'
import { IWebhookResponse } from '../../../types'

/**
 * Formats a response object for update in the Submissions collection
 * @param {response} response Response object returned by axios
 */
export const formatWebhookResponse = (
  response?: AxiosResponse<unknown>,
): IWebhookResponse['response'] => ({
  status: response?.status ?? 0,
  statusText: response?.statusText ?? '',
  headers: stringifySafe(response?.headers) ?? '',
  data: stringifySafe(response?.data) ?? '',
})
