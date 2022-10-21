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

  const [filterOption, setFilterOption] = useState<FilterOption | undefined>()

  const displayedForms = useMemo(() => {
    if (!dashboardForms) return []
    if (!filterOption) return dashboardForms
    switch (filterOption) {
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
  }, [dashboardForms, filterOption])

  const displayedFormsCount = useMemo(
    () => displayedForms.length,
    [displayedForms.length],
  )

  const isFilterOn = useMemo(() => !!filterOption, [filterOption])

  return (
    <WorkspaceContext.Provider
      value={{
        isLoading,
        totalFormsCount,
        displayedForms,
        displayedFormsCount,
        isFilterOn,
        setFilterOption,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}
