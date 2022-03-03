/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
import { useMemo } from 'react'
import { useFormContext } from 'react-hook-form'

import { FormFieldWithId, NricFieldBase } from '~shared/types/field'

import { createNricValidationRules } from '~utils/fieldValidation'
import Input from '~components/Input'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'

export type NricFieldSchema = FormFieldWithId<NricFieldBase>
export interface NricFieldProps extends BaseFieldProps {
  schema: NricFieldSchema
}

export const NricField = ({
  schema,
  questionNumber,
}: NricFieldProps): JSX.Element => {
  const validationRules = useMemo(
    () => createNricValidationRules(schema),
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
