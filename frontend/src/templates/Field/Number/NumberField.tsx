import { useMemo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import { createNumberValidationRules } from '~utils/fieldValidation'
import NumberInput from '~components/NumberInput'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import { NumberFieldSchema, SingleAnswerFieldInput } from '../types'

export interface NumberFieldProps extends BaseFieldProps {
  schema: NumberFieldSchema
}

export const NumberField = ({
  schema,
  questionNumber,
}: NumberFieldProps): JSX.Element => {
  const validationRules = useMemo(
    () => createNumberValidationRules(schema),
    [schema],
  )

  const { control } = useFormContext<SingleAnswerFieldInput>()

  return (
    <FieldContainer schema={schema} questionNumber={questionNumber}>
      <Controller
        control={control}
        rules={validationRules}
        name={schema._id}
        render={({ field: { value, onChange, ...rest } }) => (
          <NumberInput
            min={0}
            inputMode="numeric"
            aria-label={schema.title}
            allowMouseWheel
            precision={0}
            value={value}
            onChange={(val) => {
              // Only allow numeric inputs
              onChange(val.replace(/\D/g, ''))
            }}
            {...rest}
          />
        )}
      />
    </FieldContainer>
  )
}
