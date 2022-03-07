import {
  createContext,
  FC,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  setToInactiveSelector,
  useBuilderAndDesignStore,
} from '../../builder-and-design/useBuilderAndDesignStore'

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
  handleClose: () => void
}

const CreatePageSidebarContext = createContext<
  CreatePageSidebarContextProps | undefined
>(undefined)

export const useCreatePageSidebar = (): CreatePageSidebarContextProps => {
  const context = useContext(CreatePageSidebarContext)
  if (!context) {
    throw new Error(
      `useCreatePageSidebar must be used within a CreatePageSidebarProvider component`,
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
    const setFieldsToInactive = useBuilderAndDesignStore(setToInactiveSelector)

    // Set state to inactive whenever active tab changes
    useEffect(() => {
      setFieldsToInactive()
    }, [activeTab, setFieldsToInactive])

    const handleBuilderClick = useCallback(
      () => setActiveTab(DrawerTabs.Builder),
      [setActiveTab],
    )

    const handleDesignClick = useCallback(
      () => setActiveTab(DrawerTabs.Design),
      [setActiveTab],
    )

    const handleLogicClick = useCallback(
      () => setActiveTab(DrawerTabs.Logic),
      [setActiveTab],
    )

    const handleClose = useCallback(() => setActiveTab(null), [setActiveTab])

    return {
      activeTab,
      isDrawerOpen,
      handleBuilderClick,
      handleDesignClick,
      handleLogicClick,
      handleClose,
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
