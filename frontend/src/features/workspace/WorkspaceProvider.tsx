import { Dispatch, SetStateAction, useMemo, useState } from 'react'
import fuzzysort from 'fuzzysort'

import { FormStatus } from '~shared/types'
import { Workspace } from '~shared/types/workspace'

import { useDashboard, useWorkspace } from './queries'
import { FilterOption } from './types'
import { WorkspaceContext } from './WorkspaceContext'

interface WorkspaceProviderProps {
  currentWorkspace: string
  defaultWorkspace: Workspace
  setCurrentWorkspace: Dispatch<SetStateAction<string>>
  children: React.ReactNode
}

export const WorkspaceProvider = ({
  currentWorkspace,
  defaultWorkspace,
  setCurrentWorkspace,
  children,
}: WorkspaceProviderProps): JSX.Element => {
  const { data: dashboardForms, isLoading: dashboardIsLoading } = useDashboard()

  const { data: workspaces, isLoading: workspaceIsLoading } = useWorkspace()

  const isLoading = dashboardIsLoading || workspaceIsLoading

  const [activeSearch, setActiveSearch] = useState<string>('')
  const [activeFilter, setActiveFilter] = useState<FilterOption>(
    FilterOption.AllForms,
  )

  const activeWorkspace = useMemo(
    () =>
      workspaces?.find(
        (workspace) => workspace._id.toString() === currentWorkspace,
      ),
    [workspaces, currentWorkspace],
  )

  const totalFormsCount = useMemo(() => {
    if (currentWorkspace) {
      return activeWorkspace?.formIds.length
    }
    return dashboardForms?.length
  }, [dashboardForms?.length, activeWorkspace, currentWorkspace])

  const displayedForms = useMemo(() => {
    if (!dashboardForms) return []

    let displayedForms = dashboardForms

    // filter by workspaces first
    if (currentWorkspace) {
      displayedForms = displayedForms.filter((form) =>
        activeWorkspace?.formIds.includes(form._id),
      )
    }

    // Filter first...
    switch (activeFilter) {
      case FilterOption.OpenForms:
        displayedForms = displayedForms.filter(
          (form) => form.status === FormStatus.Public,
        )
        break
      case FilterOption.ClosedForms:
        displayedForms = displayedForms.filter(
          (form) => form.status === FormStatus.Private,
        )
        break
      default:
        break
    }

    // ... then fuzzy search
    displayedForms = fuzzysort
      .go(activeSearch, displayedForms, {
        all: true,
        key: 'title',
      })
      .map((res) => res.obj)

    return displayedForms
  }, [
    dashboardForms,
    activeFilter,
    activeSearch,
    currentWorkspace,
    activeWorkspace,
  ])

  const displayedFormsCount = useMemo(
    () => displayedForms.length,
    [displayedForms.length],
  )

  const hasActiveSearchOrFilter = useMemo(
    () => !!activeSearch || activeFilter !== FilterOption.AllForms,
    [activeFilter, activeSearch],
  )

  return (
    <WorkspaceContext.Provider
      value={{
        isLoading,
        totalFormsCount,
        displayedForms,
        displayedFormsCount,
        activeFilter,
        setActiveFilter,
        activeSearch,
        setActiveSearch,
        hasActiveSearchOrFilter,
        activeWorkspace: activeWorkspace ? activeWorkspace : defaultWorkspace,
        workspaces,
        setCurrentWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}
