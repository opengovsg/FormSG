import { AdminFormDto } from '~shared/types/form'

import { useCreatePageSidebar } from '~features/admin-form/create/common/CreatePageSidebarContext'
import { augmentWithQuestionNo } from '~features/form/utils'
import { FieldIdSet } from '~features/logic/types'

import { PENDING_CREATE_FIELD_ID } from '../constants'
import { isDirtySelector, useDirtyFieldStore } from '../useDirtyFieldStore'
import {
  FieldBuilderState,
  stateDataSelector,
  useFieldBuilderStore,
} from '../useFieldBuilderStore'
import { useDesignColorTheme } from '../utils/useDesignColorTheme'

import FieldRow from './FieldRow'

interface BuilderFieldsProps {
  fields: AdminFormDto['form_fields']
  visibleFieldIds: FieldIdSet
  isDraggingOver: boolean
}

export const BuilderFields = ({
  fields,
  visibleFieldIds,
  isDraggingOver,
}: BuilderFieldsProps) => {
  const fieldsWithQuestionNos = augmentWithQuestionNo(fields)
  const stateData = useFieldBuilderStore(stateDataSelector)

  const { handleBuilderClick } = useCreatePageSidebar()

  const activeFieldId =
    stateData.state === FieldBuilderState.EditingField
      ? stateData.field._id
      : stateData.state === FieldBuilderState.CreatingField
      ? PENDING_CREATE_FIELD_ID
      : null

  const colorTheme = useDesignColorTheme()

  const isDirty = useDirtyFieldStore(isDirtySelector)

  return (
    <>
      {fieldsWithQuestionNos.map((f, i) => {
        const activeFieldExtraProps =
          f._id === activeFieldId
            ? {
                isDraggingOver,
                fieldBuilderState: stateData.state,
              }
            : {}
        return (
          <FieldRow
            index={i}
            key={f._id}
            field={f}
            isHiddenByLogic={!visibleFieldIds.has(f._id)}
            handleBuilderClick={handleBuilderClick}
            isDirty={isDirty}
            colorTheme={colorTheme}
            {...activeFieldExtraProps}
          />
        )
      })}
    </>
  )
}
