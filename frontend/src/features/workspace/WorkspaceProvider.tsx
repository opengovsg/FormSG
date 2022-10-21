import { useWorkspace } from './queries'
import { WorkspaceContext } from './WorkspaceContext'

interface WorkspaceProviderProps {
  children: React.ReactNode
}

export const WorkspaceProvider = ({
  children,
}: WorkspaceProviderProps): JSX.Element => {
  const { data: dashboardForms, isLoading } = useWorkspace()

  return (
    <WorkspaceContext.Provider
      value={{
        isLoading,
        totalFormCount: dashboardForms?.length,
        sortedForms: dashboardForms ?? [], // Update when dashboardForms is actually sortable.
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}
