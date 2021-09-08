import { useQuery } from 'react-query'
import { AsyncReturnType } from 'type-fest'

import { getDashboardView } from './WorkspaceService'

const workspaceKeys = {
  all: ['workspace'] as const,
}

type UseWorkspaceReturn = {
  dashboardForms: AsyncReturnType<typeof getDashboardView> | undefined
}

export const useWorkspace = (): UseWorkspaceReturn => {
  const { data: dashboardForms } = useQuery(workspaceKeys.all, () =>
    getDashboardView(),
  )

  return {
    dashboardForms,
  }
}
