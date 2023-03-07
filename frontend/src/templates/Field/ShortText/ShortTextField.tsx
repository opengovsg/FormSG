/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
import { useMemo } from 'react'
import { useFormContext } from 'react-hook-form'

import { useDraftThruSearchParams } from '~hooks/useDraftThruSearchParams'
import { createTextValidationRules } from '~utils/fieldValidation'
import Input from '~components/Input'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import { ShortTextFieldSchema, SingleAnswerFieldInput } from '../types'

export interface ShortTextFieldProps extends BaseFieldProps {
  schema: ShortTextFieldSchema
}

export const ShortTextField = ({
  schema,
  isPrefilled,
  ...fieldContainerProps
}: ShortTextFieldProps): JSX.Element => {
  const validationRules = useMemo(
    () => createTextValidationRules(schema),
    [schema],
  )

  const [defaultVal, updateSearchParam] = useDraftThruSearchParams(
    schema.globalId,
  )

  const { register } = useFormContext<SingleAnswerFieldInput>()
  return (
    <FieldContainer schema={schema} {...fieldContainerProps}>
      <Input
        isPrefilled={isPrefilled}
        aria-label={`${schema.questionNumber}. ${schema.title}`}
        defaultValue={defaultVal}
        preventDefaultOnEnter
        {...register(schema._id, {
          ...validationRules,
          onChange: (ev) => updateSearchParam(ev.target.value),
        })}
      />
    </FieldContainer>
  )
}
