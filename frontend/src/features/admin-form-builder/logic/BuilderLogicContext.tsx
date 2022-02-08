import { createContext, FC, useContext, useMemo, useState } from 'react'

import { FormFieldDto } from '~shared/types/field'
import { LogicDto } from '~shared/types/form'

import { useAdminForm } from '~features/admin-form/common/queries'

export type FormFieldWithQuestionNumber = FormFieldDto & {
  questionNumber: number
}

type BuilderLogicContextProps = {
  mapIdToField: Record<FormFieldDto['_id'], FormFieldWithQuestionNumber>
  formLogics?: LogicDto[]
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

  const { data: form } = useAdminForm()

  const mapIdToField = useMemo(() => {
    if (!form) return {}
    return form.form_fields.reduce((acc, field, index) => {
      acc[field._id] = { ...field, questionNumber: index + 1 }
      return acc
    }, {} as Record<FormFieldDto['_id'], FormFieldWithQuestionNumber>)
  }, [form])

  const handleSetActiveLogicId = (id: LogicDto['_id']) => {
    setActiveLogicId(id)
  }

  const handleSetHasPendingLogic = (hasLogic: boolean) => {
    setHasPendingLogic(hasLogic)
  }

  return {
    mapIdToField,
    formLogics: form?.form_logics,
    activeLogicId,
    hasPendingLogic,
    handleSetActiveLogicId,
    handleSetHasPendingLogic,
  }
}
