import { memo, useMemo } from 'react'

import { AdminFormDto } from '~shared/types/form'

import { getBuilderQuestionNumbers } from '../utils/questionNumbers'

import FieldRow from './FieldRow'

interface BuilderFieldsProps {
  fields: AdminFormDto['form_fields']
  isDraggingOver: boolean
}

export const BuilderFields = memo(
  ({ fields, isDraggingOver }: BuilderFieldsProps) => {
    const questionNumbers = useMemo(
      () => getBuilderQuestionNumbers(fields),
      [fields],
    )

    return (
      <>
        {fields.map((f, i) => (
          <FieldRow
            index={i}
            questionNumber={questionNumbers[i]}
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
