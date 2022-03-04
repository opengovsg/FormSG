import {
  createContext,
  FC,
  useCallback,
  useContext,
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

    const handleBuilderClick = useCallback(
      () => setActiveTab(DrawerTabs.Builder),
      [setActiveTab],
    )

    const handleDesignClick = useCallback(() => {
      setActiveTab(DrawerTabs.Design)
      setFieldsToInactive()
    }, [setActiveTab, setFieldsToInactive])

    const handleLogicClick = useCallback(() => {
      setActiveTab(DrawerTabs.Logic)
      setFieldsToInactive()
    }, [setActiveTab, setFieldsToInactive])

    const handleClose = useCallback(() => {
      setActiveTab(null)
      setFieldsToInactive()
    }, [setActiveTab, setFieldsToInactive])

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
