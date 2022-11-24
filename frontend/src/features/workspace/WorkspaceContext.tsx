import { createContext, useContext } from 'react'

import { AdminDashboardFormMetaDto } from '~shared/types'

import { FilterOption } from './types'

export interface WorkspaceContextProps {
  isLoading: boolean
  totalFormsCount?: number
  displayedForms: AdminDashboardFormMetaDto[]
  displayedFormsCount: number
  defaultFilterOption: string
  activeFilter: FilterOption | null
  setActiveFilter: (filterOption: FilterOption | null) => void
  searchTerm: string
  setSearchTerm: (searchTerm: string) => void
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
