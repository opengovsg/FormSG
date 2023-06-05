import { useQuery, UseQueryResult } from 'react-query'

import { AdminDashboardFormMetaDto } from '~shared/types/form/form'
import { WorkspaceDto } from '~shared/types/workspace'

import { ApiError } from '~typings/core'

import { getDashboardView, getWorkspacesView } from './WorkspaceService'

export const workspaceKeys = {
  dashboard: ['dashboard'] as const,
  workspaces: ['workspaces'] as const,
}

export const useDashboard = (): UseQueryResult<
  AdminDashboardFormMetaDto[],
  ApiError
> => {
  return useQuery(workspaceKeys.dashboard, () => getDashboardView(), {
    staleTime: 5000,
  })
}

export const useWorkspace = (): UseQueryResult<WorkspaceDto[], ApiError> => {
  return useQuery(workspaceKeys.workspaces, () => getWorkspacesView(), {
    staleTime: 5000,
  })
}
