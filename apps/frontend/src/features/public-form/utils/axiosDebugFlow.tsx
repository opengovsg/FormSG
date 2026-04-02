import { datadogLogs } from '@datadog/browser-logs'

import { ClientEnvVars } from 'formsg-shared/types'

import { env } from '~/env'

import { ApiService } from '~services/ApiService'

const getClientEnvWithFetch = async () => {
  const response = await fetch(`${env.appUrl}/api/v3/client/env`)
  if (response.ok) {
    const clientEnv = await response.json()
    datadogLogs.logger.info(`handleSubmitForm: fetch env vars successful`, {
      meta: {
        action: 'handleSubmitForm',
        method: 'fetch',
        env: clientEnv,
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
    const clientEnv = await ApiService.get<ClientEnvVars>(
      `${env.appUrl}/api/v3/client/env`,
    ).then(({ data }) => data)

    datadogLogs.logger.info(`handleSubmitForm: axios env vars successful`, {
      meta: {
        action: 'handleSubmitForm',
        method: 'axios',
        env: clientEnv,
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
