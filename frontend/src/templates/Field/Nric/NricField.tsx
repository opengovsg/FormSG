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

  const { register } = useFormContext<SingleAnswerFieldInput>()

  return (
    <FieldContainer schema={schema}>
      <Input
        aria-label={schema.title}
        defaultValue=""
        preventDefaultOnEnter
        {...register(schema._id, validationRules)}
      />
    </FieldContainer>
  )
}
