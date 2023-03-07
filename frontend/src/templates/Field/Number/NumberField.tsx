import { useMemo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import { FormColorTheme } from '~shared/types'

import { useDraftThruSearchParams } from '~hooks/useDraftThruSearchParams'
import { createNumberValidationRules } from '~utils/fieldValidation'
import NumberInput from '~components/NumberInput'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'
import { NumberFieldSchema, SingleAnswerFieldInput } from '../types'

export interface NumberFieldProps extends BaseFieldProps {
  schema: NumberFieldSchema
}

export const NumberField = ({
  schema,
  colorTheme = FormColorTheme.Blue,
}: NumberFieldProps): JSX.Element => {
  const validationRules = useMemo(
    () => createNumberValidationRules(schema),
    [schema],
  )

  const [defaultVal, updateSearchParam] = useDraftThruSearchParams(
    schema.globalId,
  )

  const { control } = useFormContext<SingleAnswerFieldInput>()

  return (
    <FieldContainer schema={schema}>
      <Controller
        control={control}
        rules={validationRules}
        name={schema._id}
        defaultValue={defaultVal}
        render={({ field: { value, onChange, ...rest } }) => (
          <NumberInput
            min={0}
            inputMode="numeric"
            colorScheme={`theme-${colorTheme}`}
            aria-label={`${schema.questionNumber}. ${schema.title}`}
            allowMouseWheel
            precision={0}
            value={value}
            preventDefaultOnEnter
            onChange={(val) => {
              // Only allow numeric inputs
              const val2 = val.replace(/\D/g, '')
              onChange(val2)
              updateSearchParam(val2)
            }}
            {...rest}
          />
        )}
      />
    </FieldContainer>
  )
}
