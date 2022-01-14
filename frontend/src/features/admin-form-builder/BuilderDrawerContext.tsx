import {
  createContext,
  FC,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'

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

  const isShowDrawer = useMemo(
    () => activeTab !== null && activeTab !== DrawerTabs.Logic,
    [activeTab],
  )

  const handleClose = useCallback(() => setActiveTab(null), [])

  const handleBuilderClick = () => setActiveTab(DrawerTabs.Builder)
  const handleDesignClick = () => setActiveTab(DrawerTabs.Design)
  const handleLogicClick = () => setActiveTab(DrawerTabs.Logic)

  return {
    activeTab,
    isShowDrawer,
    handleClose,
    handleBuilderClick,
    handleDesignClick,
    handleLogicClick,
  }
}
