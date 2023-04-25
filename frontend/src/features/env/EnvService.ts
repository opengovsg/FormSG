import { ClientEnvVars } from '~shared/types/core'

import { ApiService } from '~services/ApiService'

export const getClientEnvVars = async (): Promise<ClientEnvVars> => {
  return ApiService.get<ClientEnvVars>('/client/env').then(({ data }) => data)
}
