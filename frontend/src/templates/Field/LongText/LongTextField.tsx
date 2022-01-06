/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
import { useMemo } from 'react'
import { useFormContext } from 'react-hook-form'

import { FormFieldWithId, LongTextFieldBase } from '~shared/types/field'

import { createTextValidationRules } from '~utils/fieldValidation'
import Textarea from '~components/Textarea'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'

export type LongTextFieldSchema = FormFieldWithId<LongTextFieldBase>
export interface LongTextFieldProps extends BaseFieldProps {
  schema: LongTextFieldSchema
}

export const LongTextField = ({
  schema,
  questionNumber,
}: LongTextFieldProps): JSX.Element => {
  const validationRules = useMemo(
    () => createTextValidationRules(schema),
    [schema],
  )

  const { register } = useFormContext()

  return (
    <FieldContainer schema={schema} questionNumber={questionNumber}>
      <Textarea
        aria-label={schema.title}
        {...register(schema._id, validationRules)}
      />
    </FieldContainer>
  )
}
