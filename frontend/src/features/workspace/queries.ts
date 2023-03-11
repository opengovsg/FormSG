import { useQuery, UseQueryResult } from '@tanstack/react-query'

import { AdminDashboardFormMetaDto } from '~shared/types/form/form'

import { ApiError } from '~typings/core'

import { getDashboardView } from './WorkspaceService'

export const workspaceKeys = {
  all: ['workspace'] as const,
}

export const useWorkspace = (): UseQueryResult<
  AdminDashboardFormMetaDto[],
  ApiError
> => {
  return useQuery(workspaceKeys.all, () => getDashboardView(), {
    staleTime: 5000,
  })
}
