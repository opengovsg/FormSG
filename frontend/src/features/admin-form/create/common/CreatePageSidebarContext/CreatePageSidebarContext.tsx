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
  isDrawerOpen: boolean
  handleBuilderClick: () => void
  handleDesignClick: () => void
  handleLogicClick: () => void
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
    const isDrawerOpen = useMemo(
      () => activeTab !== null && activeTab !== DrawerTabs.Logic,
      [activeTab],
    )
    const { stateData, setFieldsToInactive } = useFieldBuilderStore(
      useCallback(
        (state) => ({
          stateData: stateDataSelector(state),
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
      // We always want to set to inactive if the state was creating (even in
      // mobile). If the state was editing something, we only want to set to
      // inactive if not mobile.
      if (stateData.state === FieldBuilderState.CreatingField || !isMobile) {
        setFieldsToInactive()
      }
      setActiveTab(null)
    }, [isMobile, setFieldsToInactive, stateData])

    return {
      activeTab,
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
