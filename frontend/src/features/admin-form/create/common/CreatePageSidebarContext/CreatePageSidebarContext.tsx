import {
  createContext,
  FC,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { useIsMobile } from '~hooks/useIsMobile'

import {
  setToInactiveSelector,
  useBuilderAndDesignStore,
} from '../../builder-and-design/useBuilderAndDesignStore'
import {
  DesignState,
  setStateSelector,
  useDesignStore,
} from '../../builder-and-design/useDesignStore'

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
    const isMobile = useIsMobile()
    const [activeTab, setActiveTab] = useState<DrawerTabs | null>(null)
    const isDrawerOpen = useMemo(
      () => activeTab !== null && activeTab !== DrawerTabs.Logic,
      [activeTab],
    )
    const setFieldsToInactive = useBuilderAndDesignStore(setToInactiveSelector)
    const setDesignState = useDesignStore(setStateSelector)

    // Set state to inactive whenever active tab is not builder
    useEffect(() => {
      if (activeTab !== null && activeTab !== DrawerTabs.Builder) {
        setFieldsToInactive()
      }
    }, [activeTab, setFieldsToInactive])

    useEffect(() => {
      if (activeTab !== DrawerTabs.Design) setDesignState(DesignState.Inactive)
    }, [activeTab, setDesignState])

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

    const handleClose = useCallback(() => {
      if (!isMobile) {
        setFieldsToInactive()
      }
      setActiveTab(null)
    }, [isMobile, setFieldsToInactive])

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
