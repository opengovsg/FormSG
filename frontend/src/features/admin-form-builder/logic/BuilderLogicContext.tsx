import { createContext, FC, useContext, useMemo, useState } from 'react'

import { FormFieldDto } from '~shared/types/field'
import { LogicDto } from '~shared/types/form'

import { useAdminForm } from '~features/admin-form/common/queries'

export type FormFieldWithQuestionNumber = FormFieldDto & {
  questionNumber: number
}

type BuilderLogicContextReturn = {
  /**
   * Map of field _id to form field for easy retrieval of form data when
   * rendering logic.
   */
  mapIdToField: Record<FormFieldDto['_id'], FormFieldWithQuestionNumber>
  /**
   * The array of form logic in the form.
   */
  formLogics?: LogicDto[]
  /**
   * ID of currently active logic. Used to highlight logic in the form, or to
   * disable certain components.
   */
  activeLogicId?: LogicDto['_id']
  /**
   * Whether a new logic block should be rendered and other actions disabled.
   */
  hasPendingLogic?: boolean
  /**
   * Set the active logic ID when a logic block is about to be manipulated.
   */
  handleSetActiveLogicId: (id: LogicDto['_id']) => void
  /**
   * Set whether a new logic block should be rendered and other actions disabled.
   */
  handleSetHasPendingLogic: (hasLogic: boolean) => void
}

const BuilderLogicContext = createContext<
  BuilderLogicContextReturn | undefined
>(undefined)

export const BuilderLogicProvider: FC = ({ children }) => {
  const context = useProvideLogicContext()

  return (
    <BuilderLogicContext.Provider value={context}>
      {children}
    </BuilderLogicContext.Provider>
  )
}

export const useBuilderLogic = (): BuilderLogicContextReturn => {
  const context = useContext(BuilderLogicContext)
  if (!context) {
    throw new Error(
      `useBuilderLogic must be used within a BuilderLogicProvider component`,
    )
  }
  return context
}

const useProvideLogicContext = (): BuilderLogicContextReturn => {
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

  return {
    mapIdToField,
    formLogics: form?.form_logics,
    activeLogicId,
    hasPendingLogic,
    handleSetActiveLogicId: setActiveLogicId,
    handleSetHasPendingLogic: setHasPendingLogic,
  }
}
