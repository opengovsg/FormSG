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

import { FieldListTabIndex } from '../../builder-and-design/constants'
import {
  DesignState,
  setStateSelector,
  useDesignStore,
} from '../../builder-and-design/useDesignStore'
import {
  isDirtySelector,
  setToInactiveSelector,
  useFieldBuilderStore,
} from '../../builder-and-design/useFieldBuilderStore'

export enum DrawerTabs {
  Builder,
  Design,
  Logic,
}

type CreatePageSidebarContextProps = {
  activeTab: DrawerTabs | null
  pendingTab: DrawerTabs | null
  movePendingToActiveTab: () => void
  handleBuilderClick: () => void
  handleDesignClick: () => void
  handleLogicClick: () => void
  isDrawerOpen: boolean
  handleClose: () => void
  fieldListTabIndex: FieldListTabIndex
  setFieldListTabIndex: (tabIndex: FieldListTabIndex) => void
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
    // Any pending tab due to unsaved changes.
    const [pendingTab, setPendingTab] = useState<DrawerTabs | null>(null)
    const isDrawerOpen = useMemo(
      () => activeTab !== null && activeTab !== DrawerTabs.Logic,
      [activeTab],
    )
    const setFieldsToInactive = useFieldBuilderStore(setToInactiveSelector)
    const isDirty = useFieldBuilderStore(isDirtySelector)
    const setDesignState = useDesignStore(setStateSelector)

    const [fieldListTabIndex, setFieldListTabIndex] =
      useState<FieldListTabIndex>(FieldListTabIndex.Basic)

    // Set state to inactive whenever active tab is not builder
    useEffect(() => {
      if (activeTab !== null && activeTab !== DrawerTabs.Builder) {
        setFieldsToInactive()
      }
    }, [activeTab, setFieldsToInactive])

    useEffect(() => {
      if (activeTab !== DrawerTabs.Design) setDesignState(DesignState.Inactive)
    }, [activeTab, setDesignState])

    const setPendingTabIfDirty = useCallback(
      (tab: DrawerTabs) => {
        if (isDirty) {
          setPendingTab(tab)
        } else {
          setActiveTab(tab)
        }
      },
      [isDirty],
    )

    const handleBuilderClick = useCallback(
      () => setPendingTabIfDirty(DrawerTabs.Builder),
      [setPendingTabIfDirty],
    )

    const handleDesignClick = useCallback(
      () => setPendingTabIfDirty(DrawerTabs.Design),
      [setPendingTabIfDirty],
    )

    const handleLogicClick = useCallback(
      () => setPendingTabIfDirty(DrawerTabs.Logic),
      [setPendingTabIfDirty],
    )

    const handleClose = useCallback(() => {
      if (!isMobile) {
        setFieldsToInactive()
      }
      setActiveTab(null)
    }, [isMobile, setFieldsToInactive])

    const movePendingToActiveTab = useCallback(() => {
      if (pendingTab === null) return
      setActiveTab(pendingTab)
      setPendingTab(null)
    }, [pendingTab, setActiveTab, setPendingTab])

    return {
      activeTab,
      pendingTab,
      movePendingToActiveTab,
      isDrawerOpen,
      handleBuilderClick,
      handleDesignClick,
      handleLogicClick,
      handleClose,
      fieldListTabIndex,
      setFieldListTabIndex,
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
