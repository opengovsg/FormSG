import {
  createContext,
  FC,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { isEmpty } from 'lodash'

import { EditFieldStoreState, useEditFieldStore } from './design/editFieldStore'

export enum DrawerTabs {
  Builder,
  Design,
  Logic,
}

type CreatePageDrawerContextProps = {
  activeTab: DrawerTabs | null
  isShowDrawer: boolean
  handleClose: (clearActiveTab?: boolean) => void
  handleBuilderClick: () => void
  handleDesignClick: () => void
  handleLogicClick: () => void
}

const CreatePageDrawerContext = createContext<
  CreatePageDrawerContextProps | undefined
>(undefined)

/**
 * Provider component that makes drawer context object available to any
 * child component that calls `useBuilderDrawer()`.
 */
export const CreatePageDrawerProvider: FC = ({ children }) => {
  const context = useProvideDrawerContext()

  return (
    <CreatePageDrawerContext.Provider value={context}>
      {children}
    </CreatePageDrawerContext.Provider>
  )
}

/**
 * Hook for components nested in ProvideAuth component to get the current auth object.
 */
export const useCreatePageDrawer = (): CreatePageDrawerContextProps => {
  const context = useContext(CreatePageDrawerContext)
  if (!context) {
    throw new Error(
      `useBuilderDrawer must be used within a BuilderDrawerProvider component`,
    )
  }
  return context
}

const editFieldStoreSelector = (state: EditFieldStoreState) => {
  return {
    hasActiveField: !!state.activeField,
    hasFieldToCreate: !isEmpty(state.fieldToCreate),
    clearActiveField: state.clearActiveField,
    clearFieldToCreate: state.clearFieldToCreate,
  }
}

const useProvideDrawerContext = (): CreatePageDrawerContextProps => {
  const [activeTab, setActiveTab] = useState<DrawerTabs | null>(null)
  const { hasActiveField, clearActiveField } = useEditFieldStore(
    editFieldStoreSelector,
  )

  useEffect(() => {
    if (hasActiveField) {
      setActiveTab(DrawerTabs.Builder)
    }
  }, [hasActiveField])

  const isShowDrawer = useMemo(
    () => activeTab !== null && activeTab !== DrawerTabs.Logic,
    [activeTab],
  )

  const handleClose = useCallback(
    (clearActiveTab = true) => {
      if (hasActiveField) {
        clearActiveField()
      }
      if (clearActiveTab) {
        setActiveTab(null)
      }
    },
    [clearActiveField, hasActiveField],
  )

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
