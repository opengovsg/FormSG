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
  activeFieldSelector,
  clearActiveFieldSelector,
  useEditFieldStore,
} from './editFieldStore'

export enum DrawerTabs {
  Builder,
  Design,
  Logic,
}

type BuilderDrawerContextProps = {
  activeTab: DrawerTabs | null
  isShowDrawer: boolean
  handleClose: () => void
  handleBuilderClick: () => void
  handleDesignClick: () => void
  handleLogicClick: () => void
}

const BuilderDrawerContext = createContext<
  BuilderDrawerContextProps | undefined
>(undefined)

/**
 * Provider component that makes drawer context object available to any
 * child component that calls `useBuilderDrawer()`.
 */
export const BuilderDrawerProvider: FC = ({ children }) => {
  const context = useProvideDrawerContext()

  return (
    <BuilderDrawerContext.Provider value={context}>
      {children}
    </BuilderDrawerContext.Provider>
  )
}

/**
 * Hook for components nested in ProvideAuth component to get the current auth object.
 */
export const useBuilderDrawer = (): BuilderDrawerContextProps => {
  const context = useContext(BuilderDrawerContext)
  if (!context) {
    throw new Error(
      `useBuilderDrawer must be used within a BuilderDrawerProvider component`,
    )
  }
  return context
}

const useProvideDrawerContext = (): BuilderDrawerContextProps => {
  const [activeTab, setActiveTab] = useState<DrawerTabs | null>(null)
  const activeField = useEditFieldStore(activeFieldSelector)
  const hasActiveField = useEditFieldStore(
    useCallback((state) => !!state.activeField, []),
  )
  const clearActiveField = useEditFieldStore(clearActiveFieldSelector)

  useEffect(() => {
    if (activeField) {
      setActiveTab(DrawerTabs.Builder)
    }
  }, [activeField])

  const isShowDrawer = useMemo(
    () => activeTab !== null && activeTab !== DrawerTabs.Logic,
    [activeTab],
  )

  const handleClose = useCallback(() => {
    if (hasActiveField) {
      clearActiveField()
    }
    setActiveTab(null)
  }, [clearActiveField, hasActiveField])

  const handleBuilderClick = () => setActiveTab(DrawerTabs.Builder)
  const handleDesignClick = () => {
    clearActiveField()
    setActiveTab(DrawerTabs.Design)
  }
  const handleLogicClick = () => {
    clearActiveField()
    setActiveTab(DrawerTabs.Logic)
  }

  return {
    activeTab,
    isShowDrawer,
    handleClose,
    handleBuilderClick,
    handleDesignClick,
    handleLogicClick,
  }
}
