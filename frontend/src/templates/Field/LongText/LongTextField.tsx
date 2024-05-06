/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
import { useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import { Textarea } from '@opengovsg/design-system-react'

import { createTextValidationRules } from '~utils/fieldValidation'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import { LongTextFieldSchema, SingleAnswerFieldInput } from '../types'

export interface LongTextFieldProps extends BaseFieldProps {
  schema: LongTextFieldSchema
  disableRequiredValidation?: boolean
}

export const LongTextField = ({
  schema,
  disableRequiredValidation,
}: LongTextFieldProps): JSX.Element => {
  const validationRules = useMemo(
    () => createTextValidationRules(schema, disableRequiredValidation),
    [schema, disableRequiredValidation],
  )

  const { register } = useFormContext<SingleAnswerFieldInput>()

  return (
    <FieldContainer schema={schema}>
      <Textarea
        aria-label={`${schema.questionNumber}. ${schema.title}`}
        defaultValue=""
        {...register(schema._id, validationRules)}
      />
    </FieldContainer>
  )
}
