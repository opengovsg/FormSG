import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useSearchParams } from 'react-router-dom'
import fuzzysort from 'fuzzysort'

import { FormId, FormResponseMode, FormStatus } from '~shared/types'
import { Workspace } from '~shared/types/workspace'

import { useDashboard, useWorkspace } from './queries'
import { FilterOption, filterOptionMap, filterOptionReverseMap } from './types'
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
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: dashboardForms, isLoading: dashboardIsLoading } = useDashboard()

  const { data: workspaces, isLoading: workspaceIsLoading } = useWorkspace()

  const isLoading = dashboardIsLoading || workspaceIsLoading

  const [activeSearch, setActiveSearch] = useState<string>('')
  const [activeFilter, setActiveFilter] = useState<FilterOption>(
    filterOptionMap[searchParams.get('filter') ?? 'none'] ??
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
      case FilterOption.EmailForms:
        displayedForms = displayedForms.filter(
          (form) => form.responseMode === FormResponseMode.Email,
        )
        break
      case FilterOption.StorageForms:
        displayedForms = displayedForms.filter(
          (form) => form.responseMode === FormResponseMode.Encrypt,
        )
        break
      case FilterOption.MultiRespondentForms:
        displayedForms = displayedForms.filter(
          (form) => form.responseMode === FormResponseMode.Multirespondent,
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

  const getFormWorkspace = useCallback(
    (formId: FormId) => {
      return workspaces?.find((workspace) => workspace.formIds.includes(formId))
    },
    [workspaces],
  )

  // Update the URL search params based on the current workspace state
  useEffect(() => {
    // Update the URL search params when the filter changes
    const newSearchParams: Record<string, string> = {}
    if (activeFilter !== FilterOption.AllForms) {
      newSearchParams.filter = filterOptionReverseMap[activeFilter] || 'none'
    }
    setSearchParams(newSearchParams)
  }, [activeFilter, setSearchParams])

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
        getFormWorkspace,
        isDefaultWorkspace: !activeWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}
