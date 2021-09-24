import { useQuery, UseQueryResult } from 'react-query'
import { AsyncReturnType } from 'type-fest'

import { ApiError } from '~typings/core'

import { getDashboardView } from './WorkspaceService'

const workspaceKeys = {
  all: ['workspace'] as const,
}

export const useWorkspace = (): UseQueryResult<
  AsyncReturnType<typeof getDashboardView>,
  ApiError
> => {
  return useQuery(workspaceKeys.all, () => getDashboardView())
}
