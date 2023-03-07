/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
import { useMemo } from 'react'
import { useFormContext } from 'react-hook-form'

import { useDraftThruSearchParams } from '~hooks/useDraftThruSearchParams'
import { createTextValidationRules } from '~utils/fieldValidation'
import Textarea from '~components/Textarea'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import { LongTextFieldSchema, SingleAnswerFieldInput } from '../types'

export interface LongTextFieldProps extends BaseFieldProps {
  schema: LongTextFieldSchema
}

export const LongTextField = ({ schema }: LongTextFieldProps): JSX.Element => {
  const validationRules = useMemo(
    () => createTextValidationRules(schema),
    [schema],
  )

  const { register } = useFormContext<SingleAnswerFieldInput>()

  const [defaultVal, updateSearchParam] = useDraftThruSearchParams(
    schema.globalId,
  )
  return (
    <FieldContainer schema={schema}>
      <Textarea
        aria-label={`${schema.questionNumber}. ${schema.title}`}
        defaultValue={defaultVal}
        {...register(schema._id, {
          ...validationRules,
          onChange: (ev) => updateSearchParam(ev.target.value),
        })}
      />
    </FieldContainer>
  )
}
