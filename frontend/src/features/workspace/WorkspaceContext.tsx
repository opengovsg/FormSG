import { createContext, useContext } from 'react'

import { AdminDashboardFormMetaDto } from '~shared/types'

export interface WorkspaceContextProps {
  isLoading: boolean
  totalFormCount?: number
  sortedForms: AdminDashboardFormMetaDto[]
}

export const WorkspaceContext = createContext<
  WorkspaceContextProps | undefined
>(undefined)

export const useWorkspaceContext = (): WorkspaceContextProps => {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error(
      `useWorkspaceContext must be used within a WorkspaceProvider component`,
    )
  }
  return context
}
