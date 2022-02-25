import { createContext, FC, useContext, useMemo, useState } from 'react'

export enum DrawerTabs {
  Builder,
  Design,
  Logic,
}

type CreatePageSidebarContextProps = {
  activeTab: DrawerTabs | null
  isDrawerOpen: boolean
  handleBuilderClick: () => void
  handleDesignClick: () => void
  handleLogicClick: () => void
}

const CreatePageSidebarContext = createContext<
  CreatePageSidebarContextProps | undefined
>(undefined)

export const useCreatePageSidebar = (): CreatePageSidebarContextProps => {
  const context = useContext(CreatePageSidebarContext)
  if (!context) {
    throw new Error(
      `useCreatePageDrawer must be used within a CreatePageDrawerProvider component`,
    )
  }
  return context
}

export const useCreatePageSidebarContext =
  (): CreatePageSidebarContextProps => {
    const [activeTab, setActiveTab] = useState<DrawerTabs | null>(null)
    const isDrawerOpen = useMemo(
      () => activeTab !== null && activeTab !== DrawerTabs.Logic,
      [activeTab],
    )
    const handleBuilderClick = () => setActiveTab(DrawerTabs.Builder)
    const handleDesignClick = () => setActiveTab(DrawerTabs.Design)
    const handleLogicClick = () => setActiveTab(DrawerTabs.Logic)

    return {
      activeTab,
      isDrawerOpen,
      handleBuilderClick,
      handleDesignClick,
      handleLogicClick,
    }
  }

/**
 * Provider component that makes drawer context object available to any
 * child component that calls `useCreatePageDrawer()`.
 */
export const CreatePageSidebarProvider: FC = ({ children }) => {
  const context = useCreatePageSidebarContext()

  return (
    <CreatePageSidebarContext.Provider value={context}>
      {children}
    </CreatePageSidebarContext.Provider>
  )
}
