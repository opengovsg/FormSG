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
  FieldBuilderState,
  setToInactiveSelector,
  stateDataSelector,
  useFieldBuilderStore,
} from '../../builder-and-design/useFieldBuilderStore'

export enum DrawerTabs {
  Builder,
  Design,
  Logic,
}

type CreatePageSidebarContextProps = {
  activeTab: DrawerTabs | null
  pendingTab?: DrawerTabs | null
  movePendingToActiveTab: () => void
  clearPendingTab: () => void
  handleBuilderClick: (shouldBePending: boolean) => void
  handleDesignClick: (shouldBePending: boolean) => void
  handleLogicClick: (shouldBePending: boolean) => void
  handleClose: (shouldBePending: boolean) => void
  isDrawerOpen: boolean
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
    // Pending tab can be `null` if the next tab state is to be closed.
    const [pendingTab, setPendingTab] = useState<
      DrawerTabs | null | undefined
    >()
    const isDrawerOpen = useMemo(
      () => activeTab !== null && activeTab !== DrawerTabs.Logic,
      [activeTab],
    )
    const { fieldState, setFieldsToInactive } = useFieldBuilderStore(
      useCallback(
        (state) => ({
          fieldState: stateDataSelector(state),
          setFieldsToInactive: setToInactiveSelector(state),
        }),
        [],
      ),
    )
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

    const setActiveOrPendingTab = useCallback(
      (tab: DrawerTabs | null, shouldBePending?: boolean) => {
        if (shouldBePending) {
          setPendingTab(tab)
        } else {
          setActiveTab(tab)
          if (
            tab === null &&
            // Always want to set to inactive if the state was creating, even in mobile
            (fieldState.state === FieldBuilderState.CreatingField || !isMobile)
          ) {
            setFieldsToInactive()
          }
        }
      },
      [fieldState.state, isMobile, setFieldsToInactive],
    )

    const clearPendingTab = useCallback(() => {
      setPendingTab(undefined)
    }, [])

    const handleBuilderClick = useCallback(
      (shouldBePending: boolean) =>
        setActiveOrPendingTab(DrawerTabs.Builder, shouldBePending),
      [setActiveOrPendingTab],
    )

    const handleDesignClick = useCallback(
      (shouldBePending: boolean) =>
        setActiveOrPendingTab(DrawerTabs.Design, shouldBePending),
      [setActiveOrPendingTab],
    )

    const handleLogicClick = useCallback(
      (shouldBePending: boolean) =>
        setActiveOrPendingTab(DrawerTabs.Logic, shouldBePending),
      [setActiveOrPendingTab],
    )

    const handleClose = useCallback(
      (shouldBePending: boolean) => {
        setActiveOrPendingTab(null, shouldBePending)
      },
      [setActiveOrPendingTab],
    )

    const movePendingToActiveTab = useCallback(() => {
      if (pendingTab === undefined) return
      setActiveTab(pendingTab)
      if (pendingTab === null && !isMobile) {
        setFieldsToInactive()
      }
      setPendingTab(undefined)
    }, [isMobile, pendingTab, setFieldsToInactive])

    return {
      activeTab,
      pendingTab,
      clearPendingTab,
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
