/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
import { useMemo } from 'react'
import { useFormContext } from 'react-hook-form'

import { FormResponseMode } from '~shared/types'

import { createTextValidationRules } from '~utils/fieldValidation'
import Textarea from '~components/Textarea'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import { LongTextFieldSchema, SingleAnswerFieldInput } from '../types'

export interface LongTextFieldProps extends BaseFieldProps {
  schema: LongTextFieldSchema
  responseMode: FormResponseMode
}

export const LongTextField = ({
  schema,
  responseMode,
}: LongTextFieldProps): JSX.Element => {
  const validationRules = useMemo(
    () => createTextValidationRules(schema, responseMode),
    [schema, responseMode],
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
