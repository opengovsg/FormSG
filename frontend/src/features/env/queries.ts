import { useQuery, UseQueryResult } from 'react-query'

import { ClientEnvVars } from '~shared/types/core'

import { getClientEnvVars } from './EnvService'

const envKeys = {
  base: ['env'],
}

export const useEnv = (): UseQueryResult<ClientEnvVars, unknown> => {
  return useQuery<ClientEnvVars>(envKeys.base, () => getClientEnvVars())
}
