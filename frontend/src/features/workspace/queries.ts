import { useQuery, UseQueryResult } from 'react-query'

import { AdminDashboardFormMetaDto } from '~shared/types/form/form'
import { WorkspaceDto } from '~shared/types/workspace'

import { ApiError } from '~typings/core'

import { getDashboardView, getWorkspacesView } from './WorkspaceService'

const workspaceKeys = {
  all: ['workspace'] as const,
  workspaces: ['workspaces'] as const,
}

export const useDashboard = (): UseQueryResult<
  AdminDashboardFormMetaDto[],
  ApiError
> => {
  return useQuery(workspaceKeys.all, () => getDashboardView(), {
    staleTime: 5000,
  })
}

export const useWorkspace = (): UseQueryResult<WorkspaceDto[], ApiError> => {
  return useQuery(workspaceKeys.workspaces, () => getWorkspacesView(), {
    staleTime: 5000,
  })
}
