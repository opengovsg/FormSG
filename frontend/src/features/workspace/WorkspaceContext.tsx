import { createContext, Dispatch, SetStateAction, useContext } from 'react'

import { AdminDashboardFormMetaDto, FormId } from '~shared/types'
import { Workspace } from '~shared/types/workspace'

import { FilterOption } from './types'

export interface WorkspaceContextProps {
  isLoading: boolean
  totalFormsCount?: number
  displayedForms: AdminDashboardFormMetaDto[]
  displayedFormsCount: number
  activeSearch: string
  setActiveSearch: (searchTerm: string) => void
  activeFilter: FilterOption
  setActiveFilter: (filterOption: FilterOption) => void
  hasActiveSearchOrFilter: boolean
  activeWorkspace: Workspace
  workspaces?: Workspace[]
  setCurrentWorkspace: Dispatch<SetStateAction<string>>
  getFormWorkspace: (formId: FormId) => Workspace | undefined
  isDefaultWorkspace: boolean
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
