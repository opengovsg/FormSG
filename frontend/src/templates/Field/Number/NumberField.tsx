import { useMemo } from 'react'
import { Controller } from 'react-hook-form'

import { FormFieldWithId, NumberFieldBase } from '~shared/types/field'

import { createNumberValidationRules } from '~utils/fieldValidation'
import NumberInput from '~components/NumberInput'

import { BaseFieldProps, FieldContainer } from '../FieldContainer'

export type NumberFieldSchema = FormFieldWithId<NumberFieldBase>
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

  return (
    <FieldContainer schema={schema} questionNumber={questionNumber}>
      <Controller
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
