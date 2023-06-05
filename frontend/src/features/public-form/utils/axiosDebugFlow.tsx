import { datadogLogs } from '@datadog/browser-logs'

import { ApiService } from '~services/ApiService'

import { ClientEnvVars } from '../../../../../shared/types'

const getClientEnvWithFetch = async () => {
  const response = await fetch(`${process.env.REACT_APP_URL}/api/v3/client/env`)
  if (response.ok) {
    const env = await response.json()
    datadogLogs.logger.info(`handleSubmitForm: fetch env vars successful`, {
      meta: {
        action: 'handleSubmitForm',
        method: 'fetch',
        env,
      },
    })
  } else {
    datadogLogs.logger.error(`handleSubmitForm: fetch env vars failed`, {
      meta: {
        action: 'handleSubmitForm',
        method: 'fetch',
      },
    })
  }
}

const getClientEnvWithAxios = async () => {
  try {
    const env = await ApiService.get<ClientEnvVars>(
      `${process.env.REACT_APP_URL}/api/v3/client/env`,
    ).then(({ data }) => data)

    datadogLogs.logger.info(`handleSubmitForm: axios env vars successful`, {
      meta: {
        action: 'handleSubmitForm',
        method: 'axios',
        env,
      },
    })
  } catch (error) {
    datadogLogs.logger.error(`handleSubmitForm: axios env vars failed`, {
      meta: {
        action: 'handleSubmitForm',
        method: 'axios',
      },
      error,
    })
  }
}

export const axiosDebugFlow = async () => {
  getClientEnvWithFetch()
  getClientEnvWithAxios()
}
