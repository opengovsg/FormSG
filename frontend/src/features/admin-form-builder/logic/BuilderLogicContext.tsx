import { createContext, FC, useContext, useState } from 'react'

import { LogicDto } from '~shared/types/form'

type BuilderLogicContextProps = {
  activeLogicId?: LogicDto['_id']
  hasPendingLogic?: boolean
  handleSetActiveLogicId: (id: LogicDto['_id']) => void
  handleSetHasPendingLogic: (hasLogic: boolean) => void
}

const BuilderLogicContext = createContext<BuilderLogicContextProps | undefined>(
  undefined,
)

export const BuilderLogicProvider: FC = ({ children }) => {
  const context = useProvideLogicContext()

  return (
    <BuilderLogicContext.Provider value={context}>
      {children}
    </BuilderLogicContext.Provider>
  )
}

export const useBuilderLogic = (): BuilderLogicContextProps => {
  const context = useContext(BuilderLogicContext)
  if (!context) {
    throw new Error(
      `useBuilderLogic must be used within a BuilderLogicProvider component`,
    )
  }
  return context
}

const useProvideLogicContext = (): BuilderLogicContextProps => {
  const [activeLogicId, setActiveLogicId] = useState<LogicDto['_id']>()
  const [hasPendingLogic, setHasPendingLogic] = useState<boolean>()

  const handleSetActiveLogicId = (id: LogicDto['_id']) => {
    setActiveLogicId(id)
  }

  const handleSetHasPendingLogic = (hasLogic: boolean) => {
    setHasPendingLogic(hasLogic)
  }

  return {
    activeLogicId,
    hasPendingLogic,
    handleSetActiveLogicId,
    handleSetHasPendingLogic,
  }
}
