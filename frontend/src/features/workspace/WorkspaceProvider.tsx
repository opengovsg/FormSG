import { useMemo, useState } from 'react'

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

  const [activeFilter, setActiveFilter] = useState<FilterOption | null>(null)

  const displayedForms = useMemo(() => {
    if (!dashboardForms) return []
    if (!activeFilter) return dashboardForms
    switch (activeFilter) {
      case FilterOption.OpenForms:
        return dashboardForms.filter(
          (form) => form.status === FormStatus.Public,
        )
      case FilterOption.ClosedForms:
        return dashboardForms.filter(
          (form) => form.status === FormStatus.Private,
        )
      default:
        return dashboardForms
    }
  }, [dashboardForms, activeFilter])

  const displayedFormsCount = useMemo(
    () => displayedForms.length,
    [displayedForms.length],
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
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}
