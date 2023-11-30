/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
import { useMemo } from 'react'
import { useFormContext } from 'react-hook-form'

import { FormResponseMode } from '~shared/types'

import { createUenValidationRules } from '~utils/fieldValidation'
import Input from '~components/Input'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import { SingleAnswerFieldInput, UenFieldSchema } from '../types'

export interface UenFieldProps extends BaseFieldProps {
  schema: UenFieldSchema
  responseMode: FormResponseMode
}

export const UenField = ({
  schema,
  responseMode,
}: UenFieldProps): JSX.Element => {
  const validationRules = useMemo(
    () => createUenValidationRules(schema, responseMode),
    [schema, responseMode],
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
