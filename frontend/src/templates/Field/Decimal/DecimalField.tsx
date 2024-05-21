import { useMemo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import { createDecimalValidationRules } from '~utils/fieldValidation'
import NumberInput from '~components/NumberInput'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import { DecimalFieldSchema, SingleAnswerFieldInput } from '../types'

export interface DecimalFieldProps extends BaseFieldProps {
  schema: DecimalFieldSchema
  disableRequiredValidation?: boolean
}

/**
 * @precondition Must have a parent `react-hook-form#FormProvider` component.
 */
export const DecimalField = ({
  schema,
  disableRequiredValidation,
  selectedLanguage: language,
}: DecimalFieldProps): JSX.Element => {
  const validationRules = useMemo(
    () => createDecimalValidationRules(schema, disableRequiredValidation),
    [schema, disableRequiredValidation],
  )

  const { control } = useFormContext<SingleAnswerFieldInput>()

  return (
    <FieldContainer schema={schema} selectedLanguage={language}>
      <Controller
        control={control}
        rules={validationRules}
        name={schema._id}
        defaultValue=""
        render={({ field }) => (
          <NumberInput
            inputMode="decimal"
            aria-label={`${schema.questionNumber}. ${schema.title}`}
            preventDefaultOnEnter
            {...field}
          />
        )}
      />
    </FieldContainer>
  )
}
