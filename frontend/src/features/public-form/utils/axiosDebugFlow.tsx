import { datadogLogs } from '@datadog/browser-logs'
import { AxiosError } from 'axios'

import { ApiService } from '~services/ApiService'

const getClientEnvWithFetch = async () => {
  const env = await fetch(`${process.env.REACT_APP_URL}/api/v3/client/env2`)
  datadogLogs.logger.warn(`handleSubmitForm: fetch env vars`, {
    meta: {
      action: 'handleSubmitForm',
      envFetchSuccess: env.ok, // returns true if the response returned successfully
    },
  })
}

const getClientEnvWithAxios = async () => {
  const env = await ApiService.get<{ ok: string }>(
    `${process.env.REACT_APP_URL}/api/v3/client/env1`,
  ).then(({ data }) => data)
  datadogLogs.logger.warn(`handleSubmitForm: fetch env vars`, {
    meta: {
      action: 'handleSubmitForm',
      envAxiosFetchSuccess: env.ok, // returns true if the response returned successfully
    },
  })
}
export const axiosDebugFlow = async (error: AxiosError) => {
  if (error.message.match(/Network Error/i)) {
    getClientEnvWithFetch()
    getClientEnvWithAxios()
  }
}
