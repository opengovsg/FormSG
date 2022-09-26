import { AdminFormDto } from '~shared/types/form'

import { augmentWithQuestionNo } from '~features/form/utils'
import { FieldIdSet } from '~features/logic/types'

import { PENDING_CREATE_FIELD_ID } from '../constants'
import {
  FieldBuilderState,
  stateDataSelector,
  useFieldBuilderStore,
} from '../useFieldBuilderStore'

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

  return (
    <>
      {fieldsWithQuestionNos.map((f, i) => (
        <FieldRow
          index={i}
          key={f._id}
          field={f}
          isHiddenByLogic={!visibleFieldIds.has(f._id)}
          isDraggingOver={isDraggingOver}
          isActive={
            stateData.state === FieldBuilderState.EditingField
              ? f._id === stateData.field._id
              : stateData.state === FieldBuilderState.CreatingField
              ? f._id === PENDING_CREATE_FIELD_ID
              : false
          }
        />
      ))}
    </>
  )
}
