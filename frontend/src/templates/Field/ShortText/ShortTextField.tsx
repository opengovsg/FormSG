/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
import { useMemo } from 'react'
import { useFormContext } from 'react-hook-form'

import { createTextValidationRules } from '~utils/fieldValidation'
import Input from '~components/Input'

import { PrefillMap } from '../../../features/public-form/components/FormFields/FormFields'
import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import { ShortTextFieldSchema, SingleAnswerFieldInput } from '../types'

export interface ShortTextFieldProps extends BaseFieldProps {
  schema: ShortTextFieldSchema
  prefill?: PrefillMap[string]
}

export const ShortTextField = ({
  schema,
  ...fieldContainerProps
}: ShortTextFieldProps): JSX.Element => {
  const validationRules = useMemo(
    () => createTextValidationRules(schema),
    [schema],
  )

  const { register } = useFormContext<SingleAnswerFieldInput>()

  return (
    <FieldContainer schema={schema} {...fieldContainerProps}>
      <Input
        isPrefilled={!!fieldContainerProps?.prefill?.prefillValue}
        // Prevent editing of pre-filled fields if lockPrefill is true
        isDisabled={!!fieldContainerProps?.prefill?.lockPrefill}
        aria-label={`${schema.questionNumber}. ${schema.title}`}
        defaultValue=""
        preventDefaultOnEnter
        {...register(schema._id, validationRules)}
      />
    </FieldContainer>
  )
}
