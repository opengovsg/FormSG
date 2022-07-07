import { memo, useMemo } from 'react'

import { AdminFormDto } from '~shared/types/form'

import { augmentWithQuestionNo } from '~features/form/utils'

import FieldRow from './FieldRow'

interface BuilderFieldsProps {
  fields: AdminFormDto['form_fields']
  isDraggingOver: boolean
}

export const BuilderFields = memo(
  ({ fields, isDraggingOver }: BuilderFieldsProps) => {
    const fieldsWithQuestionNos = useMemo(
      () => augmentWithQuestionNo(fields),
      [fields],
    )

    return (
      <>
        {fieldsWithQuestionNos.map((f, i) => (
          <FieldRow
            index={i}
            key={f._id}
            field={f}
            isDraggingOver={isDraggingOver}
          />
        ))}
      </>
    )
  },
  (prev, next) =>
    prev.fields === next.fields && prev.isDraggingOver === next.isDraggingOver,
)
