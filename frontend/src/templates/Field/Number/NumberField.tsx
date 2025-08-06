import { Controller, useFormContext } from 'react-hook-form'

import { FormColorTheme } from '~shared/types'

import { useNumberValidationRules } from '~utils/fieldValidation'
import NumberInput from '~components/NumberInput'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import { NumberFieldSchema, SingleAnswerFieldInput } from '../types'

export interface NumberFieldProps extends BaseFieldProps {
  schema: NumberFieldSchema
  disableRequiredValidation?: boolean
}

export const NumberField = ({
  schema,
  disableRequiredValidation,
  colorTheme = FormColorTheme.Blue,
  isHighContrast,
}: NumberFieldProps): JSX.Element => {
  const validationRules = useNumberValidationRules(
    schema,
    disableRequiredValidation,
  )
  const { control } = useFormContext<SingleAnswerFieldInput>()

  return (
    <FieldContainer schema={schema} isHighContrast={isHighContrast}>
      <Controller
        control={control}
        rules={validationRules}
        name={schema._id}
        defaultValue=""
        render={({ field: { value, onChange, ...rest } }) => (
          <NumberInput
            min={0}
            inputMode="numeric"
            colorScheme={`theme-${colorTheme}`}
            aria-label={`${schema.questionNumber}. ${schema.title}`}
            precision={0}
            value={value}
            preventDefaultOnEnter
            onChange={(val) => {
              // Only allow numeric inputs
              onChange(val.replace(/\D/g, ''))
            }}
            isHighContrast={isHighContrast}
            {...rest}
          />
        )}
      />
    </FieldContainer>
  )
}
