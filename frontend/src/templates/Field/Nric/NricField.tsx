/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
import { useMemo } from 'react'
import { useFormContext } from 'react-hook-form'

import { createNricValidationRules } from '~utils/fieldValidation'
import Input from '~components/Input'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import { NricFieldSchema, SingleAnswerFieldInput } from '../types'

export interface NricFieldProps extends BaseFieldProps {
  schema: NricFieldSchema
}

export const NricField = ({ schema }: NricFieldProps): JSX.Element => {
  const validationRules = useMemo(
    () => createNricValidationRules(schema),
    [schema],
  )

  const { register, setValue } = useFormContext<SingleAnswerFieldInput>()

  return (
    <FieldContainer schema={schema}>
      <Input
        aria-label={`${schema.questionNumber}. ${schema.title}`}
        defaultValue=""
        preventDefaultOnEnter
        {...register(schema._id, {
          ...validationRules,
          onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
            setValue(schema._id, event.target.value.trim()),
        })}
      />
    </FieldContainer>
  )
}
