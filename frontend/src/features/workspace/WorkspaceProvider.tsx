import { useMemo, useState } from 'react'
import fuzzysort from 'fuzzysort'

import { FormStatus } from '~shared/types'

import { useWorkspace } from './queries'
import { FilterOption } from './types'
import { WorkspaceContext } from './WorkspaceContext'

interface WorkspaceProviderProps {
  children: React.ReactNode
}

export const WorkspaceProvider = ({
  children,
}: WorkspaceProviderProps): JSX.Element => {
  const { data: dashboardForms, isLoading } = useWorkspace()

  const totalFormsCount = useMemo(
    () => dashboardForms?.length,
    [dashboardForms?.length],
  )

  const [activeSearch, setActiveSearch] = useState<string>('')
  const [activeFilter, setActiveFilter] = useState<FilterOption | null>(null)

  const displayedForms = useMemo(() => {
    if (!dashboardForms) return []

    let displayedForms = dashboardForms

    // Filter first
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

    // Then fuzzy search
    displayedForms = fuzzysort
      .go(activeSearch, displayedForms, {
        all: true,
        key: 'title',
      })
      .map((res) => res.obj)

    return displayedForms
  }, [dashboardForms, activeFilter, activeSearch])

  const displayedFormsCount = useMemo(
    () => displayedForms.length,
    [displayedForms.length],
  )

  const defaultFilterOption = useMemo(() => 'All forms', [])

  return (
    <WorkspaceContext.Provider
      value={{
        isLoading,
        totalFormsCount,
        displayedForms,
        displayedFormsCount,
        defaultFilterOption,
        activeFilter,
        setActiveFilter,
        activeSearch,
        setActiveSearch,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}
