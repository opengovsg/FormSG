/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
import { useMemo } from 'react'
import { useFormContext } from 'react-hook-form'

import { FormFieldWithId, ShortTextFieldBase } from '~shared/types/field'

import { createTextValidationRules } from '~utils/fieldValidation'
import Input from '~components/Input'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'

export type ShortTextFieldSchema = FormFieldWithId<ShortTextFieldBase>
export interface ShortTextFieldProps extends BaseFieldProps {
  schema: ShortTextFieldSchema
}

export const ShortTextField = ({
  schema,
  questionNumber,
}: ShortTextFieldProps): JSX.Element => {
  const validationRules = useMemo(
    () => createTextValidationRules(schema),
    [schema],
  )

  const { register } = useFormContext()

  return (
    <FieldContainer schema={schema} questionNumber={questionNumber}>
      <Input
        aria-label={schema.title}
        {...register(schema._id, validationRules)}
      />
    </FieldContainer>
  )
}
